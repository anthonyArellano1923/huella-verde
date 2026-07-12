/**
 * Catálogo de servicios de peluquería.
 *
 * Definiciones reales de Martha (llamada + mensajes del 2026-07-11):
 * - TODOS los servicios completos duran entre 1,5 y 2 horas, independiente
 *   del tamaño o raza → se agenda el bloque completo de 2 horas.
 * - Los precios son "DESDE": el valor final depende de la complejidad de la
 *   raza y se conversa con el cliente. Stripping y deslanado se cotizan
 *   directamente (precio null → "a consultar").
 * - El baño completo INCLUYE los microservicios (orejas, glándulas, uñas),
 *   que también existen sueltos como servicios express (~5 min, sin reserva).
 * - Última reserva del día: 17:30. Cancelación hasta 3 h antes.
 */

export type TamanoId = 'pequeno' | 'mediano' | 'grande';

export interface Tamano {
  id: TamanoId;
  nombre: string;
  descripcion: string;
}

export const TAMANOS: Tamano[] = [
  { id: 'pequeno', nombre: 'Pequeño', descripcion: 'Hasta 10 kg (poodle toy, yorkshire, shih tzu…)' },
  { id: 'mediano', nombre: 'Mediano', descripcion: '10 a 25 kg (cocker, schnauzer, beagle…)' },
  { id: 'grande', nombre: 'Grande', descripcion: 'Más de 25 kg (golden, labrador, ovejero…)' },
];

/** Duración única definida por Martha: 1,5–2 h; se reserva el bloque de 2 h. */
export const DURACION_SERVICIO_MIN = 120;

export interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  /** Qué incluye, para la página de servicios. */
  incluye: string[];
  /**
   * Precio "desde" en CLP por tamaño; el valor final se conversa según la
   * complejidad de la raza. `null` → se cotiza por WhatsApp ("a consultar").
   */
  precioDesdePorTamano: Record<TamanoId, number> | null;
  /**
   * Slug del tipo de evento en Cal.com (cal.com/<usuario>/<slug>).
   * TODO(Anthony): crear estos tipos de evento en la Fase 2 (duración 2 h,
   * inicio máximo 17:30) y ajustar los slugs si difieren.
   */
  calcomSlug: string;
  /** Ícono de grooming que representa el servicio (ver IconoGrooming.astro). */
  icono: IconoGrooming;
}

/** Íconos de peluquería canina disponibles. */
export type IconoGrooming = 'gota' | 'tijeras' | 'peine' | 'cepillo';

export const SERVICIOS: Servicio[] = [
  {
    id: 'bano',
    nombre: 'Baño completo',
    descripcion: 'Baño con shampoo según tipo de pelo, más TODOS los microservicios incluidos: orejitas, glándulas y uñas.',
    incluye: [
      'Shampoo según tipo de pelo',
      'Secado y cepillado',
      'Limpieza de orejitas',
      'Vaciado glandular',
      'Corte y limado de uñas',
      'Perfume',
    ],
    precioDesdePorTamano: { pequeno: 22000, mediano: 28000, grande: 32000 },
    calcomSlug: 'bano',
    icono: 'gota',
  },
  {
    id: 'mantencion-corte',
    nombre: 'Mantención + corte',
    descripcion: 'Todo lo del baño completo más corte de pelo a tijera o máquina, según la raza y tu gusto.',
    incluye: ['Todo lo del baño completo', 'Corte según raza o a pedido', 'Higiénico (patitas, carita, zona sanitaria)'],
    precioDesdePorTamano: { pequeno: 25000, mediano: 30000, grande: 40000 },
    calcomSlug: 'mantencion-y-corte',
    icono: 'tijeras',
  },
  {
    id: 'stripping',
    nombre: 'Stripping',
    descripcion: 'Retiro manual del pelo muerto para razas de pelo duro (schnauzer, fox terrier, westy…). Mantiene la textura y el color del manto.',
    incluye: ['Stripping manual completo', 'Baño posterior', 'Cepillado y perfume'],
    precioDesdePorTamano: null,
    calcomSlug: 'stripping',
    icono: 'peine',
  },
  {
    id: 'deslanado',
    nombre: 'Deslanado',
    descripcion: 'Retiro del subpelo muerto en razas de doble manto (golden, ovejero, husky…). Ideal en cambio de estación.',
    incluye: ['Baño con acondicionador', 'Deslanado con herramientas específicas', 'Secado profundo'],
    precioDesdePorTamano: null,
    calcomSlug: 'deslanado',
    icono: 'cepillo',
  },
];

/**
 * Servicios express: ~5 minutos, se hacen al momento en el local (con o sin
 * hora previa) y el precio se cotiza ahí mismo. No se reservan online.
 * Todos vienen incluidos en el baño completo.
 */
export interface ServicioExpress {
  id: string;
  nombre: string;
  duracionMin: number;
}

export const SERVICIOS_EXPRESS: ServicioExpress[] = [
  { id: 'orejas', nombre: 'Limpieza de orejitas', duracionMin: 5 },
  { id: 'glandulas', nombre: 'Vaciado glandular', duracionMin: 5 },
  { id: 'unas', nombre: 'Corte y limado de uñas', duracionMin: 5 },
];

/** Políticas de reserva definidas por Martha (2026-07-11). */
export const POLITICAS_RESERVA = {
  anticipacionMinimaHoras: 24,
  cancelacionHoras: 3,
  ultimaHoraInicio: '17:30',
  notaPrecios:
    'Los precios son "desde": el valor final depende de la complejidad de la raza y se conversa contigo antes de empezar.',
  notaHorarioEspecial:
    'Si ningún horario te acomoda, escríbenos por WhatsApp: los horarios especiales son conversables (también con 24 h de anticipación).',
} as const;

/** Búsqueda cómoda para páginas y checkout. */
export function getServicio(id: string): Servicio | undefined {
  return SERVICIOS.find((s) => s.id === id);
}

export function getTamano(id: string): Tamano | undefined {
  return TAMANOS.find((t) => t.id === id);
}
