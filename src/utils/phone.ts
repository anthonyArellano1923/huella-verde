/**
 * Normalización de teléfonos móviles chilenos a formato E.164.
 * Patrón portado de Onoto y Sazón (rama feature/ux-pedidos-admin).
 *
 * El usuario siempre escribe los 9 dígitos locales (`9XXXXXXXX`); el
 * prefijo `+56` se agrega al guardar o mostrar, nunca se le pide.
 */

const CL_MOBILE_RE = /^9\d{8}$/;

/** Deja solo dígitos y quita el prefijo 56 si lo escribieron a mano. */
export function phoneToDigits(raw: string): string {
  if (!raw) return '';
  let digits = String(raw).replace(/\D/g, '');
  if (digits.startsWith('56') && digits.length > 9) digits = digits.slice(2);
  return digits;
}

/** Valida y normaliza a E.164 chileno: '912345678' → '+56912345678'. */
export function normalizePhone(raw: string): string | null {
  const digits = phoneToDigits(raw);
  if (!CL_MOBILE_RE.test(digits)) return null;
  return `+56${digits}`;
}
