/**
 * POST /api/pago/transferencia — el cliente declara "ya transferí".
 *
 * Recibe la orden firmada que muestra /pago/transferencia (ref, p, m, s),
 * comprueba la firma (nadie puede inventar montos ni ítems) y avisa a
 * Martha por correo. NO confirma el pago: solo Martha puede verlo en su
 * banco. El navegador abre WhatsApp después, para enviar el comprobante.
 *
 * Respuestas: 200 { ok: true } · 400 cuerpo o firma inválidos.
 */
import type { APIRoute } from 'astro';
import { exigirTransferenciaDisponible, leerOrdenFirmada } from '../../../lib/transferencia';
import { avisarPago } from '../../../lib/avisos';
import { itemsDePedido } from '../../../lib/pasarela';
import { ConfigError } from '../../../lib/errores';

export const prerender = false;

const json = (cuerpo: object, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return json({ error: 'El cuerpo debe ser JSON.' }, 400);
  }
  if (typeof cuerpo !== 'object' || cuerpo === null || Array.isArray(cuerpo)) {
    return json({ error: 'El cuerpo debe ser un objeto JSON.' }, 400);
  }

  try {
    // Sin datos bancarios reales no hay transferencia que avisar (503).
    exigirTransferenciaDisponible();
    const orden = leerOrdenFirmada(cuerpo as Record<string, unknown>);
    if (!orden) return json({ error: 'Orden de transferencia inválida.' }, 400);

    await avisarPago({
      evento: 'transferencia',
      referencia: orden.ref,
      monto: orden.monto,
      medio: 'Transferencia bancaria (por verificar)',
      items: await itemsDePedido(orden.pedido),
    });
    return json({ ok: true });
  } catch (err) {
    if (err instanceof ConfigError) return json({ error: 'Pago por transferencia no configurado.' }, 503);
    throw err;
  }
};
