/**
 * POST /api/pago/crear — inicia un pago: con tarjeta (pasarela activa según
 * PASARELA_PAGO) o por transferencia bancaria.
 *
 * Corre como función serverless (prerender = false). El navegador manda QUÉ
 * quiere pagar; el TOTAL se calcula SIEMPRE aquí, leyendo los precios del
 * catálogo y de servicios.ts (ver lib/pedido.ts).
 *
 * Cuerpo:
 *   { tipo: 'productos', items: [{ id: 'plantas/cinta', qty: 2 }], medio?: 'tarjeta' | 'transferencia' }
 *   { tipo: 'reserva', servicioId: 'bano', tamanoId: 'mediano', medio?: ... }
 *
 * Respuestas:
 *   200 { url, referencia }  → el front redirige a `url`
 *   400 pedido mal formado · 409 sin stock suficiente
 *   503 pago no disponible: interruptor PAGOS_ONLINE=off (tarjeta), faltan
 *       credenciales o datos bancarios
 *   502 la pasarela no respondió
 */
import type { APIRoute } from 'astro';
import { getPasarela, generarReferencia } from '../../../lib/pasarela';
import { ErrorPedido, codificarPedido, parsearPedido, resolverPedido } from '../../../lib/pedido';
import {
  exigirTransferenciaDisponible,
  transferenciaDisponible,
  urlTransferencia,
} from '../../../lib/transferencia';
import { interruptorPagosOnline } from '../../../lib/disponibilidad';
import { ConfigError } from '../../../lib/errores';

export const prerender = false;

const json = (cuerpo: object, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });

/**
 * Customer-facing 503 message when card payment is unavailable. It only
 * suggests transfer when transfer can actually be offered.
 */
const mensajeTarjetaNoDisponible = () =>
  transferenciaDisponible()
    ? 'El pago con tarjeta no está disponible en este momento. Puedes pagar por transferencia o escribirnos por WhatsApp.'
    : 'El pago online no está disponible en este momento. Escríbenos por WhatsApp y coordinamos el pago.';

export const POST: APIRoute = async ({ request, url }) => {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return json({ error: 'El cuerpo debe ser JSON.' }, 400);
  }

  const medio = (cuerpo as { medio?: unknown } | null)?.medio ?? 'tarjeta';
  if (medio !== 'tarjeta' && medio !== 'transferencia') {
    return json({ error: 'medio debe ser "tarjeta" o "transferencia".' }, 400);
  }

  // Interruptor de apagado: se revisa ANTES de tocar catálogo o pasarela,
  // para productos y reservas por igual.
  if (medio === 'tarjeta' && !interruptorPagosOnline()) {
    return json({ error: mensajeTarjetaNoDisponible() }, 503);
  }

  const pasarela = medio === 'tarjeta' ? getPasarela() : null;
  try {
    const pedido = parsearPedido(cuerpo);
    const { tipo, items, monto } = await resolverPedido(pedido);
    const referencia = generarReferencia(tipo);
    const pedidoCodificado = codificarPedido(pedido);

    if (!pasarela) {
      exigirTransferenciaDisponible();
      const destino = urlTransferencia({ ref: referencia, pedido: pedidoCodificado, monto });
      return json({ url: destino, referencia });
    }

    const { urlRedireccion } = await pasarela.crearPago({
      tipo,
      monto,
      items,
      referencia,
      pedido: pedidoCodificado,
      origen: url.origin,
    });
    return json({ url: urlRedireccion, referencia });
  } catch (err) {
    if (err instanceof ErrorPedido) return json({ error: err.message }, err.status);
    if (err instanceof ConfigError) {
      console.error(`[crear] configuración incompleta: ${err.message}`);
      return json(
        {
          error:
            medio === 'transferencia'
              ? 'El pago por transferencia aún no está disponible. Escríbenos por WhatsApp.'
              : mensajeTarjetaNoDisponible(),
        },
        503
      );
    }
    console.error(`[crear] error con ${pasarela?.id ?? medio}:`, err);
    return json(
      { error: `No pudimos conectar con ${pasarela?.nombre ?? 'el pago'}. Intenta de nuevo en un momento.` },
      502
    );
  }
};
