/**
 * Isla React: botón "Agregar al carrito" en la página de detalle de un
 * producto (prenda, planta o accesorio). Se hidrata con client:load; el
 * resto de la página sigue siendo HTML puro.
 *
 * Contrato con el catálogo:
 * - `slug` acepta el id completo "<coleccion>/<slug>" (p. ej. "plantas/cinta")
 *   o solo el slug; en ese caso se usa `coleccion` (por defecto "prendas",
 *   para que /ropita siga funcionando sin cambios).
 * - `talla` es opcional; "única" u omitida no se muestra en el carrito.
 */
import { useStore } from '@nanostores/react';
import { $carrito, agregarAlCarrito } from '../../stores/carrito';

interface Props {
  slug: string;
  coleccion?: 'prendas' | 'plantas' | 'accesorios';
  nombre: string;
  talla?: string;
  precio: number;
  stock: number;
  /** Thumbnail URL for the cart drawer (see utils/miniatura.ts). */
  miniatura?: string;
}

/**
 * Add-to-cart button that respects the available stock.
 *
 * @param props - Product data (see the contract above).
 */
export default function BotonAgregarCarrito({ slug, coleccion = 'prendas', nombre, talla, precio, stock, miniatura }: Props) {
  const id = slug.includes('/') ? slug : `${coleccion}/${slug}`;
  const detalle = talla && talla !== 'única' ? `talla ${talla}` : undefined;
  const items = useStore($carrito);
  const enCarrito = items.find((i) => i.id === id)?.qty ?? 0;
  const sinStock = enCarrito >= stock;

  return (
    <div className="agregar-carrito">
      <button
        className="boton"
        type="button"
        disabled={sinStock}
        onClick={() => agregarAlCarrito({ id, nombre, detalle, precio, miniatura })}
      >
        {sinStock ? 'No quedan más unidades' : 'Agregar al carrito 🛒'}
      </button>
      {enCarrito > 0 && (
        <p className="en-carrito" role="status">
          {enCarrito} en tu carrito · <a href="/carrito/">ir a pagar →</a>
        </p>
      )}
    </div>
  );
}
