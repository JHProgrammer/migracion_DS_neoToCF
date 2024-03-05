//registrar auditoria
const axios = require("axios");

exports.generaHanaHeaders = function (oHeader = {}) {
  var oResponse = {};
  oResponse.idtransaccion ="migra";
  oResponse.usuario = "migracion";
  oResponse.usuarioencode = "asdsa";
  oResponse.usuario64 = "1dassd12312";
  oResponse.aplicacion = "migracion-app";
  oResponse.fecha = new Date();
  oResponse.terminal = "test";
  if (oHeader.infousuario) {
    oResponse.infousuario = oHeader.infousuario;
  }
  oResponse["Content-Type"] = "application/json";
  oResponse["Accept"] = "application/json";

  console.log(
    "%%%%%%%%%%%%%%% Header para llamar al servicio %%%%%%%%%%%%%%%%%%"
  );
  console.log(oResponse);
  return oResponse;
};

////-----------------

exports.httpOdata = async function (options, url, path) {
  var oResponse = {};
  oResponse.oAuditResponse = {};
  oResponse.oData = [];
  try {
    var sQuery = "";
    try {
      var aParameter = path.split("?");
      if (aParameter[1] !== undefined && aParameter[1] !== null) {
        if (url.indexOf("?") !== -1) {
          sQuery = "&" + aParameter[1];
        } else {
          sQuery = "?" + aParameter[1];
        }
      }
    } catch (e) {
      sQuery = "";
    }
    options.uri = options.uri + sQuery;
    const aData = axios.get(options);

    try {
      if (aData.d.results.length > 0) {
        oResponse.oAuditResponse.iCode = 1;
        oResponse.oAuditResponse.sMessage = "OK";
        oResponse.oData = aData.d.results;
      } else {
        oResponse.oAuditResponse = {};
        oResponse.oAuditResponse.iCode = 2;
        oResponse.oAuditResponse.sMessage = "No se encontró información";
      }
    } catch (e) {
      console.log(e);
      oResponse.oAuditResponse.iCode = -1;
      oResponse.oAuditResponse.sMessage =
        "Ocurrió un error al tratar de transformar datos del servicio, Error: " +
        e.toString();
      oResponse.oData = aData;
    }
  } catch (e) {
    console.log(e);
    oResponse.oAuditResponse.iCode = -2;
    oResponse.oAuditResponse.sMessage =
      "Ocurrió un error en el api gateway, " + e.toString();
  }

  return oResponse;
};

exports.httpMetodo = async function (options, url, path) {
  var oResponse = {};
  oResponse.oAuditResponse = {};
  oResponse.oData = [];
  try {
    var sQuery = "";
    try {
      var aParameter = path.split("?");
      if (aParameter[1] !== undefined && aParameter[1] !== null) {
        if (url.indexOf("?") !== -1) {
          sQuery = "&" + aParameter[1];
        } else {
          sQuery = "?" + aParameter[1];
        }
      }
    } catch (e) {
      sQuery = "";
    }
    options.uri = options.uri + sQuery;

    oResponse = await request(options);
  } catch (e) {
    console.log(e);
    oResponse.oAuditResponse.iCode = -2;
    oResponse.oAuditResponse.sMessage =
      "Ocurrió un error en el api gateway utilitario, " + e.toString();
  }

  return oResponse;
};

exports.generaHeadersHciPost = function (oHeader) {
  var oResponse = {};
  oResponse["Content-Type"] = "application/json; charset=utf-8";
  oResponse["Authorization"] = "Basic UDIwMDMwOTI1ODg6Y2ludGVyc2NwLjIwMjBA";

  return oResponse;
};

exports.generaHeadersScim = function (oHeader) {
  var oResponse = {};
  oResponse["Content-Type"] = "application/scim+json";
  oResponse["Authorization"] =
    "Basic ZjYwNTgyZjUtOWYyNy00MmRiLWFiMWQtMTFjNDQ2ZmI1YWNjOl9DaTIwMjBfLg==";

  return oResponse;
};
exports.generaHeadersApiScp = function (oHeader) {
  var oResponse = {};
  oResponse["Content-Type"] = "application/x-www-form-urlencoded";
  oResponse["Authorization"] =
    "Basic ODJhOGUzZGMtNzYxMC00MzA5LTgxZDctOTViYzEwYTcwODJkOjYvQDFVP01rdkVSb250bS5FMUZBRl00LXFjdHpZTjV4Ww==";

  return oResponse;
};
exports.generaHeadersloginScp = function (oHeader) {
  var oResponse = {};
  oResponse["Content-Type"] = "application/json";
  oResponse["Authorization"] = "Basic " + oHeader.sClave;

  return oResponse;
};
exports.generaOdataHeaders = function (oHeader) {
  var oResponse = {};
  oResponse["Content-Type"] = "application/json";
  oResponse["Accept"] = "application/json";

  return oResponse;
};

exports.generaHanaXsHeaders = function (oHeader={}) {
  var oResponse = {};
  oResponse.IdTransaccion = "transac";
  oResponse.sUsuario = "migracion";
  oResponse.sUsuarioEncode = "migra-encode";
  oResponse.sUsuario64 = "";
  oResponse.sAplicacion = "migracion-app";
  oResponse.dFecha = new Date();
  oResponse.sTerminal = "terminal";
  if (oHeader.oinfousuario) {
    oResponse.oInfoUsuario = oHeader.oinfousuario;
  }
  oResponse["Content-Type"] = "application/json";
  oResponse["Accept"] = "application/json";

  console.log(
    "%%%%%%%%%%%%%%% Header para llamar al servicio %%%%%%%%%%%%%%%%%%"
  );
  console.log(oResponse);
  return oResponse;
};

//JHERNANDEZ 23/02/2022 - Nueva funcion para consultar las APIS del IAS
exports.generaHeadersApiIAS = function (sAmbiente) {
  var oResponse = {};
  oResponse["Content-Type"] = "application/vnd.sap-id-service.sp-user-id+xml";
  //Encode de ClientID y ClienteSecret del IDP
  if (sAmbiente === "dev") {
    oResponse["Authorization"] =
      "Basic ODJhOGUzZGMtNzYxMC00MzA5LTgxZDctOTViYzEwYTcwODJkOkFIW01zdDNyWWtUdHFGVjBWc3NXeUZTZ3hOTjUucWt4Ykph";
  } else if (sAmbiente === "qas") {
    oResponse["Authorization"] =
      "Basic NDllOTk1NzktOTU4Yi00MGNjLWFlZTUtMmFkMGQ5OTA1MDdhOmJNNWdSVWNUSjphdmFQa0NLdUpuSzpSNy9iVj8vRW1M";
  } else if (sAmbiente === "prd") {
    oResponse["Authorization"] =
      "Basic YzkxZjU3YjYtYmJhYy00MGU5LWI0ZTUtODhhNjk1YmVlNmJlOjYtNXhVbV9YRGtBenJnQ0VKb05zPWlCRD1meTBLLXVAVA==";
  }

  return oResponse;
};
//END Nueva funcion para desactivar usuario
