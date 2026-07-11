# PLAN — Web Peluquería Canina + Ropita de Perro

> **Objetivo de negocio:** recuperar la clientela de invierno con reservas online y abrir el canal de venta de ropa hecha por la dueña.
> **Stack decidido:** Astro 5 + islas React + CSS moderno (nesting, container queries, `oklch`) · Cal.com embebido · MercadoPago · Vercel.
> Marca `[X]` al completar. Cada fase indica el agente responsable.

---

## FASE 0 — Descubrimiento (tú + tu hermana, sin código, 1 tarde)

- [ ] Nombre del negocio, logo (si hay), colores actuales, fotos de la peluquería y de 5-10 prendas
- [ ] Lista de servicios con precio y duración (ej: baño 45 min $12.000, corte 60 min $18.000)
- [ ] Horario de atención real (días, horas, colación)
- [ ] Número de WhatsApp Business (que instale la app gratuita)
- [ ] Cuenta de MercadoPago creada por ella (con su RUT de empresa)
- [ ] Cuenta Google (para Cal.com/Calendar) — puede ser la que ya usa
- [ ] Elegir dominio y comprarlo en nic.cl → anotar: `_______________.cl`

## FASE 1 — Arquitectura y esqueleto (agente: `arquitecto`, luego `ui-frontend`)

- [X] `arquitecto`: definir estructura de carpetas, content collections (servicios, prendas), rutas y ADRs iniciales en `docs/DECISIONES.md`
- [X] `ui-frontend`: inicializar Astro 5, sistema de diseño (tokens CSS, tipografía, dark mode), layout base mobile-first
- [X] Páginas esqueleto: Home, Servicios, Reservar, Ropita (catálogo), Contacto
- [X] `documentador`: explicar en `docs/DECISIONES.md` qué es Astro, qué es una content collection y por qué se eligió cada cosa

## FASE 2 — Reservas (agente: `reservas-booking`)

- [ ] Configurar cuenta Cal.com de la hermana: un tipo de evento por servicio (duración y buffer correctos)
- [ ] Conectar Cal.com ↔ Google Calendar (las citas aparecen en su teléfono)
- [X] Incrustar el widget de Cal.com en `/reservar` con estilos a juego con la web (falta apuntar al username real)
- [ ] Probar flujo completo: cliente reserva → email de confirmación → cita visible en el celular de ella
- [X] `documentador`: guía en `docs/GUIA_AGENDA_PARA_LA_DUEÑA.md` en lenguaje no técnico (capturas pendientes para el día que se cree la cuenta)

## FASE 3 — Catálogo de ropita (agentes: `catalogo-contenido` + `ui-frontend`)

- [X] Modelo de datos de prenda (nombre, talla, precio, fotos, stock estimado, temporada)
- [ ] Cargar las prendas reales como content collection (hay 6 de EJEMPLO; reemplazar con las de la dueña)
- [X] Grilla de catálogo responsive + página de detalle por prenda
- [X] Botón "Lo quiero" → WhatsApp con mensaje pre-armado (v1 de venta)
- [X] Optimización de imágenes (formatos AVIF/WebP vía Astro; activa al subir fotos reales JPG/PNG)

## FASE 4 — Pagos (agente: `pagos-chile`) — SOLO cuando la Fase 3 esté en producción

> **Decisión 2026-07-11 (actualizada):** tres ramas para comparar modelos de cobro.
> Rama `main` = **transferencia por WhatsApp** + botón opcional con **link de pago de MercadoPago** por prenda (v1, cero servidor).
> Rama `transbank` = **Webpay Plus** para productos y reservas (probado E2E en integración).
> Rama `mercadopago` = **Checkout Pro** para productos y reservas (falta cuenta MP para probar E2E).
> La plataforma "principal" se decide con la dueña comparando comisiones y facilidad de contrato.

- [X] v0: coordinación de transferencia vía WhatsApp con mensaje pre-armado (rama `main`)
- [X] Alternativa Transbank: Webpay Plus con funciones serverless (rama `transbank`)
- [X] v1: botones con **links de pago de MercadoPago** por prenda (campo `linkMercadoPago` en el frontmatter; falta cuenta MP real para generar los links)
- [X] v2: Checkout Pro con función serverless en Vercel (rama `mercadopago`: preferencia → redirect → verificación → webhook; falta MP_ACCESS_TOKEN para E2E)
- [X] `documentador`: `docs/COMO_FUNCIONAN_LOS_PAGOS.md` — tu primera lección de backend real

## FASE 5 — Pulido y accesibilidad (agente: `accesibilidad-qa`)

- [ ] Auditoría Lighthouse ≥ 95 en móvil (performance, a11y, SEO)
- [X] Navegación por teclado, contraste, `alt` en todas las fotos de perritos (alt obligatorio en el schema)
- [ ] Prueba real en el teléfono de tu hermana (el dispositivo más importante del proyecto)

## FASE 6 — SEO local y lanzamiento (agente: `seo-local`)

- [ ] Google Business Profile de la peluquería enlazado a la web
- [X] Schema.org `LocalBusiness` + horarios, sitemap, OG images (OG placeholder; cambiar por foto real)
- [ ] Cloudflare Email Routing: `contacto@dominio.cl` → su Gmail
- [ ] Deploy en Vercel + dominio (mismo procedimiento que aprendiste con hallacas)
- [ ] Checklist final de prueba en 3 dispositivos

## FASE 7 — Full stack v2 (futuro, DESPUÉS de la Fase 6 de tienda-plantas)

> Requiere: web en producción + haber completado la Fase 6 full-stack de `tienda-plantas` (ahí se aprende la receta Turso + serverless + Resend con menos riesgo).

- [ ] **Cuentas de cliente con ficha del perrito:** DB Turso (`usuarios`, `mascotas`, `atenciones`) + auth bcrypt/JWT (receta de hallacas) — historial de cortes, observaciones ("se estresa con la secadora"), fecha de última atención
- [ ] **Stock de prendas en DB:** reemplaza el estado manual del frontmatter; al integrarse con pagos (Fase 4 v2) previene vender dos veces una prenda única
- [ ] **Alertas por correo (Vercel Cron + Resend):** materiales de costura bajo umbral y resumen semanal de atenciones
- [ ] ⚠️ Regla de producto: las cuentas de usuario NUNCA se vuelven requisito para reservar hora — Cal.com sigue siendo la puerta sin fricción; la ficha del perrito es un beneficio opcional
- [ ] Reemplazar Cal.com por módulo de reservas propio SOLO si para entonces se queda corto (evaluar honestamente: si funciona, no se toca)
- [ ] Recordatorios por WhatsApp API si la agenda lo justifica económicamente
