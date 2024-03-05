const utilshttp = require("../utils/utilshttp");
const axios = require("axios");
exports.obtenerCorrelativoSAP = async function (oParam) {
  let oResponse = {};
  oResponse.oDataResponse = {};
  try {

    // var sUrlDestino = oParam.sObtenerCorrelativoSap.replace(
    //   "{PARAM_BUKRS}",
    //   oParam.PARAM_BUKRS
    // );

    var sUrlDestino = oParam.sObtenerCorrelativoSap;
    
    let obtenerCorrelativoSAPResponse = await axios.get(sUrlDestino);

    const { data } = obtenerCorrelativoSAPResponse;
    if (obtenerCorrelativoSAPResponse.status == 200) {
      oResponse.code = 1;
      oResponse.message = "OK";
      oResponse.oDataResponse = data;
    } else {
      oResponse.code = -1;
      oResponse.message = "No se puede obtener correlativo SAP.";
    }
  } catch (e) {
    oResponse.code = -3;
    oResponse.message =
      "Ocurrió un error en el servicio cliente, Url: " +
      sUrlDestino +
      ", Error: " +
      e.toString();
  }
  return oResponse;
};
