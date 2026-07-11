/**
 * Construcción de enlaces de WhatsApp con mensaje pre-armado.
 * Patrón portado de Onoto y Sazón: `wa.me/<fono>?text=<mensaje urlencoded>`.
 */
import { NEGOCIO, WHATSAPP_WA } from '../data/negocio';
import { formatCLP } from './money';

/** Enlace genérico a WhatsApp con un texto dado. */
export function waLink(mensaje: string): string {
  return `https://wa.me/${WHATSAPP_WA}?text=${encodeURIComponent(mensaje)}`;
}

/** Mensaje del botón "Lo quiero" de una prenda del catálogo. */
export function waLinkPrenda(nombre: string, talla: string, precio: number): string {
  const lineas = [
    `¡Hola! Vi la ropita en la web de ${NEGOCIO.nombre} y me encantó:`,
    '',
    `• ${nombre} (talla ${talla}) — ${formatCLP(precio)}`,
    '',
    '¿Está disponible? Me gustaría coordinar el pago por transferencia y la entrega.',
  ];
  return waLink(lineas.join('\n'));
}

/** Mensaje de consulta general (página de contacto). */
export function waLinkConsulta(): string {
  return waLink(`¡Hola! Vengo de la web de ${NEGOCIO.nombre} y tengo una consulta.`);
}

/** Mensaje para coordinar una reserva cuando Cal.com no le acomoda al cliente. */
export function waLinkReserva(): string {
  return waLink(`¡Hola! Quiero reservar una hora en ${NEGOCIO.nombre}. ¿Qué disponibilidad tienes?`);
}
