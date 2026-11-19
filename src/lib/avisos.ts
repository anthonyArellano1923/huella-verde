/**
 * Avisos a Martha: un correo por cada pago aprobado o transferencia
 * declarada, con referencia, monto e ítems. Además queda una línea en los
 * logs de Vercel (`[pago] ...`), que sirve de registro mínimo sin base de datos.
 *
 * Servicio: Resend (tiene plan gratuito, de sobra para este volumen). Se activa
 * solo si existe RESEND_API_KEY; sin ella, el aviso queda únicamente en logs.
 *
 * Importante: sin un dominio verificado en Resend, el remitente de prueba
 * (onboarding@resend.dev) SOLO puede enviar al correo dueño de la cuenta
 * Resend. Por eso la cuenta debe crearse con el correo de Martha, o bien
 * verificar el dominio y definir AVISO_PAGOS_DE.
 *
 * Un correo que falla NUNCA debe romper el pago: todo error se captura y el
 * envío tiene un tiempo máximo.
 */
import { NEGOCIO } from '../data/negocio';
import type { ItemPago } from './pasarela';
import { formatCLP } from '../utils/money';

/** Max wait for Resend before giving up (Vercel may kill slow functions). */
const TIEMPO_MAXIMO_MS = 4000;

/** Data included in every notice. */
export interface AvisoPago {
  /** "aprobado" (card payment confirmed) or "transferencia" (customer says they paid). */
  evento: 'aprobado' | 'transferencia';
  referencia: string;
  monto: number;
  /** Payment method as shown to Martha ("Webpay **** 6623", "MercadoPago", "Transferencia"). */
  medio: string;
  /** Items, or null when they could not be recovered (very long order). */
  items: ItemPago[] | null;
}

/** Escapes text for safe inclusion in the HTML email. */
const html = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/**
 * Builds subject and plain-text body of the notice.
 *
 * @param aviso - Notice data.
 * @returns Subject and text lines.
 */
function redactar(aviso: AvisoPago): { asunto: string; lineas: string[] } {
  const asunto =
    aviso.evento === 'aprobado'
      ? `Pago aprobado ${aviso.referencia} · ${formatCLP(aviso.monto)}`
      : `Transferencia por revisar ${aviso.referencia} · ${formatCLP(aviso.monto)}`;
  const lineas = [
    aviso.evento === 'aprobado'
      ? 'Se aprobó un pago online en la web.'
      : 'Un cliente indica que hizo una transferencia. Revisa tu cuenta bancaria antes de entregar.',
    '',
    `Referencia: ${aviso.referencia}`,
    `Monto: ${formatCLP(aviso.monto)}`,
    `Medio: ${aviso.medio}`,
    '',
    'Detalle:',
    ...(aviso.items
      ? aviso.items.map((i) => `• ${i.cantidad} × ${i.titulo} — ${formatCLP(i.precioUnitario * i.cantidad)}`)
      : ['• (detalle no disponible: busca la referencia en el chat de WhatsApp del cliente)']),
  ];
  return { asunto, lineas };
}

/**
 * Logs the payment and emails Martha when Resend is configured.
 * Never throws: failures are logged and swallowed.
 *
 * @param aviso - Notice data.
 */
export async function avisarPago(aviso: AvisoPago): Promise<void> {
  // Registro en logs de Vercel (Project → Logs). Una línea JSON por evento.
  console.log(`[pago] ${JSON.stringify({ ...aviso, fecha: new Date().toISOString() })}`);

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // aviso por correo desactivado

  const { asunto, lineas } = redactar(aviso);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.AVISO_PAGOS_DE ?? `${NEGOCIO.nombre} <onboarding@resend.dev>`,
        to: (process.env.AVISO_PAGOS_PARA ?? NEGOCIO.email).split(',').map((s) => s.trim()),
        subject: asunto,
        text: lineas.join('\n'),
        html: `<div style="font-family:sans-serif;line-height:1.5">${lineas
          .map((l) => (l ? `<p style="margin:0">${html(l)}</p>` : '<br>'))
          .join('')}</div>`,
      }),
      signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
    });
    if (!res.ok) console.error(`[aviso] Resend respondió ${res.status}: ${await res.text()}`);
  } catch (err) {
    console.error('[aviso] no se pudo enviar el correo:', err);
  }
}
