import { d as createAstro, c as createComponent, r as renderComponent, e as renderScript, a as renderTemplate, m as maybeRenderHead, F as Fragment, b as addAttribute } from '../../chunks/astro/server_CCMtOgds.mjs';
import 'piccolore';
import { b as waLink, N as NEGOCIO, f as formatCLP, $ as $$Base } from '../../chunks/Base_BQRSj8Cl.mjs';
import { a as mpPayment } from '../../chunks/mercadopago_CV3ElNhM.mjs';
/* empty css                                      */
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("https://www.huellaverde.cl");
const prerender = false;
const $$Retorno = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Retorno;
  const params = Astro2.url.searchParams;
  const paymentId = params.get("payment_id") ?? params.get("collection_id");
  let estado = "invalido";
  let detalle = null;
  if (paymentId && paymentId !== "null") {
    try {
      const pago = await mpPayment().get({ id: paymentId });
      if (pago.status === "approved") {
        estado = "aprobado";
      } else if (pago.status === "in_process" || pago.status === "pending") {
        estado = "pendiente";
      } else {
        estado = "rechazado";
      }
      detalle = {
        referencia: pago.external_reference ?? "\u2014",
        monto: pago.transaction_amount ?? 0,
        medio: pago.payment_method_id ?? "MercadoPago",
        idPago: String(pago.id)
      };
    } catch (err) {
      console.error("Error verificando pago en MercadoPago:", err);
      estado = "error";
    }
  }
  const esReserva = detalle?.referencia.includes("-RS-") ?? false;
  const waComprobante = detalle ? waLink(
    `\xA1Hola! Acabo de pagar con MercadoPago en la web de ${NEGOCIO.nombre}.
Referencia: ${detalle.referencia}
Pago MP: ${detalle.idPago}
Monto: ${formatCLP(detalle.monto)}
` + (esReserva ? "Es el pago de una reserva \u2014 te confirmo la hora que agend\xE9." : "Es una compra de ropita \u2014 \xBFcoordinamos la entrega?")
  ) : "";
  const titulos = {
    aprobado: "\xA1Pago aprobado! \u{1F389}",
    pendiente: "Pago en proceso",
    rechazado: "Pago rechazado",
    invalido: "P\xE1gina de retorno de pagos",
    error: "No pudimos verificar tu pago"
  };
  return renderTemplate`${renderComponent($$result, "Base", $$Base, { "titulo": titulos[estado], "descripcion": "Resultado de tu pago con MercadoPago.", "data-astro-cid-hjcfucag": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="contenedor resultado" data-astro-cid-hjcfucag> <h1 data-astro-cid-hjcfucag>${titulos[estado]}</h1> ${(estado === "aprobado" || estado === "pendiente") && detalle && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-hjcfucag": true }, { "default": async ($$result3) => renderTemplate` <dl${addAttribute(["voucher", { pendiente: estado === "pendiente" }], "class:list")} data-astro-cid-hjcfucag> <div data-astro-cid-hjcfucag> <dt data-astro-cid-hjcfucag>Referencia</dt> <dd data-astro-cid-hjcfucag>${detalle.referencia}</dd> </div> <div data-astro-cid-hjcfucag> <dt data-astro-cid-hjcfucag>Monto</dt> <dd data-astro-cid-hjcfucag>${formatCLP(detalle.monto)}</dd> </div> <div data-astro-cid-hjcfucag> <dt data-astro-cid-hjcfucag>Medio de pago</dt> <dd data-astro-cid-hjcfucag>${detalle.medio}</dd> </div> <div data-astro-cid-hjcfucag> <dt data-astro-cid-hjcfucag>N° de pago MP</dt> <dd data-astro-cid-hjcfucag>${detalle.idPago}</dd> </div> </dl> ${estado === "pendiente" && renderTemplate`<p class="nota-pendiente" data-astro-cid-hjcfucag>
Tu pago está en proceso (por ejemplo, pago en efectivo o
              transferencia que tarda en acreditarse). Te llegará un correo de
              MercadoPago cuando se confirme.
</p>`}${esReserva ? renderTemplate`<div class="siguiente" data-astro-cid-hjcfucag> <h2 data-astro-cid-hjcfucag>Último paso: elige tu hora</h2> <p data-astro-cid-hjcfucag>
Tu pago quedó registrado con la referencia <strong data-astro-cid-hjcfucag>${detalle.referencia}</strong>.
                Ahora agenda la hora en el calendario y <strong data-astro-cid-hjcfucag>escribe esta referencia en las
                notas de la reserva</strong> para que Martha la asocie a tu pago.
</p> <a class="boton" href="/reservar/" data-astro-cid-hjcfucag>Agendar mi hora →</a> </div>` : renderTemplate`<div class="siguiente" data-astro-cid-hjcfucag> <h2 data-astro-cid-hjcfucag>¿Y ahora?</h2> <p data-astro-cid-hjcfucag>
Guarda pantallazo de esta página. Escríbenos por WhatsApp para
                coordinar la entrega (retiro en la peluquería o encomienda):
</p> <a class="boton boton--whatsapp"${addAttribute(waComprobante, "href")} rel="noopener" data-astro-cid-hjcfucag>
Coordinar entrega por WhatsApp
</a> </div>`}${estado === "aprobado" && !esReserva && renderTemplate`<p class="script-carrito" data-limpiar-carrito="" data-astro-cid-hjcfucag></p>`}` })}`} ${estado === "rechazado" && renderTemplate`<p data-astro-cid-hjcfucag>
El pago no fue autorizado (fondos, cupo o datos del medio de pago).
          No se descontó dinero. Puedes <a href="/carrito/" data-astro-cid-hjcfucag>intentar de nuevo</a> con
          otro medio, o <a href="/ropita/" data-astro-cid-hjcfucag>volver al catálogo</a>.
</p>`} ${estado === "error" && renderTemplate`<p data-astro-cid-hjcfucag>
Ocurrió un problema al verificar con MercadoPago. <strong data-astro-cid-hjcfucag>Si viste el
          comprobante de MP, tu pago probablemente se realizó</strong> —
          escríbenos por <a${addAttribute(waLink(`Hola, pagu\xE9 con MercadoPago en la web de ${NEGOCIO.nombre} pero la verificaci\xF3n fall\xF3. \xBFMe ayudan a revisar?`), "href")} rel="noopener" data-astro-cid-hjcfucag>WhatsApp</a> y
          lo revisamos al tiro.
</p>`} ${estado === "invalido" && renderTemplate`<p data-astro-cid-hjcfucag>
Esta página muestra el resultado de un pago con MercadoPago. Si
          llegaste aquí por error, <a href="/" data-astro-cid-hjcfucag>vuelve al inicio</a>.
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
