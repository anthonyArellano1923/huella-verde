/**
 * Human-readable labels for the shop's enum fields.
 *
 * The content schema stores short slugs ("media-sombra", "facil"); cards and
 * detail pages show these Spanish labels instead. Shared here so the grid and
 * the detail page never disagree.
 */
import type { CollectionEntry } from 'astro:content';

type Planta = CollectionEntry<'plantas'>['data'];
type Accesorio = CollectionEntry<'accesorios'>['data'];

/** Light requirement labels. */
export const ETIQUETA_LUZ: Record<Planta['luz'], string> = {
  sombra: 'Sombra',
  'media-sombra': 'Media sombra',
  'sol-indirecto': 'Luz indirecta',
  'pleno-sol': 'Pleno sol',
};

/** Watering labels. */
export const ETIQUETA_RIEGO: Record<Planta['riego'], string> = {
  bajo: 'Riego bajo',
  moderado: 'Riego moderado',
  alto: 'Riego frecuente',
};

/** Care difficulty labels. */
export const ETIQUETA_DIFICULTAD: Record<Planta['dificultad'], string> = {
  facil: 'Fácil',
  media: 'Dificultad media',
  experta: 'Para expertos',
};

/** Accessory category labels (singular, for chips). */
export const ETIQUETA_CATEGORIA: Record<Accesorio['categoria'], string> = {
  macetero: 'Macetero',
  sustrato: 'Sustrato',
  fertilizante: 'Fertilizante',
  suplemento: 'Suplemento',
  cuidado: 'Cuidado',
  herramienta: 'Herramienta',
};
