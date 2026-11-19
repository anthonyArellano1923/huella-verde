/**
 * Isla React: contenido de la página /carrito — lista editable + dos medios
 * de pago:
 * - Tarjeta: el servidor responde con la URL de la pasarela activa (Webpay o
 *   MercadoPago, según PASARELA_PAGO).
 * - Transferencia: el servidor responde con la URL de /pago/transferencia
 *   (datos bancarios y referencia única).
 * En ambos casos se envían SOLO ids y cantidades a /api/pago/crear; el
 * servidor recalcula el total real.
 *
 * Qué botones se muestran lo decide el servidor (/api/pago/estado): el
 * interruptor PAGOS_ONLINE y los datos bancarios son de runtime y esta página
 * es estática. Mientras se consulta, o si la consulta falla, o si no hay
 * ningún medio disponible, se ofrece pedir por WhatsApp con el detalle.
 */
import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $carrito, cambiarCantidad, totalReferencia, urlProducto, type ItemCarrito } from '../../stores/carrito';
import { waLink } from '../../utils/whatsapp';

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

type Medio = 'tarjeta' | 'transferencia';

/** Payment methods the server says are available (null while loading). */
type Medios = Record<Medio, boolean>;

/** Fallback when the status endpoint fails: offer WhatsApp only. */
const SIN_MEDIOS: Medios = { tarjeta: false, transferencia: false };

/**
 * Builds the WhatsApp link with the cart detail and reference total.
 *
 * @param items - Current cart items.
 * @returns wa.me link with a pre-filled order message.
 */
function waPedido(items: ItemCarrito[]): string {
  const lineas = items.map(
    (i) => `• ${i.qty} × ${i.nombre}${i.detalle ? ` (${i.detalle})` : ''} — ${formatCLP(i.precio * i.qty)}`
  );
  return waLink(
    ['¡Hola! Quiero hacer este pedido desde la web:', '', ...lineas, '', `Total: ${formatCLP(totalReferencia(items))}`, '', '¿Cómo coordinamos el pago y la entrega?'].join('\n')
  );
}

/** Editable cart list with card and bank-transfer checkout buttons. */
export default function CarritoLista() {
  const items = useStore($carrito);
  const [enviando, setEnviando] = useState<Medio | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [medios, setMedios] = useState<Medios | null>(null);

  // Una consulta al cargar: qué medios de pago ofrece hoy el servidor.
  useEffect(() => {
    let vigente = true;
    fetch('/api/pago/estado', { cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<Medios>) : SIN_MEDIOS))
      .catch(() => SIN_MEDIOS)
      .then((m) => {
        if (vigente) setMedios({ tarjeta: m.tarjeta === true, transferencia: m.transferencia === true });
      });
    return () => {
      vigente = false;
    };
  }, []);

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

      {medios === null ? (
        <p className="carrito__nota" aria-live="polite">
          Cargando medios de pago…
        </p>
      ) : medios.tarjeta || medios.transferencia ? (
        <>
          <div className="carrito__pagos">
            {medios.tarjeta && (
              <button className="boton" type="button" disabled={enviando !== null} onClick={() => pagar('tarjeta')}>
                {enviando === 'tarjeta' ? 'Conectando con el pago seguro…' : 'Pagar con tarjeta'}
              </button>
            )}
            {medios.transferencia && (
              <button
                className={medios.tarjeta ? 'boton boton--secundario' : 'boton'}
                type="button"
                disabled={enviando !== null}
                onClick={() => pagar('transferencia')}
              >
                {enviando === 'transferencia' ? 'Preparando datos…' : 'Pagar por transferencia'}
              </button>
            )}
          </div>
          <p className="carrito__nota">
            {medios.tarjeta &&
              'Tarjeta: débito, crédito o prepago, en el sitio seguro del medio de pago. '}
            {medios.transferencia &&
              'Transferencia: te mostramos los datos bancarios y una referencia para tu pedido. '}
            ¿Prefieres coordinar? <a href={waPedido(items)} rel="noopener">Pide por WhatsApp</a>.
          </p>
        </>
      ) : (
        <>
          <div className="carrito__pagos">
            <a className="boton boton--whatsapp" href={waPedido(items)} rel="noopener">
              Pedir por WhatsApp
            </a>
          </div>
          <p className="carrito__nota">
            El pago online no está disponible en este momento. Envíanos tu pedido por
            WhatsApp y coordinamos el pago y la entrega.
          </p>
        </>
      )}
    </div>
  );
}
