# Cómo funcionan los pagos — rama `pagos`

> Tu primera lección de backend real. Esta rama implementa pago online de
> productos Y reservas con **dos pasarelas intercambiables**: Webpay Plus
> (Transbank) y MercadoPago Checkout Pro. La rama `main` usa transferencia
> coordinada por WhatsApp (cero servidor). Ver `docs/DECISIONES.md` (ADR-008)
> para el porqué de la unificación.

## La idea general en 30 segundos

Un pago online son **3 viajes**, sea cual sea la pasarela:

```
1. TU SERVIDOR  → pasarela  : "quiero cobrar $15.990" → me dan una URL de pago
2. EL CLIENTE   → pasarela  : paga en el formulario de la pasarela (nunca en tu web)
3. pasarela     → TU SERVIDOR: vuelve → confirmas/verificas y sabes si pagó
```

Los números de tarjeta **jamás pasan por tu código**: eso es lo que hace
"seguro" el modelo. Tu servidor solo habla de montos y referencias.

## Cómo se elige la pasarela

Una sola variable de entorno, `PASARELA_PAGO`, definida en Vercel (o en
`.env` local):

```bash
PASARELA_PAGO=webpay        # por defecto — no requiere ninguna cuenta
PASARELA_PAGO=mercadopago   # requiere MP_ACCESS_TOKEN
```

Todo el código de negocio (endpoint de pago, página de retorno, UI del
carrito y de la reserva) habla con la interfaz `PasarelaPago`
(`src/lib/pasarela.ts`) y **no sabe cuál de las dos corre**. Cambiar de
pasarela es cambiar esa única variable — cero despliegue de código nuevo.

## El flujo, archivo por archivo

### 1. El cliente arma el pedido (navegador)

- `src/stores/carrito.ts` — el carrito vive en **nanostores** con
  `persistentAtom`: un mini-estado global compartido entre islas React que se
  guarda en localStorage (sobrevive recargas). Solo guarda *slug + cantidad*.
- `src/components/react/CarritoLista.tsx` — al apretar "Pagar", hace
  `fetch('/api/pago/crear', { items: [{slug, qty}] })`. **Nunca manda el
  precio**: eso lo decide el servidor. Al responder, redirige directo a
  `datos.url` — sin importar qué pasarela armó esa URL.
- En `/reservar`, el botón "Pagar esta reserva" manda `{servicioId, tamanoId}`.

### 2. El servidor crea el pago — `src/pages/api/pago/crear.ts`

Esta es tu **función serverless** central: un archivo en `src/pages/api/` con
`export const prerender = false` deja de ser HTML estático y se convierte en
código que corre en Vercel **cada vez que alguien lo llama**.

Pasos que hace, agnóstico de pasarela:
1. Lee el JSON del navegador.
2. **Recalcula el total** leyendo los precios reales (content collection para
   prendas, `servicios.ts` para reservas). Regla de oro del backend:
   *nunca confíes en lo que manda el navegador* — un cliente malicioso puede
   editar su JavaScript, pero no puede editar el tuyo.
3. Valida stock y cantidades (¿pediste 5 y quedan 1? → error 409).
4. Genera una referencia única con `generarReferencia()` (prefijo `PR`
   productos / `RS` reserva, cortada a 26 caracteres — límite de Transbank
   que también le sirve a MercadoPago).
5. Llama a `getPasarela().crearPago({ tipo, monto, items, referencia, … })` —
   la fábrica de `src/lib/pasarela.ts` decide, según `PASARELA_PAGO`, si eso
   ejecuta la implementación Webpay o la de MercadoPago.
6. Responde **siempre** `{ url }` al navegador — nunca un token suelto.

### 3. Cada pasarela implementa `crearPago` y `verificarRetorno`

- **`src/lib/pasarelas/webpay.ts`** — `crearPago` llama a
  `tx.create(referencia, referencia, monto, returnUrl)` del SDK oficial
  (`src/lib/transbank.ts`) y arma `${url}?token_ws=${token}` como
  `urlRedireccion` (el token queda escondido aquí; el front nunca lo ve).
- **`src/lib/pasarelas/mercadopago.ts`** — `crearPago` crea una "preferencia"
  con los ítems y `back_urls`, y devuelve el `init_point` de MP tal cual.

### 4. La pasarela devuelve al cliente — `src/pages/pago/retorno.astro`

Una sola página, sin importar cuál pasarela corrió. También corre en el
servidor (`prerender = false`) porque debe **verificar el pago de verdad**
contra la pasarela — nunca confiar en los query params que trae el navegador
del cliente, que podrían falsificarse.

- Llama a `getPasarela().verificarRetorno(request, url)`.
- **Webpay** (`webpay.ts`): si vuelve `token_ws`, hace
  `tx.commit(token_ws)` **desde el servidor, dentro de los ~5 minutos**. Sin
  commit, la transacción se reversa sola. `response_code === 0 && status ===
  'AUTHORIZED'` → `aprobado`. Si vuelve `TBK_TOKEN` en vez de `token_ws` → el
  cliente `anulado` en Webpay. Nunca produce el estado `pendiente`.
- **MercadoPago** (`mercadopago.ts`): con el `payment_id` que trae la URL,
  consulta `mpPayment().get({ id })` — la única fuente de verdad. `approved` →
  `aprobado`; `in_process`/`pending` (ej. pago en efectivo) → `pendiente`;
  cualquier otro → `rechazado`. Nunca produce el estado `anulado`.
- La página pinta 6 estados posibles (`aprobado`, `pendiente`, `rechazado`,
  `anulado`, `invalido`, `error`); cada pasarela solo dispara los suyos.
- El prefijo de la referencia distingue el tipo: `MM-PR-…` = productos,
  `MM-RS-…` = reserva (a la reserva se le pide escribir la referencia en las
  notas de Cal.com para que Martha asocie pago ↔ hora).

### 5. Webhook de MercadoPago — `src/pages/api/pago/webhook.ts`

Solo MercadoPago llama a esta URL servidor-a-servidor cada vez que un pago
cambia de estado, independiente de si el cliente volvió a la web. Es el
mecanismo CONFIABLE; el retorno del navegador es cortesía visual. Webpay
Plus no tiene equivalente (todo pasa por el `commit()` síncrono), así que
esta ruta responde 200 sin hacer nada si `PASARELA_PAGO` no es
`mercadopago` — evita que una notificación perdida truene por falta de
token.

## Credenciales y ambientes

| | Webpay (integración, por defecto) | MercadoPago |
|---|---|---|
| Requiere cuenta propia | No — SDK trae credenciales públicas de prueba | Sí, siempre — hasta para probar |
| Tarjeta/credencial de prueba | VISA `4051 8856 0044 6623`, CVV `123`, fecha futura | Token `TEST-…` desde developers.mercadopago.com |
| Variables de entorno | `TBK_COMMERCE_CODE`, `TBK_API_KEY`, `TBK_ENV=produccion` (solo para producción) | `MP_ACCESS_TOKEN` (obligatoria si `PASARELA_PAGO=mercadopago`) |
| ¿Se cobra en integración? | No, todo es de mentira | No, con token `TEST-…` |

Ver `.env.example` para el detalle de cada variable.

## Limitación conocida (y honesta) de esta v1

No hay base de datos: el pago aprobado existe en el voucher del cliente y en
el panel de la pasarela, pero la web no guarda registro propio, no descuenta
stock automáticamente, y la asociación pago↔reserva depende de que el cliente
escriba la referencia en las notas. Es el trade-off correcto para validar si
el pago online se usa siquiera. La **Fase 7** (Turso + webhooks) cierra ese
círculo: registrar cada transacción, descontar stock y asociar reservas sin
copiar códigos a mano.

## Probado end-to-end (2026-07-11, antes de la unificación)

Carrito → `/api/pago/crear` → formulario Webpay de integración → tarjeta de
prueba → banco simulado → retorno con commit → **voucher aprobado** (orden
`MM-PR-…`, $15.990, VISA ****6623) y carrito vaciado. Validaciones de stock,
producto desconocido y reserva verificadas por API. Pendiente reverificar el
mismo flujo tras la unificación de pasarelas (2026-07-13) y probar
MercadoPago con credenciales de prueba reales.
