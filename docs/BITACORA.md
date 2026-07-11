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
