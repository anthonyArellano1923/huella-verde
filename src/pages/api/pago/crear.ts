/**
 * POST /api/pago/crear — inicia un pago con la pasarela activa (Webpay o
 * MercadoPago, según PASARELA_PAGO).
 *
 * Corre como función serverless (prerender = false). El navegador manda QUÉ
 * quiere pagar (slugs y cantidades, o servicio+tamaño); el TOTAL se calcula
 * SIEMPRE aquí, leyendo los precios del catálogo y de servicios.ts. Un
 * cliente malicioso podría editar el JavaScript de su navegador, pero no
 * puede inventarse un precio: este código es el que manda.
 *
 * Respuesta: { url } — el front redirige directo a esa URL, sin importar
 * qué pasarela corre detrás.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getServicio, getTamano } from '../../../data/servicios';
import { getPasarela, generarReferencia, type ItemPago } from '../../../lib/pasarela';

export const prerender = false;

interface ItemProducto {
  slug: string;
  qty: number;
}

const json = (cuerpo: object, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request, url }) => {
  let cuerpo: any;
  try {
    cuerpo = await request.json();
  } catch {
    return json({ error: 'El cuerpo debe ser JSON.' }, 400);
  }

  const items: ItemPago[] = [];
  let monto = 0;
  let tipo: 'productos' | 'reserva';

  if (cuerpo.tipo === 'productos') {
    tipo = 'productos';
    const pedidos: ItemProducto[] = Array.isArray(cuerpo.items) ? cuerpo.items : [];
    if (pedidos.length === 0) return json({ error: 'El carrito está vacío.' }, 400);

    const prendas = await getCollection('prendas');
    for (const item of pedidos) {
      const prenda = prendas.find((p) => p.id === item.slug);
      if (!prenda) return json({ error: `Producto desconocido: ${item.slug}` }, 400);

      const qty = Number(item.qty);
      if (!Number.isInteger(qty) || qty < 1 || qty > 10) {
        return json({ error: `Cantidad inválida para ${prenda.data.nombre}.` }, 400);
      }
      if (qty > prenda.data.stock) {
        return json({ error: `Solo quedan ${prenda.data.stock} de "${prenda.data.nombre}".` }, 409);
      }
      monto += prenda.data.precio * qty;
      items.push({
        id: prenda.id,
        titulo: `${prenda.data.nombre} (talla ${prenda.data.talla})`,
        cantidad: qty,
        precioUnitario: prenda.data.precio,
      });
    }
  } else if (cuerpo.tipo === 'reserva') {
    tipo = 'reserva';
    const servicio = getServicio(String(cuerpo.servicioId));
    const tamano = getTamano(String(cuerpo.tamanoId));
    if (!servicio || !tamano) return json({ error: 'Servicio o tamaño desconocido.' }, 400);
    if (!servicio.precioDesdePorTamano) {
      return json({ error: `"${servicio.nombre}" se cotiza por WhatsApp; no tiene pago online.` }, 400);
    }
    // Se cobra el precio base "desde"; la diferencia por complejidad de
    // raza (si aplica) se paga en el local.
    monto = servicio.precioDesdePorTamano[tamano.id];
    items.push({
      id: `${servicio.id}-${tamano.id}`,
      titulo: `Reserva: ${servicio.nombre} (perro ${tamano.nombre.toLowerCase()})`,
      cantidad: 1,
      precioUnitario: monto,
    });
  } else {
    return json({ error: 'tipo debe ser "productos" o "reserva".' }, 400);
  }

  const referencia = generarReferencia(tipo);
  const pasarela = getPasarela();

  try {
    const { urlRedireccion } = await pasarela.crearPago({
      tipo,
      monto,
      items,
      referencia,
      returnUrl: new URL('/pago/retorno', url.origin).href,
      notifyUrl: new URL('/api/pago/webhook', url.origin).href,
    });
    return json({ url: urlRedireccion });
  } catch (err) {
    console.error(`Error creando pago (${pasarela.id}):`, err);
    const sinToken = err instanceof Error && err.message.includes('MP_ACCESS_TOKEN');
    if (sinToken) {
      return json({ error: 'El pago online aún no está configurado (falta la credencial de MercadoPago).' }, 503);
    }
    return json({ error: `No pudimos conectar con ${pasarela.nombre}. Intenta de nuevo en un momento.` }, 502);
  }
};
