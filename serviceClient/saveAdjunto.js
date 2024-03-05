
const utilshttp = require('../utils/utilshttp');
const axios = require('axios');

async function registroAdjunto(url,oParam) {
    var oResponse = {};
    oResponse.oDataResponse = {};
    try {
      var sUrlDestino = url  + "/adjuntos/registroImagenes";
  
      var response = await axios.post(sUrlDestino, oParam.oData, {
        headers: utilshttp.generaHanaXsHeaders(oParam.oAuditRequest),
      });
  
      const { data } = response;
      if (data.oAuditResponse.code === 1) {
        oResponse.code = 1;
        oResponse.message = "OK";
        oResponse.oDataResponse = data.oDataResponse;
      } else {
        oResponse.code = data.oAuditResponse.code;
        oResponse.message = data.oAuditResponse.message;
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
  }
  

  async function actualizarAdjunto(url,oParam) {
    var oResponse = {};
    oResponse.oDataResponse = {};
    try {
      var sUrlDestino = url + "/adjuntos/actualizarAdjuntos";
  
      var response = await axios.post(sUrlDestino, oParam.oData, {
        headers: utilshttp.generaHanaXsHeaders(oParam.oAuditRequest),
      });
  
      const { data } = response;
      if (data.oAuditResponse.code === 1) {
        oResponse.code = 1;
        oResponse.message = "OK";
        oResponse.oDataResponse = data.oDataResponse;
      } else {
        oResponse.code = data.oAuditResponse.code;
        oResponse.message = data.oAuditResponse.message;
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
  }

  module.exports = {
      registroAdjunto: registroAdjunto,
      actualizarAdjunto: actualizarAdjunto
  };
  