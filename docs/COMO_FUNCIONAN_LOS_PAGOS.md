# Cómo funcionan los pagos — rama `transbank`

> Tu primera lección de backend real. Esta rama implementa **Webpay Plus**
> (Transbank) para pagar online productos Y reservas. La rama `main` usa
> transferencia coordinada por WhatsApp (cero servidor).

## La idea general en 30 segundos

Un pago online son **3 viajes**:

```
1. TU SERVIDOR  → Transbank : "quiero cobrar $15.990" → me dan un token
2. EL CLIENTE   → Transbank : paga en el formulario de Webpay (nunca en tu web)
3. Transbank    → TU SERVIDOR: vuelve con el token → confirmas y te dicen si pagó
```

Los números de tarjeta **jamás pasan por tu código**: eso es lo que hace
"seguro" el modelo. Tu servidor solo habla de montos y tokens.

## El flujo, archivo por archivo

### 1. El cliente arma el pedido (navegador)

- `src/stores/carrito.ts` — el carrito vive en **nanostores** con
  `persistentAtom`: un mini-estado global compartido entre islas React que se
  guarda en localStorage (sobrevive recargas). Solo guarda *slug + cantidad*.
- `src/components/react/CarritoLista.tsx` — al apretar "Pagar", hace
  `fetch('/api/pago/crear', { items: [{slug, qty}] })`. **Nunca manda el
  precio**: eso lo decide el servidor.
- En `/reservar`, el botón "Pagar esta reserva" manda `{servicioId, tamanoId}`.

### 2. El servidor crea la transacción — `src/pages/api/pago/crear.ts`

Esta es tu **primera función serverless**: un archivo en `src/pages/api/` con
`export const prerender = false` deja de ser HTML estático y se convierte en
código que corre en Vercel **cada vez que alguien lo llama**.

Pasos que hace:
1. Lee el JSON del navegador.
2. **Recalcula el total** leyendo los precios reales (content collection para
   prendas, `servicios.ts` para reservas). Regla de oro del backend:
   *nunca confíes en lo que manda el navegador* — un cliente malicioso puede
   editar su JavaScript, pero no puede editar el tuyo.
3. Valida stock y cantidades (¿pediste 5 y quedan 1? → error 409).
4. Llama a `tx.create(buyOrder, sessionId, monto, returnUrl)` del SDK oficial
   (`src/lib/transbank.ts`). Transbank responde `{url, token}`.
5. Devuelve eso al navegador, que redirige a `url?token_ws=token` → el
   formulario de pago DE TRANSBANK (webpay3gint.transbank.cl en integración).

### 3. Transbank devuelve al cliente — `src/pages/pago/retorno.astro`

También corre en el servidor (`prerender = false`), porque debe hacer el paso
más importante y menos intuitivo: **el commit**.

- Webpay te devuelve `token_ws`… pero eso solo significa "el cliente terminó
  el formulario". Para saber si el pago fue APROBADO tienes que llamar a
  `tx.commit(token_ws)` **desde el servidor, dentro de los ~5 minutos**.
  Si no haces commit, la transacción se reversa sola (el cliente ve el cobro
  aparecer y desaparecer en su cartola).
- `response_code === 0 && status === 'AUTHORIZED'` → pago real. Se muestra el
  voucher (orden, monto, últimos 4 dígitos, código de autorización).
- Si vuelve `TBK_TOKEN` en vez de `token_ws` → el cliente ANULÓ en Webpay.
- El prefijo de la orden distingue el tipo: `MM-PR-…` = productos,
  `MM-RS-…` = reserva (a la reserva se le pide escribir la orden en las
  notas de Cal.com para que Martha asocie pago ↔ hora).

## Credenciales y ambientes — `src/lib/transbank.ts`

| | Integración (ahora) | Producción (futuro) |
|---|---|---|
| Credenciales | Públicas, de prueba, vienen en el SDK | Contrato de Martha con Transbank (RUT empresa) |
| Tarjeta | VISA `4051 8856 0044 6623`, CVV `123`, fecha futura | Tarjetas reales |
| Banco simulado | RUT `11.111.111-1`, clave `123` | Banco real |
| ¿Se cobra? | No, todo es de mentira | Sí |

Para pasar a producción NO se toca el código: se definen en Vercel las
variables de entorno `TBK_COMMERCE_CODE`, `TBK_API_KEY` y `TBK_ENV=produccion`.

## Limitación conocida (y honesta) de esta v1

No hay base de datos: el pago aprobado existe en el voucher del cliente y en
el panel de Transbank, pero la web no guarda registro propio, no descuenta
stock automáticamente, y la asociación pago↔reserva depende de que el cliente
escriba la orden en las notas. Es el trade-off correcto para validar si el
pago online se usa siquiera. La **Fase 7** (Turso + webhooks) cierra ese
círculo: registrar cada transacción, descontar stock y asociar reservas sin
copiar códigos a mano.

## Probado end-to-end (2026-07-11)

Carrito → `/api/pago/crear` → formulario Webpay de integración → tarjeta de
prueba → banco simulado → retorno con commit → **voucher aprobado** (orden
`MM-PR-…`, $15.990, VISA ****6623) y carrito vaciado. Validaciones de stock,
producto desconocido y reserva verificadas por API.

---

# Anexo de esta rama: MercadoPago Checkout Pro

Misma arquitectura que Webpay (carrito → serverless → redirect → retorno),
con tres diferencias que valen una lección:

1. **Preferencia en vez de transacción:** a MP se le mandan los ÍTEMS
   (nombre, cantidad, precio unitario) y él arma el checkout. Transbank solo
   recibía el monto total.
2. **No hay "commit":** MP confirma el pago por su cuenta. La página de
   retorno VERIFICA consultando el `payment_id` a la API (nunca confiar en
   los query params del navegador). Además existe `/api/pago/webhook`: MP
   avisa servidor-a-servidor de cada cambio de estado, aunque el cliente
   cierre la pestaña — ese es el canal confiable.
3. **Credenciales propias incluso para probar:** a diferencia de Transbank
   (credenciales de integración públicas), acá hay que crear una aplicación
   en developers.mercadopago.com y definir `MP_ACCESS_TOKEN` (ver
   `.env.example`). Sin token, el endpoint responde 503 con mensaje claro
   y la web sigue funcionando (WhatsApp como respaldo).

Estado `pending` (nuevo vs Webpay): pagos en efectivo tardan en acreditarse;
la página de retorno lo explica al cliente.

**Pendiente para probar E2E:** cuenta de MercadoPago de Anthony/Martha con
token de prueba. El código está listo; sin cuenta no se puede simular.
