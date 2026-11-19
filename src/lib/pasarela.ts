/**
 * Interfaz común de pasarela de pago — esconde si detrás corre Webpay
 * (Transbank) o Checkout Pro (MercadoPago). El resto del código (endpoint de
 * pago, página de retorno, UI) habla SOLO con esta interfaz.
 *
 * Dónde se elige la pasarela (un solo criterio por momento):
 * - Al CREAR un pago con tarjeta: la variable PASARELA_PAGO (webpay |
 *   mercadopago), por defecto "webpay" (funciona sin cuentas: Transbank
 *   publica credenciales de prueba).
 * - Al VOLVER del pago: los parámetros que trae la vuelta (token_ws/TBK_* →
 *   Webpay; payment_id/preference_id → MercadoPago). Así, si alguien cambia
 *   PASARELA_PAGO mientras un cliente está pagando, su retorno igual se
 *   verifica con la pasarela correcta.
 *
 * La transferencia bancaria no es una pasarela (no hay a quién preguntarle si
 * se pagó): vive aparte en transferencia.ts y comparte pedido.ts y avisos.ts.
 */
import { randomInt } from 'node:crypto';
import { pasarelaWebpay } from './pasarelas/webpay';
import { pasarelaMercadoPago } from './pasarelas/mercadopago';
import { avisarPago } from './avisos';
import { decodificarPedido, resolverPedido } from './pedido';

export interface ItemPago {
  id: string;
  titulo: string;
  cantidad: number;
  precioUnitario: number;
}

export interface SolicitudPago {
  tipo: 'productos' | 'reserva';
  monto: number;
  items: ItemPago[];
  referencia: string;
  /** Compact order (pedido.ts) so the return can rebuild the item list. */
  pedido: string;
  /** Site origin, e.g. https://www.huellaverde.cl, to build return URLs. */
  origen: string;
}

export interface RespuestaPago {
  /** URL completa a la que el front redirige — cada pasarela arma la suya
   *  (Webpay le agrega `?token_ws=` aquí adentro; el front nunca ve tokens). */
  urlRedireccion: string;
}

export type EstadoPago =
  | 'aprobado'
  | 'pendiente'
  | 'rechazado'
  | 'anulado'
  | 'expirado'
  | 'invalido'
  | 'error';

export interface ResultadoRetorno {
  estado: EstadoPago;
  detalle: {
    referencia: string;
    monto: number;
    medio: string;
    comprobante: string;
  } | null;
  /**
   * true only the FIRST time a payment is confirmed (Webpay commit). A page
   * reload returns false, so Martha is not notified twice.
   */
  confirmadoAhora?: boolean;
  /** Verified compact order, when the gateway could recover it. */
  pedido?: string | null;
}

export interface PasarelaPago {
  readonly id: 'webpay' | 'mercadopago';
  readonly nombre: string;
  crearPago(solicitud: SolicitudPago): Promise<RespuestaPago>;
  /** Does this return (query + POST params) belong to this gateway? */
  reconoceRetorno(params: URLSearchParams): boolean;
  /**
   * Verifies the payment against the gateway's API (never trusts the browser).
   *
   * @param params - Merged query string and POST body of the return request.
   * @param ruta - Extra path segments of /pago/retorno/... (Webpay order data).
   */
  verificarRetorno(params: URLSearchParams, ruta: string[]): Promise<ResultadoRetorno>;
}

/** Unambiguous alphabet (no 0/O, 1/I/L) so a reference is easy to dictate. */
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Unique, short reference: "HV-PR-K7Q2MX9A" (14 chars). It fits Webpay's
 * 26-char buyOrder and the comment field of any bank transfer.
 * Prefix: PR = products, RS = booking.
 *
 * @param tipo - Order type.
 * @returns A new random reference (31^8 ≈ 850 billion combinations).
 */
export function generarReferencia(tipo: 'productos' | 'reserva'): string {
  const azar = Array.from({ length: 8 }, () => ALFABETO[randomInt(ALFABETO.length)]).join('');
  return `HV-${tipo === 'productos' ? 'PR' : 'RS'}-${azar}`;
}

/**
 * Gateway used to CREATE card payments, per PASARELA_PAGO (default "webpay").
 *
 * Se lee con `process.env` y NO con `import.meta.env` a propósito: Astro
 * reemplaza `import.meta.env.X` por su valor EN EL MOMENTO DEL BUILD, y el
 * compilador borraba la rama no usada. `process.env` se lee cada vez que
 * corre la función serverless, que es lo que queremos.
 */
export function getPasarela(): PasarelaPago {
  return process.env.PASARELA_PAGO === 'mercadopago' ? pasarelaMercadoPago : pasarelaWebpay;
}

/**
 * Handles a return to /pago/retorno: detects the gateway from the params,
 * verifies the payment and, on the first confirmation, notifies Martha.
 * Never throws (any failure becomes estado "error").
 *
 * @param request - Incoming request (GET or POST, Webpay uses both).
 * @param url - Request URL.
 * @param ruta - Extra path segments after /pago/retorno/.
 * @returns The gateway (if recognized) and the normalized result.
 */
export async function procesarRetorno(
  request: Request,
  url: URL,
  ruta: string[]
): Promise<{ pasarela: PasarelaPago | null; resultado: ResultadoRetorno }> {
  const params = new URLSearchParams(url.searchParams);
  if (request.method === 'POST') {
    try {
      for (const [k, v] of new URLSearchParams(await request.text())) params.set(k, v);
    } catch {
      /* cuerpo ilegible: se sigue solo con la query */
    }
  }

  const pasarela = [pasarelaWebpay, pasarelaMercadoPago].find((p) => p.reconoceRetorno(params)) ?? null;
  if (!pasarela) return { pasarela, resultado: { estado: 'invalido', detalle: null } };

  let resultado: ResultadoRetorno;
  try {
    resultado = await pasarela.verificarRetorno(params, ruta);
  } catch (err) {
    console.error(`[retorno ${pasarela.id}] error verificando:`, err);
    return { pasarela, resultado: { estado: 'error', detalle: null } };
  }

  if (resultado.estado === 'aprobado' && resultado.confirmadoAhora && resultado.detalle) {
    await avisarPago({
      evento: 'aprobado',
      referencia: resultado.detalle.referencia,
      monto: resultado.detalle.monto,
      medio: `${pasarela.nombre} ${resultado.detalle.medio}`,
      items: await itemsDePedido(resultado.pedido),
    });
  }
  return { pasarela, resultado };
}

/**
 * Rebuilds the item list of an already paid order (no stock check).
 *
 * @param pedido - Verified compact order, or null.
 * @returns Items, or null when unavailable.
 */
export async function itemsDePedido(pedido: string | null | undefined): Promise<ItemPago[] | null> {
  const decodificado = pedido ? decodificarPedido(pedido) : null;
  if (!decodificado) return null;
  try {
    return (await resolverPedido(decodificado, { validarStock: false })).items;
  } catch {
    return null;
  }
}
