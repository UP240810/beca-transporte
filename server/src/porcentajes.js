/** Distribución del boleto (confirmada con el municipio):
 *  50% municipio · 40% estudiante · 10% transportistas (donación).
 *  El transportista "cobra" efectivamente el 90% del boleto (100% − 10% donado).
 */
const PCT_ESTUDIANTE = 0.4;
const PCT_MUNICIPIO = 0.5;
const PCT_TRANSPORTISTA_DONA = 0.1;
const PCT_TRANSPORTISTA_NETO = 0.9;

function partesBoleto(costoBoleto) {
  const c = Math.max(0, Number(costoBoleto) || 0);
  return {
    costo100: c,
    costo90: Math.round(c * PCT_TRANSPORTISTA_NETO),
    costo50: Math.round(c * PCT_MUNICIPIO),
    costo40: Math.max(1, Math.round(c * PCT_ESTUDIANTE)),
  };
}

function cobroEstudiante(costoBoleto) {
  return partesBoleto(costoBoleto).costo40;
}

module.exports = {
  PCT_ESTUDIANTE,
  PCT_MUNICIPIO,
  PCT_TRANSPORTISTA_DONA,
  PCT_TRANSPORTISTA_NETO,
  partesBoleto,
  cobroEstudiante,
};
