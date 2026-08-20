# Peluquería Martha Mella 🐩

Web de peluquería canina con reservas online (Cal.com) y catálogo de ropita
tejida a mano. Astro 5 + islas React + CSS moderno, preparada para desplegar
en Vercel (aún **sin publicar**: ver el estado del proyecto en `docs/`).

## Ramas

- **`main`** — producción. Venta de ropita coordinando **transferencia por
  WhatsApp** (cero servidor, cero comisión) + botón opcional de **link de
  pago MercadoPago** por prenda (`linkMercadoPago` en el frontmatter).
  Servicios se pagan en el local.
- **`transbank`** — pago online con **Webpay Plus** para productos y reservas
  (serverless en Vercel; probado E2E en el ambiente de integración).
- **`mercadopago`** — pago online con **Checkout Pro** para productos y
  reservas (serverless en Vercel; requiere `MP_ACCESS_TOKEN`, ver
  `.env.example` de esa rama).

## Comandos

| Comando | Acción |
|---|---|
| `npm install` | Instalar dependencias |
| `npm run dev` | Servidor de desarrollo en `localhost:4321` |
| `npm run build` | Build de producción en `./dist/` |
| `npm run preview` | Previsualizar el build |

## Dónde se edita cada cosa

| Quiero cambiar… | Archivo |
|---|---|
| Nombre, WhatsApp, dirección, horarios | `src/data/negocio.ts` |
| Servicios, precios, duraciones | `src/data/servicios.ts` |
| Prendas del catálogo | `src/content/prendas/*.md` (una prenda = un archivo) |
| Fotos de prendas | `src/assets/prendas/` |
| Colores y tipografía | `src/styles/tokens.css` |

Los datos actuales son **placeholders marcados con `TODO(Anthony)`**
(la Fase 0 del PLAN.md sigue pendiente: precios reales, fotos, número de
WhatsApp, cuenta Cal.com y dominio).

## Documentación

Los documentos de planificación, decisión y análisis **no se versionan**:
viven solo en el computador local (`PLAN.md` y `docs/` están en `.gitignore`).

| Archivo (local) | Qué contiene |
|---|---|
| `PLAN.md` | Plan maestro por fases |
| `docs/ESTADO-DEL-PROYECTO.md` | Análisis íntegro del estado, hallazgos y pendientes |
| `docs/DECISIONES.md` | Decisiones de arquitectura (ADRs) explicadas |
| `docs/GUIA_AGENDA_PARA_LA_DUEÑA.md` | Guía no técnica de la agenda para Martha |
| `docs/COMO_FUNCIONAN_LOS_PAGOS.md` | Modelo de cobro y flujo de pasarelas |
| `docs/BITACORA.md` | Registro crudo de trabajo |
