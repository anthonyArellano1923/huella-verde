/**
 * Catalog of the code-drawn illustrations. These ids are a fixed contract:
 * product frontmatter and other pages reference them by string.
 */

export const ILUSTRACIONES_PLANTAS = [
  'suculenta',
  'cactus',
  'helecho',
  'monstera',
  'potus',
  'lavanda',
  'nativa-arbusto',
  'planta-colgante',
] as const;

export const ILUSTRACIONES_ACCESORIOS = [
  'macetero-terracota',
  'macetero-ceramica',
  'macetero-colgante',
  'sustrato',
  'fertilizante-liquido',
  'abono-organico',
  'regadera',
  'pulverizador',
  'tijeras-poda',
  'kit-cuidado',
] as const;

export const ILUSTRACION_IDS = [...ILUSTRACIONES_PLANTAS, ...ILUSTRACIONES_ACCESORIOS] as const;

export type IlustracionId = (typeof ILUSTRACION_IDS)[number];

/** Type guard: true when `id` has a dedicated drawing (frontmatter ids arrive as plain strings). */
export function esIlustracionConocida(id: string): id is IlustracionId {
  return (ILUSTRACION_IDS as readonly string[]).includes(id);
}

/** Human-readable Spanish names, used by the dev gallery. */
export const NOMBRES_ILUSTRACION: Record<IlustracionId, string> = {
  suculenta: 'Suculenta',
  cactus: 'Cactus',
  helecho: 'Helecho',
  monstera: 'Monstera',
  potus: 'Potus',
  lavanda: 'Lavanda',
  'nativa-arbusto': 'Arbusto nativo',
  'planta-colgante': 'Planta colgante',
  'macetero-terracota': 'Macetero de terracota',
  'macetero-ceramica': 'Macetero de cerámica',
  'macetero-colgante': 'Macetero colgante',
  sustrato: 'Sustrato',
  'fertilizante-liquido': 'Fertilizante líquido',
  'abono-organico': 'Abono orgánico',
  regadera: 'Regadera',
  pulverizador: 'Pulverizador',
  'tijeras-poda': 'Tijeras de poda',
  'kit-cuidado': 'Kit de cuidado',
};
