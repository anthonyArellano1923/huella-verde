/**
 * ¿Qué medios de pago se pueden ofrecer AHORA? Fuente única para el endpoint
 * de pago (/api/pago/crear), el de estado (/api/pago/estado) y las páginas.
 *
 * - Tarjeta: interruptor PAGOS_ONLINE (on por defecto) + que la pasarela
 *   activa tenga configuración válida para este ambiente (credenciales,
 *   secreto de firma). Así el botón no aparece si al pulsarlo fuera a fallar.
 * - Transferencia: solo si los datos bancarios de negocio.ts son reales (ver
 *   transferenciaDisponible en transferencia.ts). No depende del interruptor:
 *   no pasa por ninguna pasarela.
 *
 * Todo se lee con process.env en runtime (ver pasarela.ts). Ojo: en Vercel un
 * cambio de variable recién aplica en el SIGUIENTE despliegue (Redeploy).
 */
import { ConfigError } from './errores';
import { firmar } from './firma';
import { getPasarela } from './pasarela';
import { webpayTransaction } from './transbank';
import { mpPreference } from './mercadopago';
import { transferenciaDisponible } from './transferencia';

/** Values of PAGOS_ONLINE that turn card payments off (case-insensitive). */
const VALORES_APAGADO = new Set(['off', '0', 'false', 'no']);

/**
 * Reads the kill switch. Unset or any other value means "on".
 *
 * @returns true when PAGOS_ONLINE allows card payments.
 */
export function interruptorPagosOnline(): boolean {
  const valor = (process.env.PAGOS_ONLINE ?? '').trim().toLowerCase();
  return !VALORES_APAGADO.has(valor);
}

/**
 * Checks, without touching the network, that a card payment could start:
 * switch on, the active gateway builds its client without ConfigError, and
 * the signing secret exists (Webpay signs the return URL).
 *
 * @returns true when the card button should be offered.
 */
export function pagoTarjetaDisponible(): boolean {
  if (!interruptorPagosOnline()) return false;
  try {
    firmar('sonda');
    if (getPasarela().id === 'mercadopago') mpPreference();
    else webpayTransaction();
    return true;
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error(`[disponibilidad] pago con tarjeta no disponible: ${err.message}`);
      return false;
    }
    throw err;
  }
}

/** Snapshot of the payment methods the site can offer right now. */
export interface MediosDisponibles {
  tarjeta: boolean;
  transferencia: boolean;
}

/** @returns Which payment methods are available right now. */
export function mediosDisponibles(): MediosDisponibles {
  return { tarjeta: pagoTarjetaDisponible(), transferencia: transferenciaDisponible() };
}
