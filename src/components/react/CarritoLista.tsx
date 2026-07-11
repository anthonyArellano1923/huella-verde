/**
 * Isla React: contenido de la página /carrito — lista editable + botón de
 * pago. Al pagar, envía SOLO slugs y cantidades a /api/pago/crear; el
 * servidor recalcula el total real y responde con la URL de MercadoPago.
 */
import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { $carrito, cambiarCantidad, totalReferencia } from '../../stores/carrito';

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

export default function CarritoLista() {
  const items = useStore($carrito);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <p className="carrito-vacio">
        Tu carrito está vacío. <a href="/ropita/">Ver el catálogo →</a>
      </p>
    );
  }

  async function pagar() {
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch('/api/pago/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'productos',
          items: items.map((i) => ({ slug: i.slug, qty: i.qty })),
        }),
      });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error ?? 'No se pudo iniciar el pago.');
      // Redirección al checkout: el formulario de pago vive en mercadopago.cl
      window.location.href = datos.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado. Intenta de nuevo.');
      setEnviando(false);
    }
  }

  return (
    <div className="carrito">
      <ul className="carrito__lista">
        {items.map((item) => (
          <li key={item.slug}>
            <div>
              <a href={`/ropita/${item.slug}/`}>{item.nombre}</a>
              <small> · talla {item.talla}</small>
            </div>
            <div className="carrito__controles">
              <button type="button" aria-label={`Quitar una unidad de ${item.nombre}`} onClick={() => cambiarCantidad(item.slug, item.qty - 1)}>
                −
              </button>
              <span aria-live="polite">{item.qty}</span>
              <button type="button" aria-label={`Agregar una unidad de ${item.nombre}`} onClick={() => cambiarCantidad(item.slug, item.qty + 1)}>
                +
              </button>
              <strong>{formatCLP(item.precio * item.qty)}</strong>
            </div>
          </li>
        ))}
      </ul>

      <p className="carrito__total">
        Total: <strong>{formatCLP(totalReferencia(items))}</strong>
      </p>

      {error && (
        <p className="carrito__error" role="alert">
          {error}
        </p>
      )}

      <button className="boton" type="button" disabled={enviando} onClick={pagar}>
        {enviando ? 'Conectando con MercadoPago…' : 'Pagar con MercadoPago'}
      </button>
      <p className="carrito__nota">
        Pago seguro procesado por MercadoPago: tarjetas de débito y crédito,
        o saldo de tu cuenta MP.
      </p>
    </div>
  );
}
