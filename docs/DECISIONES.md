# Decisiones de arquitectura — Peluquería Martha Mella

> Material de estudio para Anthony. Cada sección explica **qué** se decidió,
> **por qué**, y qué alternativa se descartó. Referencia rápida: PLAN.md.

## ADR-001 · Astro 5 como framework

**Qué es Astro:** un framework que genera **HTML estático en el build** (cuando
corres `npm run build`), no en el navegador del visitante. El resultado son
archivos HTML/CSS planos que Vercel sirve directo desde su CDN: carga
instantánea en el celular de la clienta con mala señal, y cero costo de
servidor.

**Islas React:** por defecto Astro no envía JavaScript al navegador. Cuando una
parte de la página sí necesita interactividad (por ejemplo el carrito de la
rama transbank), se marca como "isla" (`client:load`) y SOLO ese componente se
hidrata con React. Lo contrario de una SPA, donde TODO es JavaScript.

**Por qué no Next.js/SPA:** esta web es 95% contenido estático (servicios,
catálogo, contacto). Pagar el costo de un framework de aplicación para eso es
matar moscas a cañonazos, y el objetivo Lighthouse ≥95 en móvil se logra casi
gratis con estático.

**Nota de versión:** el scaffolder instaló Astro 7 (julio 2026); se fijó `^5`
porque el plan y el material de estudio están escritos para Astro 5, que sigue
soportado. Subir de versión mayor es una decisión consciente para más adelante,
no un accidente del instalador.

## ADR-002 · Content collections para el catálogo

**Qué es una content collection:** una carpeta de archivos Markdown
(`src/content/prendas/`) que Astro trata como una "base de datos de archivos".
Cada prenda es un `.md` con **frontmatter** (los datos entre `---`: nombre,
precio, talla…) y un cuerpo de texto libre.

**El schema con zod** (`src/content.config.ts`) valida cada archivo al
compilar: si un precio no es número o una talla no existe, el build **falla
con un error claro** en vez de publicar una página rota. Es el mismo rol que
tendría el esquema de una base de datos, pero sin base de datos.

**Por qué no una DB real:** la dueña tiene ~10 prendas y las carga Anthony.
Un archivo por prenda es editable, versionado en git (historial gratis) y no
requiere backend. La Fase 7 del plan contempla migrar a Turso cuando el stock
necesite ser transaccional (no vender dos veces la prenda única).

## ADR-003 · Datos del negocio centralizados en `src/data/`

`negocio.ts` (nombre, WhatsApp, dirección, horarios) y `servicios.ts` (matriz
servicio × tamaño con precio y duración) son la única fuente de verdad. La
tabla de precios, el hero, el footer, el Schema.org y el checkout de la rama
transbank **leen de ahí**. Cuando Anthony consiga los precios reales de
Martha, se edita UN archivo y toda la web (y el cobro) se actualiza.

Los precios actuales son **de ejemplo** (tarifas típicas de Santiago 2026) y
están marcados con `TODO(Anthony)`.

## ADR-004 · Reservas con Cal.com embebido

Cal.com gratis permite un tipo de evento por servicio con duración y buffer
propios, sincronizado con Google Calendar (las citas aparecen en el teléfono
de Martha sin que haga nada). Se incrusta con el embed oficial en `/reservar`,
con un selector de servicio que cambia el calendario mostrado.

**Pendiente de Fase 0/2:** crear la cuenta real y poner el username en
`negocio.ts` → `calcomUsuario`. Mientras tanto el widget apunta a un usuario
placeholder.

**Regla de producto (del PLAN):** reservar hora NUNCA exigirá crear cuenta.

## ADR-005 · Venta de ropita: dos ramas, dos modelos de cobro

- **Rama `main` (producción por defecto):** botón "Lo quiero" → WhatsApp con
  mensaje pre-armado → se coordina **transferencia bancaria** por chat.
  Cero código de servidor, cero comisión, y conversa con el hábito chileno de
  comprar por WhatsApp. Patrón portado de Onoto y Sazón
  (rama `feature/ux-pedidos-admin`): enlaces `wa.me/<fono>?text=...` y
  normalización de teléfonos a E.164 (`+56 9 XXXX XXXX`).
- **Rama `transbank`:** pago online con **Webpay Plus** (Transbank) para
  productos **y reservas**, con funciones serverless en Vercel. Ver
  `docs/COMO_FUNCIONAN_LOS_PAGOS.md` en esa rama.
- **MercadoPago** sigue en el plan como alternativa futura (links de pago sin
  código, Fase 4 v1 original). No se implementó aún: se decidirá con la dueña
  comparando comisiones cuando haya ventas reales.

> **Actualizado por ADR-008:** las ramas `transbank` y `mercadopago` se
> unificaron en la rama `pagos`, donde ambas pasarelas conviven tras una
> interfaz común y se elige la activa por variable de entorno.

## ADR-006 · CSS moderno sin framework

Tokens de diseño en `src/styles/tokens.css` usando `oklch()` (color perceptual:
variar solo la luminosidad genera variantes coherentes), CSS **nesting** nativo,
dark mode automático con `prefers-color-scheme`, tipografía fluida con
`clamp()` y fuentes del sistema (cero webfonts = cero bloqueo de render).

**Por qué no Tailwind:** el proyecto es también material de estudio; escribir
CSS moderno a mano enseña la plataforma. Con ~6 páginas, la mantenibilidad no
sufre.

## ADR-007 · SEO local desde el día uno

`SchemaLocalBusiness.astro` emite JSON-LD con dirección y horarios (habilita el
panel de negocio en Google), `@astrojs/sitemap` genera el sitemap, cada página
define título/descripción/OG propios y `robots.txt` apunta al sitemap. El
dominio real reemplazará `marthamella.cl` en `astro.config.mjs` y `negocio.ts`
(Fase 6).

## ADR-008 · Dos pasarelas de pago conviviendo tras una interfaz común

**Contexto:** existían dos ramas gemelas (`transbank` con Webpay Plus,
`mercadopago` con Checkout Pro) que implementan el MISMO negocio (carrito +
reserva con precio "desde") con distinta pasarela. Anthony pidió unirlas en
una sola base, sin descartar ninguna.

**Decisión:**
1. La base es `transbank`: funciona en integración SIN que Anthony cree
   ninguna cuenta (Transbank publica credenciales de prueba). MercadoPago
   exige un token propio; si fuera la base, el sitio quedaría roto hasta que
   Anthony configure la cuenta. Webpay es la pasarela por defecto.
2. La diferencia de pasarela se esconde detrás de una interfaz `PasarelaPago`
   (`src/lib/pasarela.ts`), con una implementación por pasarela en
   `src/lib/pasarelas/webpay.ts` y `src/lib/pasarelas/mercadopago.ts`.
3. La pasarela activa se elige con la variable de entorno
   `PASARELA_PAGO=webpay|mercadopago` (por defecto `webpay`). No se le muestra
   al cliente un selector: el negocio usa UNA pasarela a la vez, y elegirla
   tiene implicancias de comisión/UX que decide Martha, no el cliente.
4. `src/pages/pago/retorno.astro` es UNA sola página que le pregunta a la
   pasarela activa "¿cómo quedó este pago?" y pinta un resultado normalizado
   (6 estados: aprobado, pendiente, rechazado, anulado, invalido, error). No
   se duplican los estados de UI entre pasarelas.
5. `src/pages/api/pago/webhook.ts` (solo lo usa MercadoPago) responde 200 sin
   tocar el SDK si la pasarela activa no es MercadoPago, para no romper si
   llega una notificación perdida.

**Por qué así:** costo fijo $0 (ambos SDK son gratis, solo se paga comisión
por venta), Anthony cambia de pasarela tocando una variable en Vercel sin
tocar código, y el día que Martha decida cuál usar, no hay que reescribir
nada. Detalle técnico completo en `docs/COMO_FUNCIONAN_LOS_PAGOS.md`.
