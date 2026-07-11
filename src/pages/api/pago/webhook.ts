/**
 * POST /api/pago/webhook — notificaciones servidor-a-servidor de MercadoPago.
 *
 * MP llama a esta URL cada vez que un pago cambia de estado (aprobado,
 * rechazado, contracargo…), independiente de si el cliente volvió a la web
 * o cerró la pestaña. Es el mecanismo CONFIABLE para enterarse de los pagos;
 * el retorno del navegador es solo cortesía visual.
 *
 * v1 sin base de datos: se verifica el pago contra la API (nunca confiar en
 * el cuerpo del webhook) y se deja en los logs de Vercel. En la Fase 7, esto
 * escribirá en la DB (registrar venta, descontar stock, asociar reserva).
 */
import type { APIRoute } from 'astro';
import { mpPayment } from '../../../lib/mercadopago';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let cuerpo: any;
  try {
    cuerpo = await request.json();
  } catch {
    return new Response('bad request', { status: 400 });
  }

  // Formato: { type: 'payment', data: { id: '123456789' } }
  if (cuerpo?.type === 'payment' && cuerpo?.data?.id) {
    try {
      const pago = await mpPayment().get({ id: String(cuerpo.data.id) });
      console.log(
        `[webhook MP] pago ${pago.id} → ${pago.status} | ref ${pago.external_reference} | ${pago.transaction_amount} CLP`
      );
    } catch (err) {
      console.error('[webhook MP] error verificando pago:', err);
      // 500 → MP reintenta la notificación más tarde.
      return new Response('retry', { status: 500 });
    }
  }

  // Siempre 200 para los tipos que no procesamos: MP deja de reintentar.
  return new Response('ok', { status: 200 });
};
