/**
 * Datos del negocio — ÚNICA fuente de verdad.
 *
 * TODO(Anthony): reemplazar los valores marcados cuando tengas los datos
 * reales de tu hermana (Fase 0 del PLAN.md). Nada más en el código repite
 * estos datos: editar aquí actualiza toda la web.
 */

export const NEGOCIO = {
  nombre: 'Martha Mella',
  slogan: 'Peluquería canina con cariño',
  descripcion:
    'Peluquería canina en Santiago: baño, corte y stripping para tu perrito, con reserva de hora online. Además, ropita tejida a mano para el invierno.',

  // TODO(Anthony): número real de WhatsApp Business (9 dígitos, sin +56).
  whatsapp: '912345678',

  // TODO(Anthony): dirección real del local.
  direccion: {
    calle: 'Av. Ejemplo 1234',
    comuna: 'Ñuñoa',
    ciudad: 'Santiago',
    region: 'Región Metropolitana',
  },

  // TODO(Anthony): horario real (esto alimenta la página de contacto y el
  // Schema.org de Google; el horario de la agenda vive en Cal.com aparte).
  horarios: [
    { dias: 'Martes a Viernes', horas: '10:00 – 18:30' },
    { dias: 'Sábado', horas: '10:00 – 14:00' },
    { dias: 'Domingo y Lunes', horas: 'Cerrado' },
  ],

  /** Horario en formato Schema.org (https://schema.org/openingHours). */
  horariosSchema: ['Tu-Fr 10:00-18:30', 'Sa 10:00-14:00'],

  // TODO(Anthony): correo real cuando exista (Fase 6: Cloudflare Email Routing).
  email: 'contacto@marthamella.cl',

  // TODO(Anthony): dominio real comprado en nic.cl (Fase 0/6).
  url: 'https://www.marthamella.cl',

  /**
   * Usuario de Cal.com de la dueña. TODO(Anthony): crear la cuenta en la
   * Fase 2 y poner aquí el username real (cal.com/<username>).
   */
  calcomUsuario: 'martha-mella',
} as const;

/** Número en formato E.164 sin '+', listo para enlaces wa.me. */
export const WHATSAPP_WA = `56${NEGOCIO.whatsapp}`;
