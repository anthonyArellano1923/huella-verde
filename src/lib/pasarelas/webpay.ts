/**
 * Implementación de PasarelaPago para Webpay Plus (Transbank).
 *
 * crearPago: crea la transacción y arma la URL de redirección con el token
 * ya incrustado (`?token_ws=`) para que el resto del código nunca sepa de
 * tokens de Webpay.
 *
 * verificarRetorno: Webpay puede volver por GET o por POST según el flujo,
 * con `token_ws` (el cliente terminó el formulario, hay que hacer commit()
 * del lado del servidor) o `TBK_TOKEN` (el cliente anuló dentro de Webpay).
 * Sin commit, el pago queda en el limbo y se reversa solo.
 */
import type { PasarelaPago } from '../pasarela';
import { webpayTransaction } from '../transbank';

export const pasarelaWebpay: PasarelaPago = {
  id: 'webpay',
  nombre: 'Webpay (Transbank)',

  async crearPago({ monto, referencia, returnUrl }) {
    const tx = webpayTransaction();
    // buyOrder y sessionId comparten la misma referencia: sin base de datos
    // todavía (Fase 7), es lo único que identifica el pago en el retorno.
    const r = await tx.create(referencia, referencia, monto, returnUrl);
    return { urlRedireccion: `${r.url}?token_ws=${r.token}` };
  },

  async verificarRetorno(request, url) {
    const params =
      request.method === 'POST' ? new URLSearchParams(await request.text()) : url.searchParams;

    const tokenWs = params.get('token_ws');
    const tokenAnulacion = params.get('TBK_TOKEN');

    if (tokenWs) {
      try {
        const tx = webpayTransaction();
        const r = await tx.commit(tokenWs);
        if (r.response_code === 0 && r.status === 'AUTHORIZED') {
          return {
            estado: 'aprobado',
            detalle: {
              referencia: r.buy_order,
              monto: r.amount,
              medio: `**** ${(r.card_detail?.card_number ?? '****').slice(-4)}`,
              comprobante: r.authorization_code,
            },
          };
        }
        return { estado: 'rechazado', detalle: null };
      } catch (err) {
        console.error('Error confirmando transacción Webpay:', err);
        return { estado: 'error', detalle: null };
      }
    }

    if (tokenAnulacion) return { estado: 'anulado', detalle: null };
    return { estado: 'invalido', detalle: null };
  },
};
