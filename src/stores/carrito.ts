/**
 * Estado global del carrito, compartido entre islas React.
 *
 * Nanostores es un almacén diminuto (~1 kB) pensado para Astro: cada isla se
 * suscribe con useStore() y todas ven el mismo estado aunque sean componentes
 * React independientes en distintas partes de la página. `persistentAtom`
 * además lo guarda en localStorage: el carrito sobrevive a recargas y a
 * navegar entre páginas estáticas.
 *
 * Cada ítem se identifica con `id = "<coleccion>/<slug>"` (prendas, plantas,
 * accesorios). El precio guardado es SOLO para mostrar el subtotal: el cobro
 * real lo recalcula el servidor (nunca se confía en montos del navegador).
 */
import { persistentAtom } from '@nanostores/persistent';
import { conBase } from '../utils/ruta';

export interface ItemCarrito {
  /** "<coleccion>/<slug>", e.g. "plantas/cinta". */
  id: string;
  nombre: string;
  /** Extra line under the name (e.g. "talla M"); optional. */
  detalle?: string;
  /** Precio de referencia para MOSTRAR el subtotal; el cobro real se calcula en el servidor. */
  precio: number;
  qty: number;
  /** Thumbnail URL (photo or /miniaturas/<id>.svg); optional for older carts. */
  miniatura?: string;
}

/** Max units of one product per order (same cap as the server). */
export const MAX_POR_PRODUCTO = 10;

/**
 * Normalizes a stored item, migrating carts saved before the multi-collection
 * change ({ slug, talla } → { id: "prendas/<slug>", detalle: "talla <talla>" }).
 *
 * @param raw - Item read from localStorage (any shape).
 * @returns A valid item, or null to drop it.
 */
function normalizar(raw: unknown): ItemCarrito | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const base = typeof r.id === 'string' ? r.id : typeof r.slug === 'string' ? r.slug : null;
  if (!base || typeof r.nombre !== 'string' || typeof r.precio !== 'number' || typeof r.qty !== 'number') {
    return null;
  }
  const detalle =
    typeof r.detalle === 'string' ? r.detalle : typeof r.talla === 'string' ? `talla ${r.talla}` : undefined;
  return {
    id: base.includes('/') ? base : `prendas/${base}`,
    nombre: r.nombre,
    detalle,
    precio: r.precio,
    qty: Math.min(Math.max(1, Math.floor(r.qty)), MAX_POR_PRODUCTO),
    miniatura: typeof r.miniatura === 'string' ? r.miniatura : undefined,
  };
}

export const $carrito = persistentAtom<ItemCarrito[]>('mm-carrito', [], {
  encode: JSON.stringify,
  decode: (raw) => {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.map(normalizar).filter((i): i is ItemCarrito => i !== null)
        : [];
    } catch {
      return [];
    }
  },
});

/**
 * Builds the product page URL of a cart item.
 *
 * @param id - "<coleccion>/<slug>".
 * @returns "/ropita/<slug>/" for clothes, "/<coleccion>/<slug>/" otherwise.
 */
export function urlProducto(id: string): string {
  const [coleccion, slug] = id.split('/');
  return conBase(coleccion === 'prendas' ? `/ropita/${slug}/` : `/${coleccion}/${slug}/`);
}

/**
 * Adds one unit of a product (creating the line if needed).
 *
 * @param item - Product data without quantity.
 */
export function agregarAlCarrito(item: Omit<ItemCarrito, 'qty'>) {
  const items = $carrito.get();
  const existente = items.find((i) => i.id === item.id);
  if (existente) {
    $carrito.set(
      items.map((i) =>
        i.id === item.id
          ? // Lines saved before thumbnails existed pick one up on the next add.
            { ...i, miniatura: i.miniatura ?? item.miniatura, qty: Math.min(i.qty + 1, MAX_POR_PRODUCTO) }
          : i
      )
    );
  } else {
    $carrito.set([...items, { ...item, qty: 1 }]);
  }
}

/**
 * Sets the quantity of a line; 0 or less removes it.
 *
 * @param id - "<coleccion>/<slug>".
 * @param qty - New quantity.
 */
export function cambiarCantidad(id: string, qty: number) {
  const items = $carrito.get();
  if (qty <= 0) {
    $carrito.set(items.filter((i) => i.id !== id));
  } else {
    $carrito.set(items.map((i) => (i.id === id ? { ...i, qty: Math.min(qty, MAX_POR_PRODUCTO) } : i)));
  }
}

/** Empties the cart. */
export function vaciarCarrito() {
  $carrito.set([]);
}

/** Display-only total (the server recomputes the real one). */
export function totalReferencia(items: ItemCarrito[]): number {
  return items.reduce((suma, i) => suma + i.precio * i.qty, 0);
}
