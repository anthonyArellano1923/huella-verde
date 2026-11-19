/**
 * Isla React: contenido de la página /carrito — lista editable + dos medios
 * de pago:
 * - Tarjeta: el servidor responde con la URL de la pasarela activa (Webpay o
 *   MercadoPago, según PASARELA_PAGO).
 * - Transferencia: el servidor responde con la URL de /pago/transferencia
 *   (datos bancarios y referencia única).
 * En ambos casos se envían SOLO ids y cantidades a /api/pago/crear; el
 * servidor recalcula el total real.
 */
import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { $carrito, cambiarCantidad, totalReferencia, urlProducto } from '../../stores/carrito';

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

type Medio = 'tarjeta' | 'transferencia';

/** Editable cart list with card and bank-transfer checkout buttons. */
export default function CarritoLista() {
  const items = useStore($carrito);
  const [enviando, setEnviando] = useState<Medio | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <p className="carrito-vacio">
        Tu carrito está vacío. <a href="/">Ver la tienda →</a>
      </p>
    );
  }

  /**
   * Starts checkout with the chosen method and redirects to the URL the
   * server returns.
   *
   * @param medio - "tarjeta" or "transferencia".
   */
  async function pagar(medio: Medio) {
    setEnviando(medio);
    setError(null);
    try {
      const res = await fetch('/api/pago/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'productos',
          medio,
          items: items.map((i) => ({ id: i.id, qty: i.qty })),
        }),
      });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error ?? 'No se pudo iniciar el pago.');
      window.location.href = datos.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado. Intenta de nuevo.');
      setEnviando(null);
    }
  }

  return (
    <div className="carrito">
      <ul className="carrito__lista">
        {items.map((item) => (
          <li key={item.id}>
            <div>
              <a href={urlProducto(item.id)}>{item.nombre}</a>
              {item.detalle && <small> · {item.detalle}</small>}
            </div>
            <div className="carrito__controles">
              <button
                type="button"
                aria-label={`Quitar una unidad de ${item.nombre}`}
                onClick={() => cambiarCantidad(item.id, item.qty - 1)}
              >
                −
              </button>
              <span aria-live="polite">{item.qty}</span>
              <button
                type="button"
                aria-label={`Agregar una unidad de ${item.nombre}`}
                onClick={() => cambiarCantidad(item.id, item.qty + 1)}
              >
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

      <div className="carrito__pagos">
        <button className="boton" type="button" disabled={enviando !== null} onClick={() => pagar('tarjeta')}>
          {enviando === 'tarjeta' ? 'Conectando con el pago seguro…' : 'Pagar con tarjeta'}
        </button>
        <button
          className="boton boton--secundario"
          type="button"
          disabled={enviando !== null}
          onClick={() => pagar('transferencia')}
        >
          {enviando === 'transferencia' ? 'Preparando datos…' : 'Pagar por transferencia'}
        </button>
      </div>
      <p className="carrito__nota">
        Tarjeta: débito, crédito o prepago, en el sitio seguro del medio de pago.
        Transferencia: te mostramos los datos bancarios y una referencia para tu pedido.
      </p>
    </div>
  );
}
