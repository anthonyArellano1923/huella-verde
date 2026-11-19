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
  // trim(): un espacio pegado al copiar desde el panel de Vercel no debe
  // contar como token válido ni esconder el prefijo TEST-.
  const accessToken = (process.env.MP_ACCESS_TOKEN ?? '').trim();
  if (!accessToken) {
    throw new ConfigError(
      esProduccion()
        ? 'ABORTADO: falta MP_ACCESS_TOKEN en el sitio de producción (PASARELA_PAGO=mercadopago).'
        : 'Falta MP_ACCESS_TOKEN (pago con MercadoPago no configurado).'
    );
  }
  // Red de seguridad, igual que con Webpay (transbank.ts): un token de prueba
  // en el sitio real mostraría pagos "aprobados" sin cobrar un peso. Es
  // preferible un 503 a un sitio que finge cobrar.
  if (esProduccion() && accessToken.toUpperCase().startsWith('TEST-')) {
    throw new ConfigError(
      'ABORTADO: MP_ACCESS_TOKEN de PRUEBA (TEST-…) en el sitio de producción. ' +
        'Define el token productivo APP_USR-… solo en Vercel (Production) y vuelve a desplegar.'
    );
  }
  return new MercadoPagoConfig({ accessToken, options: { timeout: 8000 } });
}

/** True when MercadoPago credentials exist (used by the webhook). */
export function mpConfigurado(): boolean {
  return Boolean(process.env.MP_ACCESS_TOKEN?.trim());
}

/** Cliente de preferencias (crear el "carrito" que MP muestra al pagar). */
export function mpPreference(): Preference {
  return new Preference(getClient());
}

/** Cliente de pagos (verificar el estado real de un pago al volver). */
export function mpPayment(): Payment {
  return new Payment(getClient());
}
