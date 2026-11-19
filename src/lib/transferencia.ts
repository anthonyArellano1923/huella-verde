/**
 * Pago por transferencia bancaria directa (sin pasarela, 0% de comisión).
 *
 * Cómo funciona, sin base de datos:
 * 1. El cliente arma el carrito y elige "transferencia". El servidor valida
 *    el pedido igual que con tarjeta (precios del catálogo, stock) y genera
 *    una referencia única corta (ej. HV-PR-K7Q2MX9A).
 * 2. El servidor devuelve la URL de /pago/transferencia con el pedido
 *    codificado y FIRMADO (firma.ts): la página muestra datos bancarios,
 *    monto exacto, referencia e ítems, y nadie puede alterar el monto.
 * 3. El cliente transfiere, pulsa "Ya transferí": se avisa a Martha por
 *    correo (avisos.ts) y se abre WhatsApp con la referencia para que envíe
 *    el comprobante. Martha verifica en su banco antes de entregar.
 *
 * Limitación conocida: la transferencia NO descuenta stock (no hay base de
 * datos); Martha confirma disponibilidad al recibir el comprobante.
 */
import { DATOS_TRANSFERENCIA } from '../data/negocio';
import { ConfigError } from './errores';
import { firmar, verificarFirma } from './firma';

/**
 * Single source of truth for "can we offer bank transfer?": true only when
 * every bank field in negocio.ts has real data (no empty field, no TODO
 * placeholder). Applies in EVERY environment (local, Preview, Production),
 * so the customer never sees placeholder text or a fake account.
 *
 * @returns true when bank transfer can be offered.
 */
export function transferenciaDisponible(): boolean {
  return Object.values(DATOS_TRANSFERENCIA).every((v) => v.trim() !== '' && !/TODO/i.test(v));
}

/**
 * Guards the transfer method: refuses to run while bank data is placeholder.
 *
 * @throws ConfigError when bank data is incomplete.
 */
export function exigirTransferenciaDisponible(): void {
  if (!transferenciaDisponible()) {
    throw new ConfigError('Faltan los datos bancarios reales en src/data/negocio.ts.');
  }
}

/** Signed transfer order as it travels in the URL of /pago/transferencia. */
export interface OrdenTransferencia {
  /** Unique reference the customer writes in the transfer comment. */
  ref: string;
  /** Compact order (pedido.ts codificarPedido). */
  pedido: string;
  /** Amount in CLP computed by the server. */
  monto: number;
}

/** Text covered by the signature: any change to ref, order or amount breaks it. */
const textoFirmado = (o: OrdenTransferencia) => `tr|${o.ref}|${o.pedido}|${o.monto}`;

/**
 * Builds the relative URL of the transfer instructions page.
 *
 * @param orden - Reference, compact order and amount.
 * @returns Path with signed query string.
 */
export function urlTransferencia(orden: OrdenTransferencia): string {
  const q = new URLSearchParams({
    ref: orden.ref,
    p: orden.pedido,
    m: String(orden.monto),
    s: firmar(textoFirmado(orden)),
  });
  return `/pago/transferencia/?${q}`;
}

/**
 * Reads and verifies a signed transfer order from query params or a JSON body.
 *
 * @param datos - Object with ref, p, m and s (strings).
 * @returns The order if the signature is valid, otherwise null.
 */
export function leerOrdenFirmada(datos: Record<string, unknown>): OrdenTransferencia | null {
  const { ref, p, m, s } = datos;
  if (typeof ref !== 'string' || typeof p !== 'string' || typeof s !== 'string') return null;
  const monto = Number(m);
  if (!Number.isInteger(monto) || monto <= 0) return null;
  const orden = { ref, pedido: p, monto };
  return verificarFirma(textoFirmado(orden), s) ? orden : null;
}
