/**
 * GET /api/pago/estado — qué medios de pago ofrece el sitio en este momento.
 *
 * El carrito y /reservar son páginas estáticas (se generan en el build) y no
 * pueden leer variables de entorno en runtime; por eso preguntan aquí antes
 * de mostrar los botones de pago. Mientras no llega la respuesta, o si falla,
 * muestran la alternativa por WhatsApp.
 *
 * Respuesta: 200 { tarjeta: boolean, transferencia: boolean } (sin caché).
 */
import type { APIRoute } from 'astro';
import { mediosDisponibles } from '../../../lib/disponibilidad';

export const prerender = false;

export const GET: APIRoute = () =>
  new Response(JSON.stringify(mediosDisponibles()), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Nunca cachear: si se apaga el interruptor, el cambio debe verse ya.
      'Cache-Control': 'no-store',
    },
  });
