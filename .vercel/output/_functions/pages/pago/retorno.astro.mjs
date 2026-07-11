import { d as createAstro, c as createComponent, r as renderComponent, e as renderScript, a as renderTemplate, m as maybeRenderHead, F as Fragment, b as addAttribute } from '../../chunks/astro/server_ChiqBPSF.mjs';
import 'piccolore';
import { b as waLink, N as NEGOCIO, f as formatCLP, $ as $$Base } from '../../chunks/Base_BPwNzqpZ.mjs';
import { w as webpayTransaction } from '../../chunks/transbank_7U-WXAui.mjs';
/* empty css                                      */
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("https://www.marthamella.cl");
const prerender = false;
const $$Retorno = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Retorno;
  const params = Astro2.request.method === "POST" ? new URLSearchParams(await Astro2.request.text()) : Astro2.url.searchParams;
  const tokenWs = params.get("token_ws");
  const tokenAnulacion = params.get("TBK_TOKEN");
  let estado = "invalido";
  let detalle = null;
  if (tokenWs) {
    try {
      const tx = webpayTransaction();
      const r = await tx.commit(tokenWs);
      if (r.response_code === 0 && r.status === "AUTHORIZED") {
        estado = "aprobado";
        detalle = {
          buyOrder: r.buy_order,
          monto: r.amount,
          tarjeta: r.card_detail?.card_number ?? "****",
          codigoAutorizacion: r.authorization_code
        };
      } else {
        estado = "rechazado";
      }
    } catch (err) {
      console.error("Error confirmando transacci\xF3n Webpay:", err);
      estado = "error";
    }
  } else if (tokenAnulacion) {
    estado = "anulado";
  }
  const esReserva = detalle?.buyOrder.includes("-RS-") ?? false;
  const waComprobante = detalle ? waLink(
    `\xA1Hola! Acabo de pagar con Webpay en la web de ${NEGOCIO.nombre}.
Orden: ${detalle.buyOrder}
Monto: ${formatCLP(detalle.monto)}
` + (esReserva ? "Es el pago de una reserva \u2014 te confirmo la hora que agend\xE9." : "Es una compra de ropita \u2014 \xBFcoordinamos la entrega?")
  ) : "";
  const titulos = {
    aprobado: "\xA1Pago aprobado! \u{1F389}",
    rechazado: "Pago rechazado",
    anulado: "Pago anulado",
    invalido: "P\xE1gina de retorno de pagos",
    error: "No pudimos confirmar tu pago"
  };
  return renderTemplate`${renderComponent($$result, "Base", $$Base, { "titulo": titulos[estado], "descripcion": "Resultado de tu pago con Webpay.", "data-astro-cid-hjcfucag": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="contenedor resultado" data-astro-cid-hjcfucag> <h1 data-astro-cid-hjcfucag>${titulos[estado]}</h1> ${estado === "aprobado" && detalle && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-hjcfucag": true }, { "default": async ($$result3) => renderTemplate` <dl class="voucher" data-astro-cid-hjcfucag> <div data-astro-cid-hjcfucag> <dt data-astro-cid-hjcfucag>Orden de compra</dt> <dd data-astro-cid-hjcfucag>${detalle.buyOrder}</dd> </div> <div data-astro-cid-hjcfucag> <dt data-astro-cid-hjcfucag>Monto pagado</dt> <dd data-astro-cid-hjcfucag>${formatCLP(detalle.monto)}</dd> </div> <div data-astro-cid-hjcfucag> <dt data-astro-cid-hjcfucag>Tarjeta</dt> <dd data-astro-cid-hjcfucag>**** ${detalle.tarjeta.slice(-4)}</dd> </div> <div data-astro-cid-hjcfucag> <dt data-astro-cid-hjcfucag>Código de autorización</dt> <dd data-astro-cid-hjcfucag>${detalle.codigoAutorizacion}</dd> </div> </dl> ${esReserva ? renderTemplate`<div class="siguiente" data-astro-cid-hjcfucag> <h2 data-astro-cid-hjcfucag>Último paso: elige tu hora</h2> <p data-astro-cid-hjcfucag>
Tu pago quedó registrado con la orden <strong data-astro-cid-hjcfucag>${detalle.buyOrder}</strong>.
                Ahora agenda la hora en el calendario y <strong data-astro-cid-hjcfucag>escribe esta orden en las
                notas de la reserva</strong> para que Martha la asocie a tu pago.
</p> <a class="boton" href="/reservar/" data-astro-cid-hjcfucag>Agendar mi hora →</a> </div>` : renderTemplate`<div class="siguiente" data-astro-cid-hjcfucag> <h2 data-astro-cid-hjcfucag>¿Y ahora?</h2> <p data-astro-cid-hjcfucag>
Guarda pantallazo de esta página. Escríbenos por WhatsApp para
                coordinar la entrega (retiro en la peluquería o encomienda):
</p> <a class="boton boton--whatsapp"${addAttribute(waComprobante, "href")} rel="noopener" data-astro-cid-hjcfucag>
Coordinar entrega por WhatsApp
</a> </div>`}<p class="script-carrito"${addAttribute(esReserva ? void 0 : "", "data-limpiar-carrito")} data-astro-cid-hjcfucag></p> ` })}`} ${estado === "rechazado" && renderTemplate`<p data-astro-cid-hjcfucag>
Tu banco no autorizó el pago (fondos, cupo o datos de la tarjeta).
          No se descontó dinero. Puedes <a href="/carrito/" data-astro-cid-hjcfucag>intentar de nuevo</a> con
          otra tarjeta, o <a href="/ropita/" data-astro-cid-hjcfucag>volver al catálogo</a>.
</p>`} ${estado === "anulado" && renderTemplate`<p data-astro-cid-hjcfucag>
Cancelaste el pago en Webpay — no se cobró nada.
          Tu carrito sigue guardado si quieres <a href="/carrito/" data-astro-cid-hjcfucag>retomarlo</a>.
</p>`} ${estado === "error" && renderTemplate`<p data-astro-cid-hjcfucag>
Ocurrió un problema al confirmar con Transbank. <strong data-astro-cid-hjcfucag>Si viste el
          comprobante de Webpay, tu pago probablemente se realizó</strong> —
          escríbenos por <a${addAttribute(waLink(`Hola, pagu\xE9 con Webpay en la web de ${NEGOCIO.nombre} pero la confirmaci\xF3n fall\xF3. \xBFMe ayudan a verificar?`), "href")} rel="noopener" data-astro-cid-hjcfucag>WhatsApp</a> y
          lo verificamos al tiro. Si no alcanzaste a pagar, intenta de nuevo.
</p>`} ${estado === "invalido" && renderTemplate`<p data-astro-cid-hjcfucag>
Esta página muestra el resultado de un pago con Webpay. Si llegaste
          aquí por error, <a href="/" data-astro-cid-hjcfucag>vuelve al inicio</a>.
</p>`} </div> ` })} ${renderScript($$result, "/Users/anthonyarellano/Dev/peluqueria-canina/src/pages/pago/retorno.astro?astro&type=script&index=0&lang.ts")} `;
}, "/Users/anthonyarellano/Dev/peluqueria-canina/src/pages/pago/retorno.astro", void 0);

const $$file = "/Users/anthonyarellano/Dev/peluqueria-canina/src/pages/pago/retorno.astro";
const $$url = "/pago/retorno";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Retorno,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
