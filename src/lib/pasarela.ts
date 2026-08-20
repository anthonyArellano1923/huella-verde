/**
 * Interfaz común de pasarela de pago — esconde si detrás corre Webpay
 * (Transbank) o Checkout Pro (MercadoPago). El resto del código (endpoint de
 * pago, página de retorno, UI) habla SOLO con esta interfaz.
 *
 * La pasarela activa se elige con la variable de entorno PASARELA_PAGO
 * (webpay | mercadopago), por defecto "webpay": es la única que funciona sin
 * que Martha/Anthony creen ninguna cuenta (Transbank publica credenciales de
 * prueba públicas; MercadoPago exige un token propio incluso para probar).
 */
import { pasarelaWebpay } from './pasarelas/webpay';
import { pasarelaMercadoPago } from './pasarelas/mercadopago';

export interface ItemPago {
  id: string;
  titulo: string;
  cantidad: number;
  precioUnitario: number;
}

export interface SolicitudPago {
  tipo: 'productos' | 'reserva';
  monto: number;
  items: ItemPago[];
  referencia: string;
  returnUrl: string;
  notifyUrl: string;
}

export interface RespuestaPago {
  /** URL completa a la que el front redirige — cada pasarela arma la suya
   *  (Webpay le agrega `?token_ws=` aquí adentro; el front nunca ve tokens). */
  urlRedireccion: string;
}

export type EstadoPago = 'aprobado' | 'pendiente' | 'rechazado' | 'anulado' | 'invalido' | 'error';

export interface ResultadoRetorno {
  estado: EstadoPago;
  detalle: {
    referencia: string;
    monto: number;
    medio: string;
    comprobante: string;
  } | null;
}

export interface PasarelaPago {
  readonly id: 'webpay' | 'mercadopago';
  readonly nombre: string;
  crearPago(solicitud: SolicitudPago): Promise<RespuestaPago>;
  verificarRetorno(request: Request, url: URL): Promise<ResultadoRetorno>;
}

/**
 * Referencia única, máx. 26 caracteres (límite de buyOrder de Transbank;
 * MercadoPago acepta hasta 256, así que 26 sirve para ambas). Prefijo por
 * tipo: PR=productos, RS=reserva.
 */
export function generarReferencia(tipo: 'productos' | 'reserva'): string {
  const prefijo = tipo === 'productos' ? 'PR' : 'RS';
  const tiempo = Date.now().toString(36);
  const azar = Math.random().toString(36).slice(2, 8);
  return `MM-${prefijo}-${tiempo}-${azar}`.slice(0, 26);
}

/**
 * Pasarela activa según PASARELA_PAGO. Por defecto "webpay".
 *
 * Se lee con `process.env` y NO con `import.meta.env` a propósito: Astro
 * reemplaza `import.meta.env.X` por su valor EN EL MOMENTO DEL BUILD. Si la
 * variable no existe al compilar, queda como `undefined` y el compilador
 * borra como código muerto la rama que dependía de ella — esta función
 * quedaba literalmente compilada como `return pasarelaWebpay`, y cambiar la
 * variable en Vercel después no tenía ningún efecto. `process.env` se lee
 * cada vez que corre la función serverless, que es lo que queremos.
 */
export function getPasarela(): PasarelaPago {
  const cual = process.env.PASARELA_PAGO ?? 'webpay';
  return cual === 'mercadopago' ? pasarelaMercadoPago : pasarelaWebpay;
}
