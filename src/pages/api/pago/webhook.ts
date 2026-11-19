/**
 * POST /api/pago/webhook — notificaciones servidor-a-servidor de MercadoPago.
 *
 * MP llama a esta URL cada vez que un pago cambia de estado, aunque el
 * cliente haya cerrado la pestaña. Es el mecanismo CONFIABLE para enterarse
 * de los pagos (el retorno del navegador es solo cortesía visual), y por eso
 * el aviso a Martha de pagos MercadoPago sale de aquí.
 *
 * Webpay no tiene equivalente: todo pasa por el commit en /pago/retorno.
 *
 * Seguridad:
 * - Nunca se confía en el cuerpo: se consulta el pago a la API de MP.
 * - Si existe MP_WEBHOOK_SECRET (clave secreta de "Webhooks" en el panel de
 *   MP), se valida además la firma `x-signature` de la notificación.
 * - Se comprueba referencia/monto contra los metadatos del pedido.
 *
 * Funciona siempre que haya credencial de MP, aunque PASARELA_PAGO ya no sea
 * "mercadopago" (pagos iniciados antes del cambio siguen notificando).
 *
 * Limitación sin base de datos: MP puede notificar el mismo pago más de una
 * vez; Martha podría recibir dos correos con la misma referencia.
 */
import type { APIRoute } from 'astro';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { mpConfigurado, mpPayment } from '../../../lib/mercadopago';
import { problemaConPago } from '../../../lib/pasarelas/mercadopago';
import { avisarPago } from '../../../lib/avisos';
import { itemsDePedido } from '../../../lib/pasarela';

export const prerender = false;

/**
 * Validates MP's `x-signature` header (HMAC-SHA256 of a manifest string).
 * Format documented at mercadopago.cl/developers → Webhooks → "Validar origen".
 *
 * @param request - Incoming notification.
 * @param dataId - data.id from the query string.
 * @param secreto - Webhook secret from MP's panel.
 * @returns true if the signature is valid.
 */
function firmaValida(request: Request, dataId: string, secreto: string): boolean {
  const cabecera = request.headers.get('x-signature') ?? '';
  const requestId = request.headers.get('x-request-id') ?? '';
  const partes = Object.fromEntries(cabecera.split(',').map((p) => p.trim().split('=') as [string, string]));
  if (!partes.ts || !partes.v1) return false;
  const manifiesto = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${partes.ts};`;
  const esperada = Buffer.from(createHmac('sha256', secreto).update(manifiesto).digest('hex'));
  const recibida = Buffer.from(partes.v1);
  return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
}

export const POST: APIRoute = async ({ request, url }) => {
  if (!mpConfigurado()) return new Response('ok', { status: 200 });

  let cuerpo: { type?: unknown; data?: { id?: unknown } } | null;
  try {
    cuerpo = await request.json();
  } catch {
    return new Response('bad request', { status: 400 });
  }

  // Formato: { type: 'payment', data: { id: '123456789' } }
  const dataId = String(cuerpo?.data?.id ?? url.searchParams.get('data.id') ?? '');
  if (cuerpo?.type !== 'payment' || !dataId) return new Response('ok', { status: 200 });

  const secreto = process.env.MP_WEBHOOK_SECRET;
  if (secreto && !firmaValida(request, url.searchParams.get('data.id') ?? dataId, secreto)) {
    console.warn(`[webhook MP] firma inválida para ${dataId}`);
    return new Response('invalid signature', { status: 401 });
  }

  try {
    const pago = await mpPayment().get({ id: dataId });
    console.log(
      `[webhook MP] pago ${pago.id} → ${pago.status} | ref ${pago.external_reference} | ${pago.transaction_amount} CLP`
    );
    const problema = problemaConPago(pago, null);
    if (problema) {
      console.warn(`[webhook MP] pago ${pago.id} ignorado: ${problema}`);
    } else if (pago.status === 'approved') {
      await avisarPago({
        evento: 'aprobado',
        referencia: pago.external_reference ?? String(pago.id),
        monto: pago.transaction_amount ?? 0,
        medio: `MercadoPago ${pago.payment_method_id ?? ''} (${pago.id})`.trim(),
        items: await itemsDePedido(typeof pago.metadata?.pedido === 'string' ? pago.metadata.pedido : null),
      });
    }
  } catch (err) {
    console.error('[webhook MP] error verificando pago:', err);
    // 500 → MP reintenta la notificación más tarde.
    return new Response('retry', { status: 500 });
  }

  return new Response('ok', { status: 200 });
};
