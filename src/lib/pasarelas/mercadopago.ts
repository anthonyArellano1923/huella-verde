/**
 * Implementación de PasarelaPago para MercadoPago Checkout Pro.
 *
 * crearPago: crea una "preferencia" (ítems, URLs de retorno y metadatos) y
 * devuelve el init_point de MP como URL de redirección. En `metadata` va la
 * referencia, el pedido codificado y el monto calculado por el servidor:
 * MercadoPago los copia a cada pago, y así el webhook y el retorno pueden
 * comprobar que el pago corresponde a ESE pedido y a ESE monto.
 *
 * verificarRetorno: MP redirige con query params (?payment_id=&status=...)
 * que trae el navegador y podrían falsificarse. Por eso:
 * 1. El estado se consulta a la API de MP con el payment_id (fuente de verdad).
 * 2. La referencia del pago debe ser la misma que va en la URL de retorno
 *    (?ref=), y el monto pagado igual al que calculó el servidor. Sin esto,
 *    cualquiera podía pegar el payment_id de una compra vieja y mostrar un
 *    "comprobante aprobado" de otro pedido.
 * 3. En el sitio real, un pago de prueba (live_mode=false) no vale.
 *
 * El aviso a Martha NO sale del retorno (el cliente puede cerrar la pestaña):
 * sale del webhook, ver api/pago/webhook.ts.
 */
import type { PasarelaPago, ResultadoRetorno } from '../pasarela';
import { mpPreference, mpPayment, type PagoMP } from '../mercadopago';
import { esProduccion } from '../errores';

/**
 * Checks that a payment belongs to the expected order and amount.
 *
 * @param pago - Payment as returned by MP's API.
 * @param referenciaEsperada - Reference from our return URL (null = skip that check).
 * @returns null if valid, or the reason it is not.
 */
export function problemaConPago(pago: PagoMP, referenciaEsperada: string | null): string | null {
  if (esProduccion() && pago.live_mode === false) return 'pago de prueba en producción';
  if (referenciaEsperada !== null && pago.external_reference !== referenciaEsperada) {
    return `referencia ${pago.external_reference} ≠ ${referenciaEsperada}`;
  }
  const montoEsperado = Number(pago.metadata?.monto);
  if (!montoEsperado || pago.transaction_amount !== montoEsperado) {
    return `monto ${pago.transaction_amount} ≠ ${pago.metadata?.monto}`;
  }
  return null;
}

export const pasarelaMercadoPago: PasarelaPago = {
  id: 'mercadopago',
  nombre: 'MercadoPago',

  async crearPago({ items, monto, referencia, pedido, origen }) {
    const vuelta = `${origen}/pago/retorno?ref=${encodeURIComponent(referencia)}`;
    const preferencia = await mpPreference().create({
      body: {
        items: items.map((i) => ({
          id: i.id,
          title: i.titulo,
          quantity: i.cantidad,
          unit_price: i.precioUnitario,
          currency_id: 'CLP',
        })),
        external_reference: referencia,
        metadata: { referencia, pedido, monto },
        back_urls: { success: vuelta, failure: vuelta, pending: vuelta },
        // Vuelve solo automáticamente si el pago fue aprobado; en los demás
        // casos MP muestra un botón "volver al sitio".
        auto_return: 'approved',
        statement_descriptor: 'HUELLA VERDE',
        notification_url: `${origen}/api/pago/webhook`,
      },
    });
    if (!preferencia.init_point) throw new Error('MercadoPago no devolvió init_point');
    return { urlRedireccion: preferencia.init_point };
  },

  reconoceRetorno(params) {
    return ['payment_id', 'collection_id', 'preference_id'].some((k) => params.has(k));
  },

  async verificarRetorno(params): Promise<ResultadoRetorno> {
    const paymentId = params.get('payment_id') ?? params.get('collection_id');
    // El cliente volvió con "volver al sitio" sin pagar.
    if (!paymentId || paymentId === 'null') return { estado: 'anulado', detalle: null };

    const pago = await mpPayment().get({ id: paymentId });
    const problema = problemaConPago(pago, params.get('ref'));
    if (problema) {
      console.warn(`[retorno mercadopago] pago ${paymentId} rechazado: ${problema}`);
      return { estado: 'invalido', detalle: null };
    }

    const estado =
      pago.status === 'approved'
        ? 'aprobado'
        : pago.status === 'in_process' || pago.status === 'pending'
          ? 'pendiente' // ej: pago en efectivo — se acredita después
          : 'rechazado';
    return {
      estado,
      confirmadoAhora: false, // el aviso a Martha lo manda el webhook
      pedido: typeof pago.metadata?.pedido === 'string' ? pago.metadata.pedido : null,
      detalle:
        estado === 'rechazado'
          ? null
          : {
              referencia: pago.external_reference ?? '—',
              monto: pago.transaction_amount ?? 0,
              medio: pago.payment_method_id ?? 'MercadoPago',
              comprobante: String(pago.id),
            },
    };
  },
};
