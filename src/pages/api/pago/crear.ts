/**
 * POST /api/pago/crear — crea una "preferencia" de MercadoPago Checkout Pro.
 *
 * Corre como función serverless (prerender = false). El navegador manda QUÉ
 * quiere pagar (slugs y cantidades, o servicio+tamaño); los PRECIOS se leen
 * SIEMPRE aquí, del catálogo y de servicios.ts. Un cliente malicioso podría
 * editar el JavaScript de su navegador, pero no puede inventarse un precio.
 *
 * Flujo Checkout Pro: crear preferencia (los ítems y URLs de retorno) →
 * responder { url } (el init_point de MP) → el front redirige → el cliente
 * paga en el sitio de MercadoPago → MP lo devuelve a /pago/retorno con
 * payment_id, y ahí se verifica el estado real consultando la API.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getServicio, getTamano } from '../../../data/servicios';
import { mpPreference, generarReferencia } from '../../../lib/mercadopago';

export const prerender = false;

interface ItemProducto {
  slug: string;
  qty: number;
}

interface ItemPreferencia {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: 'CLP';
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

  const items: ItemPreferencia[] = [];
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
      items.push({
        id: prenda.id,
        title: `${prenda.data.nombre} (talla ${prenda.data.talla})`,
        quantity: qty,
        unit_price: prenda.data.precio,
        currency_id: 'CLP',
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
    items.push({
      id: `${servicio.id}-${tamano.id}`,
      title: `Reserva: ${servicio.nombre} (perro ${tamano.nombre.toLowerCase()})`,
      quantity: 1,
      unit_price: servicio.precioDesdePorTamano[tamano.id],
      currency_id: 'CLP',
    });
  } else {
    return json({ error: 'tipo debe ser "productos" o "reserva".' }, 400);
  }

  const referencia = generarReferencia(tipo);
  const retorno = new URL('/pago/retorno', url.origin).href;

  try {
    const preferencia = await mpPreference().create({
      body: {
        items,
        external_reference: referencia,
        back_urls: { success: retorno, failure: retorno, pending: retorno },
        // Vuelve solo automáticamente si el pago fue aprobado; en los demás
        // casos MP muestra un botón "volver al sitio".
        auto_return: 'approved',
        statement_descriptor: 'HUELLA VERDE',
        notification_url: new URL('/api/pago/webhook', url.origin).href,
      },
    });
    if (!preferencia.init_point) throw new Error('MercadoPago no devolvió init_point');
    return json({ url: preferencia.init_point });
  } catch (err) {
    console.error('Error creando preferencia de MercadoPago:', err);
    const sinToken = err instanceof Error && err.message.includes('MP_ACCESS_TOKEN');
    return json(
      {
        error: sinToken
          ? 'El pago online aún no está configurado (falta la credencial de MercadoPago).'
          : 'No pudimos conectar con MercadoPago. Intenta de nuevo en un momento.',
      },
      sinToken ? 503 : 502
    );
  }
};
