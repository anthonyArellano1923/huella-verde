/**
 * Errores tipados del flujo de pago.
 *
 * Separar "falta configuración" de "falló la conexión" permite responder con
 * el código HTTP correcto: 503 (el servicio no está listo, no reintentes) vs
 * 502 (la pasarela no respondió, reintenta).
 */

/**
 * Thrown when a payment feature is missing configuration (credentials, bank
 * details, secrets) or would run with test credentials in production.
 * API routes translate it into HTTP 503.
 */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

/** True when the code runs in Vercel's Production environment (the real site). */
export function esProduccion(): boolean {
  // process.env (no import.meta.env): se lee en runtime, ver pasarela.ts.
  return process.env.VERCEL_ENV === 'production';
}
