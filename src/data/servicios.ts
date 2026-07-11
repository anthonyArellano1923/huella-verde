/**
 * Catálogo de servicios de peluquería.
 *
 * Definiciones reales de la llamada con Martha (2026-07-11):
 * - TODOS los servicios completos duran entre 1,5 y 2 horas, independiente
 *   del tamaño o raza → se agenda el bloque completo de 2 horas.
 * - Además hay servicios EXPRESS (~5 min) que se hacen al momento, sin
 *   reserva: limpieza de orejas, vaciado glandular, corte y limado de uñas.
 * - Última reserva del día: 17:30 (para terminar a las 19:30).
 *
 * TODO(Anthony): los PRECIOS siguen siendo de EJEMPLO — Martha aún no los
 * define (quedó en conversarlos; los express se cotizan en el local).
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
  /** Precio en CLP por tamaño. TODO(Anthony): reemplazar por los reales. */
  precioPorTamano: Record<TamanoId, number>;
  /**
   * Slug del tipo de evento en Cal.com (cal.com/<usuario>/<slug>).
   * TODO(Anthony): crear estos tipos de evento en la Fase 2 (duración 2 h,
   * inicio máximo 17:30) y ajustar los slugs si difieren.
   */
  calcomSlug: string;
}

export const SERVICIOS: Servicio[] = [
  {
    id: 'bano',
    nombre: 'Baño completo',
    descripcion: 'Baño con shampoo hipoalergénico, secado y cepillado.',
    incluye: ['Shampoo según tipo de pelo', 'Secado y cepillado', 'Limpieza de oídos', 'Corte de uñas', 'Perfume'],
    precioPorTamano: { pequeno: 12000, mediano: 16000, grande: 22000 },
    calcomSlug: 'bano',
  },
  {
    id: 'bano-corte',
    nombre: 'Baño + corte',
    descripcion: 'Baño completo más corte de pelo a tijera o máquina, según la raza y tu gusto.',
    incluye: ['Todo lo del baño completo', 'Corte según raza o a pedido', 'Higiénico (patitas, carita, zona sanitaria)'],
    precioPorTamano: { pequeno: 18000, mediano: 24000, grande: 32000 },
    calcomSlug: 'bano-y-corte',
  },
  {
    id: 'stripping',
    nombre: 'Stripping',
    descripcion: 'Retiro manual del pelo muerto para razas de pelo duro (schnauzer, fox terrier, westy…). Mantiene la textura y el color del manto.',
    incluye: ['Stripping manual completo', 'Baño posterior', 'Cepillado y perfume'],
    precioPorTamano: { pequeno: 25000, mediano: 32000, grande: 40000 },
    calcomSlug: 'stripping',
  },
  {
    id: 'deslanado',
    nombre: 'Deslanado',
    descripcion: 'Retiro del subpelo muerto en razas de doble manto (golden, ovejero, husky…). Ideal en cambio de estación.',
    incluye: ['Baño con acondicionador', 'Deslanado con herramientas específicas', 'Secado profundo'],
    precioPorTamano: { pequeno: 18000, mediano: 25000, grande: 35000 },
    calcomSlug: 'deslanado',
  },
];

/**
 * Servicios express: ~5 minutos, se hacen al momento en el local (con o sin
 * hora previa) y el precio se cotiza ahí mismo. No se reservan online.
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
  ultimaHoraInicio: '17:30',
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
