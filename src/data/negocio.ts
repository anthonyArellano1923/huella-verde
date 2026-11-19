/**
 * Datos del negocio — ÚNICA fuente de verdad.
 *
 * Datos reales entregados por Martha (2026-07-11). Los campos que aún son
 * placeholder están marcados con TODO(Anthony). Nada más en el código repite
 * estos datos: editar aquí actualiza toda la web.
 */

export const NEGOCIO = {
  nombre: 'Huella Verde',
  /** Nombre de la dueña, usado en textos ("tejido a mano por Martha"). */
  duena: 'Martha Mella',
  /**
   * Slogan de la MARCA (compartida con el negocio de plantas de Martha).
   * Esta web cubre solo el lado mascotas: peluquería, reservas y ropita.
   */
  slogan: 'Con amor por las mascotas',
  descripcion:
    'Huella Verde, peluquería canina: baño, corte, stripping y deslanado con reserva de hora online, y ropita de invierno tejida a mano.',

  whatsapp: '954417939',

  direccion: {
    calle: 'Curicó 243',
    comuna: 'Santiago',
    ciudad: 'Santiago',
    region: 'Región Metropolitana',
  },

  // Horario real definido con Martha (llamada 2026-07-11): corrido, sin
  // colación. El sábado es estimado ("ideal"); horarios fuera de agenda se
  // conversan por WhatsApp como "horario especial".
  horarios: [
    { dias: 'Lunes a Viernes', horas: '10:30 – 19:30' },
    { dias: 'Sábado', horas: '10:30 – 16:00' },
    { dias: 'Domingo', horas: 'Cerrado' },
  ],

  /** Horario en formato Schema.org (https://schema.org/openingHours). */
  horariosSchema: ['Mo-Fr 10:30-19:30', 'Sa 10:30-16:00'],

  email: 'marthastcamstil3852@gmail.com',

  // TODO(Anthony): dominio real comprado en nic.cl (Fase 0/6).
  url: 'https://www.huellaverde.cl',

  /**
   * Usuario de Cal.com de la dueña. TODO(Anthony): crear la cuenta en la
   * Fase 2 y poner aquí el username real (cal.com/<username>).
   */
  calcomUsuario: 'huella-verde',
} as const;

/**
 * Datos bancarios para pago por transferencia (se muestran al cliente en
 * /pago/transferencia). Mientras algún campo diga TODO, el pago por
 * transferencia queda DESACTIVADO en el sitio de producción: nadie debe
 * transferir a una cuenta ficticia.
 *
 * TODO(Anthony): reemplazar con los datos que entregue Martha (cuenta a
 * nombre del mismo RUT que emite las boletas).
 */
export const DATOS_TRANSFERENCIA = {
  titular: 'TODO(Anthony): nombre del titular',
  rut: 'TODO(Anthony): RUT del titular',
  banco: 'TODO(Anthony): banco',
  tipoCuenta: 'TODO(Anthony): cuenta corriente / vista / RUT',
  numeroCuenta: 'TODO(Anthony): número de cuenta',
  /** Correo que el banco notifica al hacer la transferencia (opcional para el cliente). */
  email: NEGOCIO.email,
} as const;

/** Número en formato E.164 sin '+', listo para enlaces wa.me. */
export const WHATSAPP_WA = `56${NEGOCIO.whatsapp}`;
