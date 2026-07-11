import { d as createAstro, c as createComponent, m as maybeRenderHead, b as addAttribute, a as renderTemplate, r as renderComponent, u as unescapeHTML, j as renderHead, k as renderSlot } from './astro/server_ChiqBPSF.mjs';
import 'piccolore';
/* empty css                           */
import { jsxs, jsx } from 'react/jsx-runtime';
import { useStore } from '@nanostores/react';
import { persistentAtom } from '@nanostores/persistent';
import 'clsx';

const NEGOCIO = {
  nombre: "Martha Mella",
  slogan: "Peluquería canina con cariño",
  descripcion: "Peluquería canina en Santiago: baño, corte y stripping para tu perrito, con reserva de hora online. Además, ropita tejida a mano para el invierno.",
  // TODO(Anthony): número real de WhatsApp Business (9 dígitos, sin +56).
  whatsapp: "912345678",
  // TODO(Anthony): dirección real del local.
  direccion: {
    calle: "Av. Ejemplo 1234",
    comuna: "Ñuñoa",
    ciudad: "Santiago",
    region: "Región Metropolitana"
  },
  // TODO(Anthony): horario real (esto alimenta la página de contacto y el
  // Schema.org de Google; el horario de la agenda vive en Cal.com aparte).
  horarios: [
    { dias: "Martes a Viernes", horas: "10:00 – 18:30" },
    { dias: "Sábado", horas: "10:00 – 14:00" },
    { dias: "Domingo y Lunes", horas: "Cerrado" }
  ],
  /** Horario en formato Schema.org (https://schema.org/openingHours). */
  horariosSchema: ["Tu-Fr 10:00-18:30", "Sa 10:00-14:00"],
  // TODO(Anthony): correo real cuando exista (Fase 6: Cloudflare Email Routing).
  email: "contacto@marthamella.cl",
  // TODO(Anthony): dominio real comprado en nic.cl (Fase 0/6).
  url: "https://www.marthamella.cl",
  /**
   * Usuario de Cal.com de la dueña. TODO(Anthony): crear la cuenta en la
   * Fase 2 y poner aquí el username real (cal.com/<username>).
   */
  calcomUsuario: "martha-mella"
};
const WHATSAPP_WA = `56${NEGOCIO.whatsapp}`;

const $carrito = persistentAtom("mm-carrito", [], {
  encode: JSON.stringify,
  decode: (raw) => {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
});
function agregarAlCarrito(item) {
  const items = $carrito.get();
  const existente = items.find((i) => i.slug === item.slug);
  if (existente) {
    $carrito.set(items.map((i) => i.slug === item.slug ? { ...i, qty: Math.min(i.qty + 1, 10) } : i));
  } else {
    $carrito.set([...items, { ...item, qty: 1 }]);
  }
}
function cambiarCantidad(slug, qty) {
  const items = $carrito.get();
  if (qty <= 0) {
    $carrito.set(items.filter((i) => i.slug !== slug));
  } else {
    $carrito.set(items.map((i) => i.slug === slug ? { ...i, qty: Math.min(qty, 10) } : i));
  }
}
function totalReferencia(items) {
  return items.reduce((suma, i) => suma + i.precio * i.qty, 0);
}

function CarritoBadge() {
  const items = useStore($carrito);
  const cantidad = items.reduce((suma, i) => suma + i.qty, 0);
  return /* @__PURE__ */ jsxs("a", { className: "carrito-badge", href: "/carrito/", "aria-label": `Carrito, ${cantidad} productos`, children: [
    "🛒",
    cantidad > 0 && /* @__PURE__ */ jsx("span", { className: "carrito-badge__numero", children: cantidad })
  ] });
}

const $$Astro$1 = createAstro("https://www.marthamella.cl");
const $$Header = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Header;
  const enlaces = [
    { href: "/", texto: "Inicio" },
    { href: "/servicios/", texto: "Servicios" },
    { href: "/reservar/", texto: "Reservar" },
    { href: "/ropita/", texto: "Ropita" },
    { href: "/contacto/", texto: "Contacto" }
  ];
  const rutaActual = Astro2.url.pathname;
  const esActual = (href) => href === "/" ? rutaActual === "/" : rutaActual.startsWith(href);
  return renderTemplate`${maybeRenderHead()}<header data-astro-cid-3ef6ksr2> <div class="contenedor barra" data-astro-cid-3ef6ksr2> <a class="marca" href="/" data-astro-cid-3ef6ksr2> <span class="marca__huella" aria-hidden="true" data-astro-cid-3ef6ksr2>🐾</span> <span class="marca__nombre" data-astro-cid-3ef6ksr2>${NEGOCIO.nombre}</span> </a> <nav aria-label="Navegación principal" data-astro-cid-3ef6ksr2> <ul data-astro-cid-3ef6ksr2> ${enlaces.map(({ href, texto }) => renderTemplate`<li data-astro-cid-3ef6ksr2> <a${addAttribute(href, "href")}${addAttribute(esActual(href) ? "page" : void 0, "aria-current")} data-astro-cid-3ef6ksr2> ${texto} </a> </li>`)} </ul> </nav> ${renderComponent($$result, "CarritoBadge", CarritoBadge, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/anthonyarellano/Dev/peluqueria-canina/src/components/react/CarritoBadge", "client:component-export": "default", "data-astro-cid-3ef6ksr2": true })} </div> </header>  `;
}, "/Users/anthonyarellano/Dev/peluqueria-canina/src/components/Header.astro", void 0);

function formatCLP(value) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(value);
}

function waLink(mensaje) {
  return `https://wa.me/${WHATSAPP_WA}?text=${encodeURIComponent(mensaje)}`;
}
function waLinkPrenda(nombre, talla, precio) {
  const lineas = [
    `¡Hola! Vi la ropita en la web de ${NEGOCIO.nombre} y me encantó:`,
    "",
    `• ${nombre} (talla ${talla}) — ${formatCLP(precio)}`,
    "",
    "¿Está disponible? Me gustaría coordinar el pago por transferencia y la entrega."
  ];
  return waLink(lineas.join("\n"));
}
function waLinkConsulta() {
  return waLink(`¡Hola! Vengo de la web de ${NEGOCIO.nombre} y tengo una consulta.`);
}
function waLinkReserva() {
  return waLink(`¡Hola! Quiero reservar una hora en ${NEGOCIO.nombre}. ¿Qué disponibilidad tienes?`);
}

const $$Footer = createComponent(($$result, $$props, $$slots) => {
  const anio = (/* @__PURE__ */ new Date()).getFullYear();
  return renderTemplate`${maybeRenderHead()}<footer data-astro-cid-sz7xmlte> <div class="contenedor columnas" data-astro-cid-sz7xmlte> <section data-astro-cid-sz7xmlte> <h2 data-astro-cid-sz7xmlte>${NEGOCIO.nombre}</h2> <p data-astro-cid-sz7xmlte>${NEGOCIO.slogan}</p> <p data-astro-cid-sz7xmlte> ${NEGOCIO.direccion.calle}, ${NEGOCIO.direccion.comuna}<br data-astro-cid-sz7xmlte> ${NEGOCIO.direccion.ciudad} </p> </section> <section data-astro-cid-sz7xmlte> <h2 data-astro-cid-sz7xmlte>Horarios</h2> <ul data-astro-cid-sz7xmlte> ${NEGOCIO.horarios.map((h) => renderTemplate`<li data-astro-cid-sz7xmlte> <strong data-astro-cid-sz7xmlte>${h.dias}:</strong> ${h.horas} </li>`)} </ul> </section> <section data-astro-cid-sz7xmlte> <h2 data-astro-cid-sz7xmlte>Contacto</h2> <ul data-astro-cid-sz7xmlte> <li data-astro-cid-sz7xmlte> <a${addAttribute(waLinkConsulta(), "href")} rel="noopener" data-astro-cid-sz7xmlte>WhatsApp</a> </li> <li data-astro-cid-sz7xmlte> <a${addAttribute(`mailto:${NEGOCIO.email}`, "href")} data-astro-cid-sz7xmlte>${NEGOCIO.email}</a> </li> </ul> </section> </div> <p class="contenedor legal" data-astro-cid-sz7xmlte>© ${anio} ${NEGOCIO.nombre} · Hecho con cariño en Chile 🇨🇱</p> </footer> `;
}, "/Users/anthonyarellano/Dev/peluqueria-canina/src/components/Footer.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$SchemaLocalBusiness = createComponent(($$result, $$props, $$slots) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": NEGOCIO.url,
    name: NEGOCIO.nombre,
    description: NEGOCIO.descripcion,
    url: NEGOCIO.url,
    telephone: `+${WHATSAPP_WA}`,
    email: NEGOCIO.email,
    image: new URL("/og-image.svg", NEGOCIO.url).href,
    address: {
      "@type": "PostalAddress",
      streetAddress: NEGOCIO.direccion.calle,
      addressLocality: NEGOCIO.direccion.comuna,
      addressRegion: NEGOCIO.direccion.region,
      addressCountry: "CL"
    },
    openingHours: NEGOCIO.horariosSchema,
    priceRange: "$$"
  };
  return renderTemplate(_a || (_a = __template(['<script type="application/ld+json">', "<\/script>"])), unescapeHTML(JSON.stringify(schema)));
}, "/Users/anthonyarellano/Dev/peluqueria-canina/src/components/SchemaLocalBusiness.astro", void 0);

const $$Astro = createAstro("https://www.marthamella.cl");
const $$Base = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Base;
  const { titulo, descripcion = NEGOCIO.descripcion } = Astro2.props;
  const tituloCompleto = `${titulo} \xB7 ${NEGOCIO.nombre}`;
  const canonical = new URL(Astro2.url.pathname, NEGOCIO.url);
  return renderTemplate`<html lang="es-CL" data-astro-cid-5hce7sga> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${tituloCompleto}</title><meta name="description"${addAttribute(descripcion, "content")}><link rel="canonical"${addAttribute(canonical, "href")}><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="sitemap" href="/sitemap-index.xml"><meta name="generator"${addAttribute(Astro2.generator, "content")}><!-- Open Graph: cómo se ve el enlace al compartirlo por WhatsApp/Instagram --><meta property="og:type" content="website"><meta property="og:title"${addAttribute(tituloCompleto, "content")}><meta property="og:description"${addAttribute(descripcion, "content")}><meta property="og:url"${addAttribute(canonical, "content")}><meta property="og:image"${addAttribute(new URL("/og-image.svg", NEGOCIO.url), "content")}><meta property="og:locale" content="es_CL">${renderComponent($$result, "SchemaLocalBusiness", $$SchemaLocalBusiness, { "data-astro-cid-5hce7sga": true })}${renderHead()}</head> <body data-astro-cid-5hce7sga> <a class="saltar-contenido" href="#contenido" data-astro-cid-5hce7sga>Saltar al contenido</a> ${renderComponent($$result, "Header", $$Header, { "data-astro-cid-5hce7sga": true })} <main id="contenido" data-astro-cid-5hce7sga> ${renderSlot($$result, $$slots["default"])} </main> ${renderComponent($$result, "Footer", $$Footer, { "data-astro-cid-5hce7sga": true })} </body></html>`;
}, "/Users/anthonyarellano/Dev/peluqueria-canina/src/layouts/Base.astro", void 0);

export { $$Base as $, NEGOCIO as N, $carrito as a, waLink as b, cambiarCantidad as c, waLinkReserva as d, agregarAlCarrito as e, formatCLP as f, waLinkPrenda as g, totalReferencia as t, waLinkConsulta as w };
