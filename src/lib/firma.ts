/**
 * Firma HMAC de datos que viajan por el navegador.
 *
 * Sin base de datos, el detalle de un pedido (qué productos, cuánto) tiene
 * que "viajar" en la URL entre el momento de crear el pago y el retorno o la
 * página de transferencia. Para que nadie pueda editar esa URL e inventar
 * otro pedido, el servidor la firma con un secreto que solo él conoce: si
 * alguien cambia una letra, la firma deja de calzar y se rechaza.
 *
 * Secreto: variable PAGOS_SECRETO (texto largo al azar, solo en Vercel).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { ConfigError, esProduccion } from './errores';

/** Fallback used only outside production so local tests work without setup. */
const SECRETO_DESARROLLO = 'solo-desarrollo-no-usar-en-produccion';

/**
 * Returns the HMAC secret, failing loudly in production when it is missing.
 *
 * @throws ConfigError if PAGOS_SECRETO is not set in production.
 */
function secreto(): string {
  const valor = process.env.PAGOS_SECRETO;
  if (valor) return valor;
  if (esProduccion()) {
    throw new ConfigError('Falta PAGOS_SECRETO en Vercel (Production).');
  }
  return SECRETO_DESARROLLO;
}

/**
 * Signs a text with HMAC-SHA256.
 *
 * @param texto - Data to sign (it travels in plain text next to the signature).
 * @returns A 22-char base64url signature (132 bits; enough against forgery).
 */
export function firmar(texto: string): string {
  return createHmac('sha256', secreto()).update(texto).digest('base64url').slice(0, 22);
}

/**
 * Checks a signature in constant time.
 *
 * @param texto - The data that was supposedly signed.
 * @param firma - The signature received from the browser.
 * @returns true only if the signature matches.
 */
export function verificarFirma(texto: string, firma: string): boolean {
  const esperada = Buffer.from(firmar(texto));
  const recibida = Buffer.from(firma);
  return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
}
