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
