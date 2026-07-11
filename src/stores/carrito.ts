/**
 * Estado global del carrito, compartido entre islas React.
 *
 * Nanostores es un almacén diminuto (~1 kB) pensado para Astro: cada isla se
 * suscribe con useStore() y todas ven el mismo estado aunque sean componentes
 * React independientes en distintas partes de la página. `persistentAtom`
 * además lo guarda en localStorage: el carrito sobrevive a recargas y a
 * navegar entre páginas estáticas.
 *
 * Solo guardamos slug y cantidad — el precio SIEMPRE lo recalcula el servidor
 * al pagar (nunca se confía en montos que vienen del navegador).
 */
import { persistentAtom } from '@nanostores/persistent';

export interface ItemCarrito {
  slug: string;
  nombre: string;
  talla: string;
  /** Precio de referencia para MOSTRAR el subtotal; el cobro real se calcula en el servidor. */
  precio: number;
  qty: number;
}

export const $carrito = persistentAtom<ItemCarrito[]>('mm-carrito', [], {
  encode: JSON.stringify,
  decode: (raw) => {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
});

export function agregarAlCarrito(item: Omit<ItemCarrito, 'qty'>) {
  const items = $carrito.get();
  const existente = items.find((i) => i.slug === item.slug);
  if (existente) {
    $carrito.set(items.map((i) => (i.slug === item.slug ? { ...i, qty: Math.min(i.qty + 1, 10) } : i)));
  } else {
    $carrito.set([...items, { ...item, qty: 1 }]);
  }
}

export function cambiarCantidad(slug: string, qty: number) {
  const items = $carrito.get();
  if (qty <= 0) {
    $carrito.set(items.filter((i) => i.slug !== slug));
  } else {
    $carrito.set(items.map((i) => (i.slug === slug ? { ...i, qty: Math.min(qty, 10) } : i)));
  }
}

export function vaciarCarrito() {
  $carrito.set([]);
}

export function totalReferencia(items: ItemCarrito[]): number {
  return items.reduce((suma, i) => suma + i.precio * i.qty, 0);
}
