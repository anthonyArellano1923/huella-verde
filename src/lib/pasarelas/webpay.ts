/**
 * Implementación de PasarelaPago para Webpay Plus (Transbank).
 *
 * crearPago: crea la transacción y arma la URL de redirección con el token
 * ya incrustado (`?token_ws=`). La URL de retorno lleva el pedido codificado
 * y firmado en la RUTA (/pago/retorno/<pedido>/<firma>), porque el commit de
 * Webpay devuelve monto y orden pero NO los productos, y el aviso a Martha
 * los necesita. Va en la ruta y no en la query porque Webpay agrega sus
 * propios parámetros a la URL.
 *
 * verificarRetorno: Webpay vuelve por GET o POST con distintas combinaciones
 * de parámetros (documentación oficial, transbankdevelopers.cl):
 * - solo token_ws                         → flujo normal: hay que hacer commit
 * - token_ws + TBK_TOKEN                  → error en el formulario: NO commit
 * - solo TBK_TOKEN (+ TBK_ORDEN_COMPRA)   → el cliente anuló
 * - solo TBK_ORDEN_COMPRA / TBK_ID_SESION → se acabó el tiempo (timeout)
 * Sin commit, el pago no se completa y Transbank lo reversa solo.
 *
 * Recarga de la página: antes del commit se consulta el estado (status). Si
 * ya fue confirmada, se vuelve a mostrar el comprobante sin repetir el
 * commit ni avisar de nuevo a Martha.
 */
import type { PasarelaPago, ResultadoRetorno } from '../pasarela';
import { webpayTransaction } from '../transbank';
import { firmar, verificarFirma } from '../firma';

/** Transbank rejects return URLs longer than this. */
const MAX_RETURN_URL = 255;

/** Text covered by the return-URL signature (binds the items to the buy order). */
const textoFirmado = (referencia: string, pedido: string) => `wp|${referencia}|${pedido}`;

/** Commit/status response fields this module reads. */
interface RespuestaTbk {
  response_code?: number;
  status?: string;
  buy_order: string;
  amount: number;
  authorization_code?: string;
  card_detail?: { card_number?: string };
}

/**
 * Maps a Transbank commit/status response to a normalized result.
 *
 * @param r - Transbank response.
 * @param confirmadoAhora - true when it came from a successful first commit.
 * @param pedido - Verified compact order (or null).
 */
function aResultado(r: RespuestaTbk, confirmadoAhora: boolean, pedido: string | null): ResultadoRetorno {
  if (r.response_code === 0 && r.status === 'AUTHORIZED') {
    return {
      estado: 'aprobado',
      confirmadoAhora,
      pedido,
      detalle: {
        referencia: r.buy_order,
        monto: r.amount,
        medio: `**** ${(r.card_detail?.card_number ?? '****').slice(-4)}`,
        comprobante: r.authorization_code ?? '—',
      },
    };
  }
  return { estado: 'rechazado', detalle: null };
}

export const pasarelaWebpay: PasarelaPago = {
  id: 'webpay',
  nombre: 'Webpay',

  async crearPago({ monto, referencia, pedido, origen }) {
    const tx = webpayTransaction();
    const conPedido = `${origen}/pago/retorno/${pedido}/${firmar(textoFirmado(referencia, pedido))}`;
    // Pedido muy largo (muchos productos distintos): se omite el detalle; el
    // aviso a Martha dirá que lo revise por la referencia.
    const returnUrl = conPedido.length <= MAX_RETURN_URL ? conPedido : `${origen}/pago/retorno`;
    // buyOrder y sessionId comparten la referencia: sin base de datos, es lo
    // único que identifica el pago en el retorno.
    const r = await tx.create(referencia, referencia, monto, returnUrl);
    return { urlRedireccion: `${r.url}?token_ws=${r.token}` };
  },

  reconoceRetorno(params) {
    return ['token_ws', 'TBK_TOKEN', 'TBK_ORDEN_COMPRA', 'TBK_ID_SESION'].some((k) => params.has(k));
  },

  async verificarRetorno(params, ruta) {
    const tokenWs = params.get('token_ws');
    const tokenAnulacion = params.get('TBK_TOKEN');

    if (tokenWs && tokenAnulacion) return { estado: 'rechazado', detalle: null };
    if (tokenAnulacion) return { estado: 'anulado', detalle: null };
    if (!tokenWs) return { estado: 'expirado', detalle: null };

    const tx = webpayTransaction();
    const [pedidoRuta, firmaRuta] = ruta;

    // Primero se pregunta el estado: si la transacción ya no está
    // "INITIALIZED", alguien ya hizo el commit (típicamente, una recarga de
    // esta página). Probado en integración (2026-11-19): repetir commit NO
    // da error, devuelve otra vez AUTHORIZED; por eso no basta con esperar
    // que el segundo commit falle.
    let previo: RespuestaTbk | null = null;
    try {
      previo = await tx.status(tokenWs);
    } catch {
      previo = null; // si status falla, se intenta el commit igual
    }

    let respuesta: RespuestaTbk;
    let confirmadoAhora = false;
    if (previo && previo.status !== 'INITIALIZED') {
      respuesta = previo;
    } else {
      try {
        respuesta = await tx.commit(tokenWs);
        confirmadoAhora = true;
      } catch (errCommit) {
        // Commit rechazado (p. ej. otra pestaña lo hizo primero): se muestra
        // el estado real; si tampoco responde, es un error de verdad.
        try {
          respuesta = await tx.status(tokenWs);
        } catch {
          throw errCommit;
        }
      }
    }

    // El pedido de la URL solo se acepta si su firma calza con ESTA orden.
    const pedido =
      pedidoRuta && firmaRuta && verificarFirma(textoFirmado(respuesta.buy_order, pedidoRuta), firmaRuta)
        ? pedidoRuta
        : null;
    return aResultado(respuesta, confirmadoAhora, pedido);
  },
};
