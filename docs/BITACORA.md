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
## 2026-07-11 · Claude (Fase 0 real: marca Huella Verde + datos de Martha)

Datos obtenidos de la llamada con Martha (2 audios transcritos localmente con
Whisper/mlx en el Mac de Anthony) + mensaje de Anthony:

- **Marca:** Huella Verde (compartida con el negocio de plantas de Martha,
  que es un negocio SEPARADO — solo comparten marca y local; esta web cubre
  solo mascotas). Dueña: Martha Mella. Dirección: Curicó 243 (comuna por
  confirmar). WhatsApp +56 9 5441 7939. Correo Gmail registrado en negocio.ts.
- **Horario real:** L-V 10:30–19:30 corrido sin colación; sábado estimado
  10:30–16:00; domingo cerrado.
- **Servicios:** todos los completos duran 1,5–2 h independiente del tamaño →
  `DURACION_SERVICIO_MIN = 120` y bloques de 2 h en Cal.com. Nuevos servicios
  express (~5 min, sin reserva, precio en el local): orejas, glándulas, uñas.
  El modelo `porTamano {precio, duracion}` se simplificó a `precioPorTamano`.
- **Políticas de reserva:** 24 h de anticipación mínima; última hora 17:30;
  "horario especial" conversable por WhatsApp; sin límite hacia adelante.
  Datos del formulario: nombre, teléfono, nombre mascota, raza, tamaño, foto.
- **PENDIENTE:** precios reales (no se definieron en la llamada — los de la
  web siguen siendo ejemplo) y política de cancelación.
- **Rebranding:** paleta verde hoja (H≈155) sobre blancos frescos con tinte
  menta + acento floral rosado. Feedback de Anthony: nada de beige/crema.
  Favicon y OG actualizados a Huella Verde.

## 2026-07-11 · Claude (rama mercadopago: Checkout Pro)

Tercera rama de pagos (desde transbank, reemplaza el proveedor):
`mercadopago@3` SDK, `src/lib/mercadopago.ts` (Preference/Payment,
MP_ACCESS_TOKEN requerido), `/api/pago/crear` crea preferencia con ítems y
back_urls, `/pago/retorno` verifica el payment_id contra la API (estados
approved/pending/rejected), `/api/pago/webhook` para notificaciones
servidor-a-servidor (v1: verifica y loggea; Fase 7: escribirá en DB).
transbank-sdk desinstalado en esta rama. Sin credenciales el endpoint
degrada a 503 con mensaje claro (probado). E2E pendiente de cuenta MP.

## 2026-07-11 · Claude (Fase 5 verificada: Lighthouse 100 y fixes de QA)

Auditoría Lighthouse móvil sobre el build de producción, las 6 páginas:
**100/100/100 (perf/a11y/SEO)** tras corregir 3 hallazgos reales:
1. Overflow horizontal en móvil: el `<nav>` como ítem flex no podía
   encogerse (`min-width:auto`) y empujaba el body a 459px; fix
   `min-inline-size: 0` para que el scroll quede dentro de la lista.
2. Contraste AA: chip de talla (rosado 3.36:1 → token `--color-acento-fuerte`)
   y botón WhatsApp (verde oficial 2.92:1 → `--color-whatsapp` oscurecido).
3. Orden de encabezados: h3 sin h2 previo en tarjetas de prenda y sección
   express → ahora h2.
Dark mode verificado visualmente en móvil. MercadoPago agregado: links v1
en main + rama `mercadopago` (Checkout Pro) — ver entrada anterior.
