/**
 * Sorting rule for the shop grids.
 */
import type { CollectionEntry } from 'astro:content';

type Producto = CollectionEntry<'plantas'> | CollectionEntry<'accesorios'>;

/**
 * Sorts products for display: featured first, sold-out last, then by name.
 *
 * @param productos - Entries from the `plantas` or `accesorios` collection.
 * @returns A new sorted array (the input is not mutated).
 */
export function ordenarProductos<T extends Producto>(productos: T[]): T[] {
  const puntaje = (p: T) => (p.data.stock === 0 ? -1 : p.data.destacado ? 1 : 0);
  return [...productos].sort(
    (a, b) => puntaje(b) - puntaje(a) || a.data.nombre.localeCompare(b.data.nombre, 'es'),
  );
}
