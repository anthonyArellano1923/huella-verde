/**
 * Implementación de PasarelaPago para MercadoPago Checkout Pro.
 *
 * crearPago: crea una "preferencia" (los ítems y URLs de retorno) y devuelve
 * el init_point de MP como URL de redirección.
 *
 * verificarRetorno: MP redirige con query params (?payment_id=&status=...)
 * pero esos los trae el navegador del cliente y podrían falsificarse. Por
 * eso el estado se obtiene consultando el payment_id directamente contra la
 * API de MercadoPago con el access token: la única fuente de verdad.
 */
import type { PasarelaPago } from '../pasarela';
import { mpPreference, mpPayment } from '../mercadopago';

export const pasarelaMercadoPago: PasarelaPago = {
  id: 'mercadopago',
  nombre: 'MercadoPago',

  async crearPago({ items, referencia, returnUrl, notifyUrl }) {
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
        back_urls: { success: returnUrl, failure: returnUrl, pending: returnUrl },
        // Vuelve solo automáticamente si el pago fue aprobado; en los demás
        // casos MP muestra un botón "volver al sitio".
        auto_return: 'approved',
        statement_descriptor: 'HUELLA VERDE',
        notification_url: notifyUrl,
      },
    });
    if (!preferencia.init_point) throw new Error('MercadoPago no devolvió init_point');
    return { urlRedireccion: preferencia.init_point };
  },

  async verificarRetorno(_request, url) {
    const params = url.searchParams;
    const paymentId = params.get('payment_id') ?? params.get('collection_id');

    if (!paymentId || paymentId === 'null') return { estado: 'invalido', detalle: null };

    try {
      const pago = await mpPayment().get({ id: paymentId });
      const estado =
        pago.status === 'approved'
          ? 'aprobado'
          : pago.status === 'in_process' || pago.status === 'pending'
            ? 'pendiente' // ej: pago en efectivo — se acredita después
            : 'rechazado';
      return {
        estado,
        detalle: {
          referencia: pago.external_reference ?? '—',
          monto: pago.transaction_amount ?? 0,
          medio: pago.payment_method_id ?? 'MercadoPago',
          comprobante: String(pago.id),
        },
      };
    } catch (err) {
      console.error('Error verificando pago en MercadoPago:', err);
      return { estado: 'error', detalle: null };
    }
  },
};
