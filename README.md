# Huella Verde 🐾🌿

Sitio de Martha Mella con dos negocios diferenciados bajo una misma marca:

- **Peluquería canina:** servicios, precios y reserva de hora (Cal.com), con
  opción de dejar la hora pagada online.
- **Tienda de plantas y accesorios:** maceteros, sustratos, fertilizantes y
  artículos de cuidado, con carrito y pago online.

Astro 5 + islas React + CSS moderno, desplegado en Vercel (funciones
serverless para los pagos). Aún **sin publicar**: ver `PLAN.md` (local).

## Pagos

Una sola rama, `main`. Medios de pago:

- **Tarjeta:** Webpay Plus (por defecto) o MercadoPago Checkout Pro, detrás
  de una interfaz común (`src/lib/pasarela.ts`). Se elige con `PASARELA_PAGO`.
- **Transferencia bancaria directa:** referencia única `HV-PR-…`, comprobante
  por WhatsApp. Solo se ofrece cuando `src/data/negocio.ts` tiene datos
  bancarios reales.
- **Interruptor `PAGOS_ONLINE=on|off`:** en `off` no se cobra con tarjeta y el
  sitio ofrece WhatsApp.

Las páginas preguntan a `GET /api/pago/estado` qué medios están disponibles.
Cada cambio de variables en Vercel requiere **Redeploy**, y las credenciales
van **solo en el entorno Production**.

## Comandos

- `npm install` — instalar dependencias
- `npm run dev` — servidor de desarrollo en `localhost:4321`
- `npm run build` — build de producción
- `npm run preview` — previsualizar el build

## Dónde se edita cada cosa

- **Nombre, WhatsApp, dirección, horarios, datos bancarios:** `src/data/negocio.ts`
- **Servicios de peluquería, precios, duraciones:** `src/data/servicios.ts`
- **Políticas (entrega, retracto, devoluciones, reservas):** `src/data/terminos.ts`
- **Plantas:** `src/content/plantas/*.md` (un producto = un archivo)
- **Accesorios:** `src/content/accesorios/*.md`
- **Ilustraciones de productos:** `src/components/ilustraciones/` (catálogo en `/dev/ilustraciones`)
- **Colores y tipografía:** `src/styles/tokens.css`
- **Variables de entorno:** ver `.env.example` (pasarela, credenciales, avisos por correo)

Los datos de ejemplo están marcados con `TODO(Anthony)` hasta que Martha
entregue los reales. `/ropita` sigue en el código pero fuera del menú y de
los buscadores.

## Documentación

Los documentos de planificación y estudio **no se versionan**: viven solo en
el computador local (`PLAN.md` y `docs/` están en `.gitignore`).

- `PLAN.md` — plan por fases hasta el lanzamiento
- `docs/DECISIONES.md` — decisiones de arquitectura (ADR) explicadas
- `docs/COMO_FUNCIONAN_LOS_PAGOS.md` — flujo de pago, pasarelas y transferencia
- `docs/GUIA-CALCOM.md` — configuración de la agenda
- `docs/MANUAL-IMPLEMENTACION.md` — pasos para publicar
- `docs/REQUISITOS-PAGOS-MARTHA.md` — lo que Martha debe entregar para cobrar online
