/**
 * Configuración de Transbank Webpay Plus — SOLO se importa desde código de
 * servidor (rutas API y páginas con `prerender = false`). Nunca desde una
 * isla React: las credenciales de producción no deben llegar al navegador.
 *
 * Ambientes:
 * - Integración (por defecto): credenciales PÚBLICAS de prueba de Transbank.
 *   Los pagos son de mentira — tarjeta VISA 4051 8856 0044 6623, CVV 123,
 *   cualquier fecha futura; RUT 11.111.111-1, clave 123 en la simulación.
 * - Producción: cuando la dueña firme el contrato con Transbank, definir en
 *   Vercel las variables TBK_COMMERCE_CODE, TBK_API_KEY y TBK_ENV=produccion.
 */
// El SDK es CommonJS: se importa el default y se desestructura (los named
// imports fallan en el server de Vite/Astro).
import pkg from 'transbank-sdk';
const { WebpayPlus, Options, IntegrationApiKeys, IntegrationCommerceCodes, Environment } = pkg;

function opciones(): InstanceType<typeof Options> {
  // process.env y no import.meta.env: ver la explicación en pasarela.ts
  // (import.meta.env se congela en el build y dejaba las credenciales de
  // integración incrustadas para siempre).
  const commerceCode = process.env.TBK_COMMERCE_CODE;
  const apiKey = process.env.TBK_API_KEY;
  const esProduccion = process.env.TBK_ENV === 'produccion';

  // Red de seguridad: jamás cobrar con credenciales de PRUEBA en el sitio
  // real. Si esto no estuviera, el cliente vería un voucher aprobado y no se
  // cobraría un peso. Es preferible un sitio caído a un sitio que finge cobrar.
  if (!esProduccion && process.env.VERCEL_ENV === 'production') {
    throw new Error(
      'ABORTADO: Webpay quedaría en ambiente de INTEGRACIÓN (pagos de mentira) ' +
        'en el sitio de producción. Define TBK_ENV=produccion, TBK_COMMERCE_CODE ' +
        'y TBK_API_KEY en Vercel y vuelve a desplegar.'
    );
  }

  if (esProduccion) {
    if (!commerceCode || !apiKey) {
      throw new Error('TBK_ENV=produccion requiere TBK_COMMERCE_CODE y TBK_API_KEY');
    }
    return new Options(commerceCode, apiKey, Environment.Production);
  }

  return new Options(
    commerceCode ?? IntegrationCommerceCodes.WEBPAY_PLUS,
    apiKey ?? IntegrationApiKeys.WEBPAY,
    Environment.Integration
  );
}

/** Transacción Webpay Plus lista para create/commit/status. */
export function webpayTransaction() {
  return new WebpayPlus.Transaction(opciones());
}
