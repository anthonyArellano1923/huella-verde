/**
 * POST /api/pago/crear — inicia una transacción Webpay Plus.
 *
 * Corre como función serverless (prerender = false). El navegador manda QUÉ
 * quiere pagar (slugs y cantidades, o servicio+tamaño); el TOTAL se calcula
 * SIEMPRE aquí, leyendo los precios del catálogo y de servicios.ts. Un
 * cliente malicioso podría editar el JavaScript de su navegador, pero no
 * puede inventarse un precio: este código es el que manda.
 *
 * Respuesta: { url, token } → el front redirige a `url?token_ws=token`,
 * el cliente paga en el sitio de Transbank y Webpay lo devuelve a
 * /pago/retorno con el mismo token.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getServicio, getTamano } from '../../../data/servicios';
import { webpayTransaction, generarBuyOrder } from '../../../lib/transbank';

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

  let monto = 0;
  let tipo: 'productos' | 'reserva';

  if (cuerpo.tipo === 'productos') {
    tipo = 'productos';
    const items: ItemProducto[] = Array.isArray(cuerpo.items) ? cuerpo.items : [];
    if (items.length === 0) return json({ error: 'El carrito está vacío.' }, 400);

    const prendas = await getCollection('prendas');
    for (const item of items) {
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
    }
  } else if (cuerpo.tipo === 'reserva') {
    tipo = 'reserva';
    const servicio = getServicio(String(cuerpo.servicioId));
    const tamano = getTamano(String(cuerpo.tamanoId));
    if (!servicio || !tamano) return json({ error: 'Servicio o tamaño desconocido.' }, 400);
    monto = servicio.precioPorTamano[tamano.id];
  } else {
    return json({ error: 'tipo debe ser "productos" o "reserva".' }, 400);
  }

  const buyOrder = generarBuyOrder(tipo);
  // sessionId identifica la sesión de pago; sin base de datos todavía
  // (Fase 7), usamos un resumen corto para reconocer el pago en el retorno.
  const sessionId = buyOrder;
  const returnUrl = new URL('/pago/retorno', url.origin).href;

  try {
    const tx = webpayTransaction();
    const respuesta = await tx.create(buyOrder, sessionId, monto, returnUrl);
    return json({ url: respuesta.url, token: respuesta.token });
  } catch (err) {
    console.error('Error creando transacción Webpay:', err);
    return json({ error: 'No pudimos conectar con Webpay. Intenta de nuevo en un momento.' }, 502);
  }
};
