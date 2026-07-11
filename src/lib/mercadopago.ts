/**
 * Configuración de MercadoPago Checkout Pro — SOLO se importa desde código
 * de servidor. El access token es SECRETO: jamás debe llegar al navegador.
 *
 * A diferencia de Transbank (que publica credenciales de prueba genéricas),
 * MercadoPago exige credenciales propias incluso para probar:
 *
 * TODO(Anthony): crear cuenta en mercadopago.cl → developers.mercadopago.com
 * → "Tus integraciones" → crear aplicación → copiar el Access Token de
 * PRUEBA (empieza con "TEST-") y definirlo en Vercel / .env como
 * MP_ACCESS_TOKEN. Para producción, reemplazar por el token productivo
 * (empieza con "APP_USR-") cuando la cuenta de Martha esté verificada.
 */
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

function getClient(): MercadoPagoConfig {
  const accessToken = import.meta.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error(
      'Falta MP_ACCESS_TOKEN. Crea credenciales en developers.mercadopago.com y defínela en .env o en Vercel.'
    );
  }
  return new MercadoPagoConfig({ accessToken });
}

/** Cliente de preferencias (crear el "carrito" que MP muestra al pagar). */
export function mpPreference(): Preference {
  return new Preference(getClient());
}

/** Cliente de pagos (verificar el estado real de un pago al volver). */
export function mpPayment(): Payment {
  return new Payment(getClient());
}

/**
 * Referencia externa única, máx. legible: MM-PR-... productos, MM-RS-... reserva.
 * Cumple el mismo rol que el buyOrder de Transbank.
 */
export function generarReferencia(tipo: 'productos' | 'reserva'): string {
  const prefijo = tipo === 'productos' ? 'PR' : 'RS';
  const tiempo = Date.now().toString(36);
  const azar = Math.random().toString(36).slice(2, 8);
  return `MM-${prefijo}-${tiempo}-${azar}`;
}
