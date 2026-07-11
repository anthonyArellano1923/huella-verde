import pkg from 'transbank-sdk';

const { WebpayPlus, Options, IntegrationApiKeys, IntegrationCommerceCodes, Environment } = pkg;
function opciones() {
  return new Options(
    IntegrationCommerceCodes.WEBPAY_PLUS,
    IntegrationApiKeys.WEBPAY,
    Environment.Integration
  );
}
function webpayTransaction() {
  return new WebpayPlus.Transaction(opciones());
}
function generarBuyOrder(tipo) {
  const prefijo = tipo === "productos" ? "PR" : "RS";
  const tiempo = Date.now().toString(36);
  const azar = Math.random().toString(36).slice(2, 8);
  return `MM-${prefijo}-${tiempo}-${azar}`.slice(0, 26);
}

export { generarBuyOrder as g, webpayTransaction as w };
