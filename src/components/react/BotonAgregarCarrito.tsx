/**
 * Isla React: botón "Agregar al carrito" en la página de detalle de prenda.
 * Se hidrata con client:load; el resto de la página sigue siendo HTML puro.
 */
import { useStore } from '@nanostores/react';
import { $carrito, agregarAlCarrito } from '../../stores/carrito';

interface Props {
  slug: string;
  nombre: string;
  talla: string;
  precio: number;
  stock: number;
}

export default function BotonAgregarCarrito({ slug, nombre, talla, precio, stock }: Props) {
  const items = useStore($carrito);
  const enCarrito = items.find((i) => i.slug === slug)?.qty ?? 0;
  const sinStock = enCarrito >= stock;

  return (
    <div className="agregar-carrito">
      <button
        className="boton"
        type="button"
        disabled={sinStock}
        onClick={() => agregarAlCarrito({ slug, nombre, talla, precio })}
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
