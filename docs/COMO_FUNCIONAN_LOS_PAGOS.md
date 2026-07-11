# Cómo funcionan los pagos — rama `main`

> En esta rama el cobro es **por transferencia coordinada en WhatsApp**.
> La rama `transbank` implementa pago online con Webpay Plus (productos y
> reservas) — allá este documento crece con tu primera lección de backend.

## El flujo de la rama main (cero servidor)

1. El cliente ve una prenda y toca **"Lo quiero — coordinar por WhatsApp"**.
2. El enlace es `https://wa.me/<número>?text=<mensaje>`: WhatsApp se abre con
   el pedido ya escrito (prenda, talla, precio). El cliente solo aprieta enviar.
3. Martha responde con sus datos de transferencia, confirma el pago cuando le
   llega y coordinan la entrega.

**Por qué este es el v1 correcto:** no hay comisiones (Transbank/MercadoPago
cobran ~3% + UF fijas mensuales en algunos planes), no hay código que pueda
fallar, y el público chileno de barrio YA compra así. El pago online se
justifica cuando el volumen haga tedioso el chat, no antes.

## Los servicios de peluquería

Se pagan **en el local**, después de atender al perrito. La reserva online
solo asegura la hora. (En la rama `transbank` existe la opción de pagar la
reserva online al momento de agendar.)

## Alternativas evaluadas para el pago online (Fase 4)

| Opción | Comisión aprox. | Complejidad | Estado |
|---|---|---|---|
| Transferencia + WhatsApp | $0 | Ninguna | ✅ rama `main` |
| Transbank Webpay Plus | ~2,95% + IVA | Serverless + SDK | ✅ rama `transbank` |
| MercadoPago links de pago | ~3,4% | Cero código | 📋 en el plan (PLAN.md Fase 4 v1) |
| MercadoPago Checkout Pro | ~3,4% | Serverless + SDK | 📋 en el plan (Fase 4 v2) |

La decisión final Transbank vs MercadoPago se toma con la dueña cuando haya
ventas reales que comparar (Transbank requiere contrato con RUT de empresa;
MercadoPago es más fácil de abrir pero cobra más).
