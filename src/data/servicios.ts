/**
 * Catálogo de servicios de peluquería.
 *
 * Estructura: cada servicio define un precio y duración POR TAMAÑO de perro.
 * Así, cuando Anthony investigue los precios reales de Martha, solo hay que
 * editar los números de este archivo — la tabla de precios, la página de
 * reservas y el checkout (rama transbank) se actualizan solos.
 *
 * TODO(Anthony): precios y duraciones de EJEMPLO basados en tarifas típicas
 * de peluquerías caninas de Santiago (2026). Reemplazar por los reales.
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

export interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  /** Qué incluye, para la página de servicios. */
  incluye: string[];
  /** Precio en CLP y duración en minutos, por tamaño. */
  porTamano: Record<TamanoId, { precio: number; duracionMin: number }>;
  /**
   * Slug del tipo de evento en Cal.com (cal.com/<usuario>/<slug>).
   * TODO(Anthony): crear estos tipos de evento en la Fase 2 con las
   * duraciones del tamaño más común, y ajustar los slugs si difieren.
   */
  calcomSlug: string;
}

export const SERVICIOS: Servicio[] = [
  {
    id: 'bano',
    nombre: 'Baño completo',
    descripcion: 'Baño con shampoo hipoalergénico, secado y cepillado.',
    incluye: ['Shampoo según tipo de pelo', 'Secado y cepillado', 'Limpieza de oídos', 'Corte de uñas', 'Perfume'],
    porTamano: {
      pequeno: { precio: 12000, duracionMin: 45 },
      mediano: { precio: 16000, duracionMin: 60 },
      grande: { precio: 22000, duracionMin: 75 },
    },
    calcomSlug: 'bano',
  },
  {
    id: 'bano-corte',
    nombre: 'Baño + corte',
    descripcion: 'Baño completo más corte de pelo a tijera o máquina, según la raza y tu gusto.',
    incluye: ['Todo lo del baño completo', 'Corte según raza o a pedido', 'Higiénico (patitas, carita, zona sanitaria)'],
    porTamano: {
      pequeno: { precio: 18000, duracionMin: 75 },
      mediano: { precio: 24000, duracionMin: 90 },
      grande: { precio: 32000, duracionMin: 120 },
    },
    calcomSlug: 'bano-y-corte',
  },
  {
    id: 'stripping',
    nombre: 'Stripping',
    descripcion: 'Retiro manual del pelo muerto para razas de pelo duro (schnauzer, fox terrier, westy…). Mantiene la textura y el color del manto.',
    incluye: ['Stripping manual completo', 'Baño posterior', 'Cepillado y perfume'],
    porTamano: {
      pequeno: { precio: 25000, duracionMin: 90 },
      mediano: { precio: 32000, duracionMin: 120 },
      grande: { precio: 40000, duracionMin: 150 },
    },
    calcomSlug: 'stripping',
  },
  {
    id: 'deslanado',
    nombre: 'Deslanado',
    descripcion: 'Retiro del subpelo muerto en razas de doble manto (golden, ovejero, husky…). Ideal en cambio de estación.',
    incluye: ['Baño con acondicionador', 'Deslanado con herramientas específicas', 'Secado profundo'],
    porTamano: {
      pequeno: { precio: 18000, duracionMin: 60 },
      mediano: { precio: 25000, duracionMin: 90 },
      grande: { precio: 35000, duracionMin: 120 },
    },
    calcomSlug: 'deslanado',
  },
];

/** Búsqueda cómoda para páginas y checkout. */
export function getServicio(id: string): Servicio | undefined {
  return SERVICIOS.find((s) => s.id === id);
}

export function getTamano(id: string): Tamano | undefined {
  return TAMANOS.find((t) => t.id === id);
}
