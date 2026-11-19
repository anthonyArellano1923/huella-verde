/**
 * Configuración de MercadoPago Checkout Pro — SOLO se importa desde código
 * de servidor. El access token es SECRETO: jamás debe llegar al navegador.
 *
 * A diferencia de Transbank (que publica credenciales de prueba genéricas),
 * MercadoPago exige credenciales propias incluso para probar:
 *
 * TODO(Anthony): crear cuenta en mercadopago.cl → developers.mercadopago.com
 * → "Tus integraciones" → crear aplicación → copiar el Access Token de
 * PRUEBA y definirlo en .env como MP_ACCESS_TOKEN. Para producción, el token
 * productivo (APP_USR-...) va SOLO en Vercel → Environment "Production".
 */
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { ConfigError, esProduccion } from './errores';

/** Payment object as returned by the MP SDK. */
export type PagoMP = Awaited<ReturnType<Payment['get']>>;

/**
 * Builds the MP client, refusing to run without a token or with a test
 * token on the real site.
 *
 * @throws ConfigError when the token is missing, or is a TEST- token in production.
 */
function getClient(): MercadoPagoConfig {
  // process.env y no import.meta.env: ver la explicación en pasarela.ts.
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    throw new ConfigError('Falta MP_ACCESS_TOKEN (pago con MercadoPago no configurado).');
  }
  // Red de seguridad, igual que con Webpay: un token de prueba en el sitio
  // real mostraría pagos "aprobados" sin cobrar un peso.
  if (esProduccion() && accessToken.startsWith('TEST-')) {
    throw new ConfigError('ABORTADO: MP_ACCESS_TOKEN de PRUEBA en el sitio de producción.');
  }
  return new MercadoPagoConfig({ accessToken, options: { timeout: 8000 } });
}

/** True when MercadoPago credentials exist (used by the webhook). */
export function mpConfigurado(): boolean {
  return Boolean(process.env.MP_ACCESS_TOKEN);
}

/** Cliente de preferencias (crear el "carrito" que MP muestra al pagar). */
export function mpPreference(): Preference {
  return new Preference(getClient());
}

/** Cliente de pagos (verificar el estado real de un pago al volver). */
export function mpPayment(): Payment {
  return new Payment(getClient());
}
