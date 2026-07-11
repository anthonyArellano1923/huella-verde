import { g as getCollection } from '../../../chunks/_astro_content_BRrO2nHT.mjs';
import { g as getServicio, a as getTamano } from '../../../chunks/servicios_BFc6C4LZ.mjs';
import { g as generarBuyOrder, w as webpayTransaction } from '../../../chunks/transbank_7U-WXAui.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const json = (cuerpo, status = 200) => new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });
const POST = async ({ request, url }) => {
  let cuerpo;
  try {
    cuerpo = await request.json();
  } catch {
    return json({ error: "El cuerpo debe ser JSON." }, 400);
  }
  let monto = 0;
  let tipo;
  if (cuerpo.tipo === "productos") {
    tipo = "productos";
    const items = Array.isArray(cuerpo.items) ? cuerpo.items : [];
    if (items.length === 0) return json({ error: "El carrito está vacío." }, 400);
    const prendas = await getCollection("prendas");
    for (const item of items) {
      const prenda = prendas.find((p) => p.id === item.slug);
      if (!prenda) return json({ error: `Producto desconocido: ${item.slug}` }, 400);
      const qty = Number(item.qty);
      if (!Number.isInteger(qty) || qty < 1 || qty > 10) {
        return json({ error: `Cantidad inválida para ${prenda.data.nombre}.` }, 400);
      }
      if (qty > prenda.data.stock) {
        return json({ error: `Solo quedan ${prenda.data.stock} de "${prenda.data.nombre}".` }, 409);
      }
      monto += prenda.data.precio * qty;
    }
  } else if (cuerpo.tipo === "reserva") {
    tipo = "reserva";
    const servicio = getServicio(String(cuerpo.servicioId));
    const tamano = getTamano(String(cuerpo.tamanoId));
    if (!servicio || !tamano) return json({ error: "Servicio o tamaño desconocido." }, 400);
    monto = servicio.porTamano[tamano.id].precio;
  } else {
    return json({ error: 'tipo debe ser "productos" o "reserva".' }, 400);
  }
  const buyOrder = generarBuyOrder(tipo);
  const sessionId = buyOrder;
  const returnUrl = new URL("/pago/retorno", url.origin).href;
  try {
    const tx = webpayTransaction();
    const respuesta = await tx.create(buyOrder, sessionId, monto, returnUrl);
    return json({ url: respuesta.url, token: respuesta.token });
  } catch (err) {
    console.error("Error creando transacción Webpay:", err);
    return json({ error: "No pudimos conectar con Webpay. Intenta de nuevo en un momento." }, 502);
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
