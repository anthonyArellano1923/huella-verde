/**
 * Políticas comerciales que alimentan /terminos (y los textos de entrega de
 * la tienda). ÚNICO lugar donde se editan: la página arma sus párrafos a
 * partir de estos valores.
 *
 * Cómo completar:
 * - Cada campo con `TODO(Anthony)` es una decisión de Martha. La mayoría ya
 *   trae un valor razonable (propuesta) que solo hay que confirmar o cambiar
 *   por otra de las opciones indicadas en su tipo.
 * - Los campos en `null` son datos que no se pueden suponer (RUT, razón
 *   social, comunas de despacho…). Mientras estén en `null`, la línea
 *   correspondiente no se muestra.
 * - Al terminar, poner `revisado: true`. Recién ahí /terminos deja de llevar
 *   `noindex` y entra al sitemap (ver `terminosPublicables()`).
 *
 * Base legal (Ley 19.496, texto refundido DFL 3/2021, con Ley 21.398):
 * - Art. 3 bis b): retracto de 10 días desde la recepción en compras a
 *   distancia. En bienes solo se excluye si "pueden deteriorarse o caducar
 *   con rapidez" (plantas) y hay que informarlo antes del pago. En servicios
 *   el proveedor puede excluirlo informándolo antes del pago. Devolución del
 *   dinero antes de 45 días. Sin confirmación escrita (art. 12 A) el plazo
 *   sube a 90 días.
 * - Arts. 20 y 21: garantía legal de 6 meses (cambio, reparación o
 *   devolución, a elección del cliente). Perecibles: plazo impreso o, en su
 *   defecto, máximo 7 días. No es renunciable: va fija en el texto.
 */

/** Quién paga el envío de vuelta cuando el cliente se retracta. */
type CostoDevolucion = 'cliente' | 'tienda';
/** Cuánto se paga online al reservar. */
type PagoReserva = 'precio-base' | 'abono';
/** Qué recibe quien cancela a tiempo una reserva pagada. */
type DevolucionCancelacion = 'reembolso' | 'reagendar-o-reembolso';
/** Qué pasa con lo pagado si el cliente no llega. */
type Inasistencia = 'se-pierde' | 'reagendar-una-vez';

export const TERMINOS = {
  // TODO(Anthony): poner true cuando Martha confirme todo lo de este archivo.
  revisado: false,

  /** Fecha de la versión vigente (AAAA-MM-DD). Actualizar con cada cambio. */
  actualizado: '2026-11-19',

  /** Datos legales del vendedor (los de contacto salen de NEGOCIO). */
  vendedor: {
    // TODO(Anthony): nombre o razón social con que Martha emite boletas.
    razonSocial: null as string | null,
    // TODO(Anthony): RUT del emisor de las boletas (formato 12.345.678-9).
    rut: null as string | null,
  },

  entrega: {
    // TODO(Anthony): ¿se puede retirar en el local? (propuesta: sí).
    retiroEnLocal: true,
    // TODO(Anthony): días hábiles hasta que el pedido está listo para retiro.
    retiroDiasHabiles: 2,
    // TODO(Anthony): ¿hay despacho a domicilio? Si es false, se oculta todo
    // lo de despacho y la tienda habla solo de retiro.
    despacho: false,
    // TODO(Anthony): comunas con despacho, p. ej. 'Santiago Centro, Providencia y Ñuñoa'.
    despachoComunas: null as string | null,
    // TODO(Anthony): cómo se cobra, p. ej. '$3.500 fijo' o 'según comuna, se informa al coordinar'.
    despachoCosto: null as string | null,
    // TODO(Anthony): días hábiles de entrega a domicilio desde el pago.
    despachoDiasHabiles: 3,
  },

  retracto: {
    // TODO(Anthony): excluir el retracto en plantas por ser perecibles
    // (permitido por el art. 3 bis b). Propuesta: true.
    excluirPlantas: true,
    // TODO(Anthony): quién paga el envío de vuelta en un retracto ('cliente' | 'tienda').
    costoDevolucion: 'cliente' as CostoDevolucion,
  },

  plantas: {
    // TODO(Anthony): días para reclamar una planta que llegó enferma o
    // dañada. La ley fija un máximo de 7 si no hay plazo impreso; se puede
    // dar más, no menos.
    diasReclamo: 7,
  },

  /**
   * Cambio voluntario (sin falla) de accesorios, adicional a la ley.
   * TODO(Anthony): días que da Martha para cambiar un accesorio sin uso por
   * otro producto, o `null` si no ofrece cambio voluntario.
   */
  cambioVoluntarioDias: 10 as number | null,

  reservas: {
    // TODO(Anthony): 'precio-base' (hoy: se paga el "desde" completo) o 'abono'.
    pagoOnline: 'precio-base' as PagoReserva,
    // TODO(Anthony): % del precio base si `pagoOnline` es 'abono'.
    abonoPorcentaje: 30,
    // TODO(Anthony): al cancelar a tiempo, ¿solo reembolso o puede elegir reagendar?
    cancelacionATiempo: 'reagendar-o-reembolso' as DevolucionCancelacion,
    // TODO(Anthony): al cancelar tarde o no llegar ('se-pierde' | 'reagendar-una-vez').
    inasistencia: 'reagendar-una-vez' as Inasistencia,
    // TODO(Anthony): días para usar ese reagendamiento único.
    reagendarDentroDias: 30,
    // TODO(Anthony): minutos de atraso tolerados antes de tratarlo como inasistencia.
    toleranciaAtrasoMin: 15,
    // TODO(Anthony): excluir el retracto en reservas (art. 3 bis b permite
    // excluirlo en servicios si se informa antes del pago). Propuesta: true;
    // la cancelación con aviso ya cubre ese caso.
    excluirRetracto: true,
  },

  pagos: {
    // TODO(Anthony): días hábiles para devolver el dinero en reembolsos
    // (máximo legal: 45 días corridos).
    reembolsoDiasHabiles: 10,
  },

  // TODO(Anthony): 'electronica' (boleta del SII por correo) o 'papel' (se entrega con el pedido).
  boleta: 'electronica' as 'electronica' | 'papel',
};

/**
 * Tells whether /terminos is final: reviewed and with every legal datum set.
 * Drives the page's `noindex` and its exclusion from the sitemap.
 *
 * @returns true when the page can be indexed by search engines.
 */
export function terminosPublicables(): boolean {
  const { vendedor, entrega } = TERMINOS;
  const despachoCompleto = !entrega.despacho || (entrega.despachoComunas !== null && entrega.despachoCosto !== null);
  return TERMINOS.revisado && vendedor.razonSocial !== null && vendedor.rut !== null && despachoCompleto;
}

/**
 * Short delivery sentence for the shop (listing meta descriptions, product
 * notes), derived from the delivery options above.
 *
 * @returns e.g. "Retiro en el local o despacho a domicilio."
 */
export function resumenEntrega(): string {
  const { retiroEnLocal, despacho } = TERMINOS.entrega;
  if (retiroEnLocal && despacho) return 'Retiro en el local o despacho a domicilio.';
  if (despacho) return 'Despacho a domicilio.';
  return 'Retiro en el local.';
}
