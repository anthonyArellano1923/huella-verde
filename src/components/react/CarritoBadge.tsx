/**
 * Isla React: contador del carrito en el header. client:load para que el
 * número aparezca apenas carga la página.
 */
import { useStore } from '@nanostores/react';
import { $carrito } from '../../stores/carrito';

export default function CarritoBadge() {
  const items = useStore($carrito);
  const cantidad = items.reduce((suma, i) => suma + i.qty, 0);

  return (
    <a className="carrito-badge" href="/carrito/" aria-label={`Carrito, ${cantidad} productos`}>
      🛒
      {cantidad > 0 && <span className="carrito-badge__numero">{cantidad}</span>}
    </a>
  );
}
