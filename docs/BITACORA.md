# Bitácora técnica — Peluquería Canina

> Registro crudo de trabajo de los agentes. Cada agente anota aquí al terminar una tarea: fecha, agente, qué hizo, archivos tocados. El agente `documentador` convierte esto en `DECISIONES.md` al cierre de cada fase. No borrar entradas.

---

## 2026-07-11 · Claude (sesión de implementación completa, Fases 1-6)

**Fase 1 — Arquitectura y esqueleto.** Astro fijado en `^5` (el scaffolder
trajo v7; ver ADR-001), integraciones `@astrojs/react` y `@astrojs/sitemap`,
nanostores instalado para el carrito de la rama transbank. Estructura:
`src/data/` (negocio.ts, servicios.ts — única fuente de verdad),
`src/content/prendas/` (content collection con schema zod),
`src/styles/` (tokens oklch + global, dark mode, mobile-first),
`src/utils/` (money, phone, whatsapp — patrón wa.me portado de Onoto y Sazón
`feature/ux-pedidos-admin`). Layout Base con OG/canonical/JSON-LD. Páginas:
Home, Servicios, Reservar, Ropita (grilla + detalle), Contacto, 404.

**Fase 2 — Reservas.** `/reservar` con selector servicio/tamaño (píldoras
accesibles `:has(input:checked)`) + embed vanilla oficial de Cal.com con un
namespace por tipo de evento. Referencia de precio con `aria-live`. Pendiente
de cuenta real (TODO en `negocio.ts::calcomUsuario`). Guía no técnica en
`docs/GUIA_AGENDA_PARA_LA_DUEÑA.md`.

**Fase 3 — Catálogo.** Schema de prenda (nombre, talla enum, precio CLP,
foto `image()` optimizada por astro:assets, alt obligatorio, stock, temporada,
destacada). 6 prendas de EJEMPLO con SVG placeholder en `src/assets/prendas/`.
Botón "Lo quiero" → WhatsApp pre-armado. Estado agotada (stock 0) con CTA de
tejido a pedido.

**Fase 4 — Pagos.** Decisión del dueño del proyecto: rama `main` =
transferencia coordinada por WhatsApp; rama `transbank` = Webpay Plus para
productos Y reservas; MercadoPago queda en el plan como alternativa futura.
Detalle en `docs/COMO_FUNCIONAN_LOS_PAGOS.md` (crece en la rama transbank).

**Fase 5 — A11y/pulido.** Skip-link, focus-visible global, tabla de precios
con caption/scope y scroll propio, radios accesibles, `prefers-reduced-motion`,
fuentes del sistema, lazy loading en grilla / eager en detalle.

**Fase 6 — SEO.** JSON-LD LocalBusiness, sitemap, robots.txt, OG image
placeholder, canónicas. Pendiente real: dominio, Google Business, Cloudflare
Email (requieren cuentas).

Verificado: `npm run build` limpio (12 páginas) + revisión visual en navegador.

## 2026-07-11 · Claude (rama transbank: Webpay Plus)

Pago online para productos y reservas sobre la base de `main`:

- **Deps:** `transbank-sdk@6` (CommonJS: se importa el default y se
  desestructura — los named imports revientan en el server de Vite),
  `@astrojs/vercel@8` (la v11 exige Astro 7), `@nanostores/persistent`.
- **`src/lib/transbank.ts`:** Options por ambiente — integración usa las
  credenciales públicas del SDK; producción exige `TBK_COMMERCE_CODE`,
  `TBK_API_KEY`, `TBK_ENV=produccion` en Vercel. `generarBuyOrder` con
  prefijo PR/RS (≤26 chars).
- **Carrito:** `persistentAtom` en localStorage; islas `CarritoBadge`
  (header), `BotonAgregarCarrito` (detalle prenda), `CarritoLista`
  (/carrito). Solo viajan slug+qty; el precio lo recalcula el servidor.
- **`/api/pago/crear`** (`prerender=false`): valida items contra la content
  collection (stock, qty 1-10) o servicio×tamaño, crea la transacción y
  devuelve `{url, token}`.
- **`/pago/retorno`** (`prerender=false`): commit del token_ws, voucher con
  orden/monto/tarjeta/autorización, manejo de rechazo, anulación (TBK_TOKEN),
  error de commit y acceso directo. Si fue compra de productos, limpia el
  carrito; si fue reserva, CTA a agendar con la orden en las notas.
- **`/reservar`:** sección opcional "dejar la hora pagada" con Webpay.
- **Gotcha de dev:** tras instalar deps con `astro dev` corriendo, el
  prebundle de Vite quedó con DOS grafos de React (hashes `?v=` mezclados) →
  "Invalid hook call" en todas las islas. Fix: parar el server, borrar
  `node_modules/.vite`, arrancar de nuevo. Se dejó `dedupe` explícito en
  astro.config por si acaso.
- **Probado E2E en integración:** compra completa aprobada (voucher real del
  simulador) + validaciones de API (reserva OK, stock excedido 409, slug
  desconocido 400).
