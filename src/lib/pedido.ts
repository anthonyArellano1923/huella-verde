/**
 * Armado y validación de pedidos — la ÚNICA puerta por la que entra un
 * pedido al flujo de pago (tarjeta o transferencia).
 *
 * Qué hace:
 * 1. Valida lo que manda el navegador (forma del JSON, ids, cantidades) y
 *    responde 400 ante cualquier cosa rara, en vez de reventar con 500.
 * 2. Suma cantidades del mismo producto antes de comparar con el stock: así
 *    repetir el mismo id en el carrito no sirve para comprar más de lo que hay.
 * 3. Calcula el total leyendo los precios del catálogo (nunca del navegador).
 * 4. Codifica el pedido en un texto corto ("pl:cinta:2,ac:sustrato:1") para
 *    que viaje firmado en URLs (ver firma.ts) sin base de datos.
 *
 * Contrato con el catálogo: ids "<coleccion>/<slug>" con coleccion en
 * COLECCIONES. Cada entrada debe tener `nombre`, `precio` (entero CLP) y
 * `stock` (entero); `talla` es opcional (solo prendas). Si una colección no
 * existe en esta rama, se ignora (sus productos dan "desconocido").
 */
import { getCollection } from 'astro:content';
import { getServicio, getTamano } from '../data/servicios';
import type { ItemPago } from './pasarela';

/** Shop collections the cart may reference, with their short code for URLs. */
export const COLECCIONES = { prendas: 'pr', plantas: 'pl', accesorios: 'ac' } as const;
export type Coleccion = keyof typeof COLECCIONES;

/** Max units per product line (same cap as the cart UI). */
const MAX_POR_PRODUCTO = 10;
/** Max distinct lines per order (keeps signed URLs short and abuse low). */
const MAX_LINEAS = 20;
/** Product slugs are kebab-case: letters, digits and hyphens. */
const PATRON_SLUG = /^[a-z0-9][a-z0-9-]{0,79}$/;

/** One requested product line: id "<coleccion>/<slug>" and quantity. */
export interface LineaPedido {
  coleccion: Coleccion;
  slug: string;
  qty: number;
}

/** What the customer wants to pay for, before prices are looked up. */
export type Pedido =
  | { tipo: 'productos'; lineas: LineaPedido[] }
  | { tipo: 'reserva'; servicioId: string; tamanoId: string };

/** A priced order, ready to send to a payment method. */
export interface PedidoResuelto {
  tipo: 'productos' | 'reserva';
  items: ItemPago[];
  monto: number;
}

/** Validation error carrying the HTTP status the API should answer with. */
export class ErrorPedido extends Error {
  constructor(
    message: string,
    readonly status: 400 | 409
  ) {
    super(message);
    this.name = 'ErrorPedido';
  }
}

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Parses "<coleccion>/<slug>" (or a bare legacy slug, meaning "prendas").
 *
 * @param id - Raw id from the browser.
 * @returns The parsed collection and slug.
 * @throws ErrorPedido (400) when the id is malformed or the collection unknown.
 */
function parsearId(id: unknown): { coleccion: Coleccion; slug: string } {
  if (typeof id !== 'string') throw new ErrorPedido('Cada producto necesita un id de texto.', 400);
  const [coleccion, slug, ...resto] = id.includes('/') ? id.split('/') : ['prendas', id];
  if (resto.length > 0 || !(coleccion in COLECCIONES) || !PATRON_SLUG.test(slug ?? '')) {
    throw new ErrorPedido(`Producto desconocido: ${id.slice(0, 60)}`, 400);
  }
  return { coleccion: coleccion as Coleccion, slug };
}

/**
 * Validates the JSON body sent by the browser and turns it into a Pedido.
 *
 * Accepted shapes:
 * - { tipo: 'productos', items: [{ id: 'plantas/cinta', qty: 2 }, ...] }
 *   (legacy { slug } instead of { id } is accepted and means "prendas/<slug>")
 * - { tipo: 'reserva', servicioId, tamanoId }
 *
 * Repeated ids are merged (quantities added) so the stock check sees the total.
 *
 * @param cuerpo - Parsed JSON body (any shape).
 * @returns The validated order.
 * @throws ErrorPedido (400) for any malformed input.
 */
export function parsearPedido(cuerpo: unknown): Pedido {
  if (!esObjeto(cuerpo)) throw new ErrorPedido('El cuerpo debe ser un objeto JSON.', 400);

  if (cuerpo.tipo === 'reserva') {
    if (typeof cuerpo.servicioId !== 'string' || typeof cuerpo.tamanoId !== 'string') {
      throw new ErrorPedido('Servicio o tamaño desconocido.', 400);
    }
    return { tipo: 'reserva', servicioId: cuerpo.servicioId, tamanoId: cuerpo.tamanoId };
  }

  if (cuerpo.tipo !== 'productos') {
    throw new ErrorPedido('tipo debe ser "productos" o "reserva".', 400);
  }
  if (!Array.isArray(cuerpo.items) || cuerpo.items.length === 0) {
    throw new ErrorPedido('El carrito está vacío.', 400);
  }
  if (cuerpo.items.length > MAX_LINEAS) {
    throw new ErrorPedido(`Máximo ${MAX_LINEAS} productos distintos por pedido.`, 400);
  }

  // Sumar por id: dos líneas "plantas/cinta" × 1 cuentan como 2 unidades.
  const porId = new Map<string, LineaPedido>();
  for (const item of cuerpo.items) {
    if (!esObjeto(item)) throw new ErrorPedido('Formato de producto inválido.', 400);
    const { coleccion, slug } = parsearId(item.id ?? item.slug);
    const qty = item.qty;
    if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 1 || qty > MAX_POR_PRODUCTO) {
      throw new ErrorPedido(`Cantidad inválida para ${coleccion}/${slug}.`, 400);
    }
    const clave = `${coleccion}/${slug}`;
    const previa = porId.get(clave);
    porId.set(clave, { coleccion, slug, qty: (previa?.qty ?? 0) + qty });
  }
  return { tipo: 'productos', lineas: [...porId.values()] };
}

/** Minimal shape the payment flow needs from any catalog entry. */
interface ProductoCatalogo {
  id: string;
  data: { nombre: string; precio: number; stock: number; talla?: string };
}

/**
 * Loads one collection tolerantly: if it is not defined in this branch (the
 * catalog session adds plantas/accesorios), it returns an empty list.
 *
 * @param coleccion - Collection name.
 * @returns The entries, or [] when the collection does not exist.
 */
async function cargarColeccion(coleccion: Coleccion): Promise<ProductoCatalogo[]> {
  try {
    // `as never`: el tipo de getCollection solo conoce las colecciones de
    // ESTA rama; plantas/accesorios llegan con la rama de catálogo.
    return ((await getCollection(coleccion as never)) ?? []) as unknown as ProductoCatalogo[];
  } catch {
    return [];
  }
}

/**
 * Prices an order using the catalog and servicios.ts (never browser prices).
 *
 * @param pedido - Validated order.
 * @param opciones.validarStock - false when re-reading an already paid order
 *   (stock may have changed since; the payment is real anyway).
 * @returns Items with server-side prices and the total amount in CLP.
 * @throws ErrorPedido 400 (unknown product/service) or 409 (not enough stock).
 */
export async function resolverPedido(
  pedido: Pedido,
  { validarStock = true }: { validarStock?: boolean } = {}
): Promise<PedidoResuelto> {
  if (pedido.tipo === 'reserva') {
    const servicio = getServicio(pedido.servicioId);
    const tamano = getTamano(pedido.tamanoId);
    if (!servicio || !tamano) throw new ErrorPedido('Servicio o tamaño desconocido.', 400);
    if (!servicio.precioDesdePorTamano) {
      throw new ErrorPedido(`"${servicio.nombre}" se cotiza por WhatsApp; no tiene pago online.`, 400);
    }
    // Se cobra el precio base "desde"; la diferencia por complejidad de
    // raza (si aplica) se paga en el local.
    const monto = servicio.precioDesdePorTamano[tamano.id];
    return {
      tipo: 'reserva',
      monto,
      items: [
        {
          id: `reserva/${servicio.id}-${tamano.id}`,
          titulo: `Reserva: ${servicio.nombre} (perro ${tamano.nombre.toLowerCase()})`,
          cantidad: 1,
          precioUnitario: monto,
        },
      ],
    };
  }

  const catalogo = new Map<Coleccion, ProductoCatalogo[]>();
  const items: ItemPago[] = [];
  let monto = 0;

  for (const linea of pedido.lineas) {
    if (!catalogo.has(linea.coleccion)) catalogo.set(linea.coleccion, await cargarColeccion(linea.coleccion));
    const producto = catalogo.get(linea.coleccion)!.find((p) => p.id === linea.slug);
    if (!producto) throw new ErrorPedido(`Producto desconocido: ${linea.coleccion}/${linea.slug}`, 400);

    const { nombre, precio, stock, talla } = producto.data;
    if (validarStock && linea.qty > stock) {
      throw new ErrorPedido(
        stock === 0 ? `"${nombre}" está agotado.` : `Solo quedan ${stock} de "${nombre}".`,
        409
      );
    }
    monto += precio * linea.qty;
    items.push({
      id: `${linea.coleccion}/${linea.slug}`,
      titulo: talla && talla !== 'única' ? `${nombre} (talla ${talla})` : nombre,
      cantidad: linea.qty,
      precioUnitario: precio,
    });
  }
  return { tipo: 'productos', items, monto };
}

/**
 * Serializes an order into a short URL-safe text.
 * Products: "p~pl:cinta:2,ac:sustrato:1". Booking: "r~bano:mediano".
 *
 * @param pedido - Validated order.
 * @returns Compact text to sign and put in a URL.
 */
export function codificarPedido(pedido: Pedido): string {
  if (pedido.tipo === 'reserva') return `r~${pedido.servicioId}:${pedido.tamanoId}`;
  return 'p~' + pedido.lineas.map((l) => `${COLECCIONES[l.coleccion]}:${l.slug}:${l.qty}`).join(',');
}

/**
 * Inverse of codificarPedido. Only call it on text whose signature was checked.
 *
 * @param texto - Compact order text.
 * @returns The order, or null if the text is malformed.
 */
export function decodificarPedido(texto: string): Pedido | null {
  const [tipo, cuerpo] = texto.split('~');
  if (!cuerpo) return null;
  if (tipo === 'r') {
    const [servicioId, tamanoId] = cuerpo.split(':');
    return servicioId && tamanoId ? { tipo: 'reserva', servicioId, tamanoId } : null;
  }
  if (tipo !== 'p') return null;
  const porCodigo = Object.fromEntries(Object.entries(COLECCIONES).map(([k, v]) => [v, k as Coleccion]));
  const lineas: LineaPedido[] = [];
  for (const parte of cuerpo.split(',')) {
    const [codigo, slug, qty] = parte.split(':');
    const coleccion = porCodigo[codigo];
    if (!coleccion || !slug || !Number(qty)) return null;
    lineas.push({ coleccion, slug, qty: Number(qty) });
  }
  return { tipo: 'productos', lineas };
}
