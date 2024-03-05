
var execSh = require("exec-sh");
const axios = require('axios');
const fs = require('node:fs');
const serviceClientObtenerCorrelativo = require('./serviceClient/obtenerCorrelativoSap');
const { escribirQuery } = require("./utils/utils");
const { param } = require("../apiintegracion/integracion-srv/healthchecker");
const { v4: uuidv4 } = require("uuid");

const correlativoFolderTemporal = "CorrelativoTemp";

const serviceClientRegistroAdjunto = require('./serviceClient/saveAdjunto');

let ejecutarArchivosDS = (configFile) => {

    let oParam = require("./config/" + configFile + ".json");
    flujoDescarga(oParam);

}


let flujoDescarga = async function (params) {

    // let params = require("./config/" + configFile + ".json");

    if (!fs.existsSync("./node_modules")) {
        await cliApps("npm i",
            {
            }
        );
    }

    let jsonArray = await leerArchivoCsv(params);
    // console.log("jsonArray", jsonArray[0]);
    for (const item of jsonArray) {
        console.log(`INICIANDO MIGRACION DEL REGISTRO PRELIMINAR ID: ${item.Id} Y RUC ${item.RUC}\n`);
        //VALIDAMOS SI YA SE MIGRO LA CARPETA
        let oParamBrowser = {
            path: `/root/${params.sCodSociedad}/${item.RUC}`,
        };
        let consultarCarpetaMigradaResponse = await axios.post(`${params.serviceURLDM}?accion=browser`,
            oParamBrowser
        );

        if (consultarCarpetaMigradaResponse.data.oAuditResponse.code !== 1) {
            console.log(`---FOLDER '/root/${params.sCodSociedad}/${item.RUC}' CREADO\n`);
            //REALIZAMOS LA CREACION DE LA CARPETA
            const crearFolderResponse = await axios.post(`${params.serviceURLDM}?accion=crear_folder`, {
                path: `/root/${params.sCodSociedad}/`,
                folderName: item.RUC
            });

            if (crearFolderResponse.data.oAuditResponse.code !== 1) {
                console.log("crearFolderResponse", crearFolderResponse);
                console.log(`---ERROR AL CREAR FOLDER ${item.RUC} en '/'root/${params.sCodSociedad}/'`);
            }
            console.log(`---FOLDER '/root/${params.sCodSociedad}/${item.RUC}' CREADO\n`);
        } else {
            console.log(`---YA EXISTE FOLDER '/root/${params.sCodSociedad}/${item.RUC}'\n`);
        }
        let carptCorrelativo = "";

        if (!item.CorrelativoSCP) {
            let correlativoFolderResponse = await serviceClientObtenerCorrelativo.obtenerCorrelativoSAP(params);

            if (correlativoFolderResponse.code !== 1) {
                // comprobantes[comprobantes.length - 1].CORRELATIVOSCP = "";
                throw new Error(
                    2 +
                    "||" +
                    "No se puede generar el correlativo en SAP. Por favor, intentar nuevamente."
                );
            } else {
                carptCorrelativo = correlativoFolderResponse.oDataResponse.CORRELATIVOSCP;
            }

            await escribirQuery("./query/jsonUpdate.sql", param.query_update_reg_pre);
        } else {
            carptCorrelativo = item.CorrelativoSCP
        }



        //VALIDAMOS SI YA SE MIGRO LA CARPETA Temporal que se tiene que reemplazar por la consulta a sap
        let oParamTEMPBrowser = {
            path: `/root/${params.sCodSociedad}/${item.RUC}/${carptCorrelativo}`,
        };
        let consultarCarpetaTEMPMigradaResponse = await axios.post(`${params.serviceURLDM}?accion=browser`,
            oParamTEMPBrowser
        );

        if (consultarCarpetaTEMPMigradaResponse.data.oAuditResponse.code !== 1) {
            let crearFolderTempResponse = await axios.post(`${params.serviceURLDM}?accion=crear_folder`, {
                path: `/root/${params.sCodSociedad}/${item.RUC}/`,
                folderName: carptCorrelativo
            });

            if (crearFolderTempResponse.data.oAuditResponse.code !== 1) {
                console.log("Error crearFolderTempResponse", crearFolderTempResponse);
                throw new Error("Error al crear Folder carptCorrelativo en la ruta" + `/root/${params.sCodSociedad}/${item.RUC}/`);
            }
            console.log(`---FOLDER '/root/${params.sCodSociedad}/${item.RUC}/${carptCorrelativo}' CREADO\n`);
        } else {
            console.log(`---YA EXISTE FOLDER '/root/${params.sCodSociedad}/${item.RUC}/${carptCorrelativo}'\n`);
        }
        //Variables para capturar los keys de XML y PDF
        let aFiles = [];
        let aExtension = [];
        let aNombres = [];
        let oDataDMS = {};
        //Validamos y subimos XML 
        aFiles = item[params.campokeyXML] ? item[params.campokeyXML].split(",") : [];
        aExtension = item[params.campoExtensionXML] ? item[params.campoExtensionXML].split(",") : [];
        aNombres = item[params.campoNombreXML] ? item[params.campoNombreXML].split(",") : [];
        if (aFiles.length) {
            oDataDMS = { ...[], aExtension, aFiles, aNombres };

            let subirArchivoXMLResponse = await subirArchivoDMS(oDataDMS, params, carptCorrelativo, item, "XML");
            if (subirArchivoXMLResponse.iCode !== 1) {
                console.log("error subir xml", subirArchivoXMLResponse);
                throw new Error('Error al subir xml' || subirArchivoXMLResponse.sMessage);
            }
        }

        //Validamos y subimor PDF
        aFiles = item[params.campoKey] ? item[params.campoKey].split(",") : [];
        aExtension = item[params.campoExtension] ? item[params.campoExtension].split(",") : [];
        aNombres = item[params.campoNombre] ? item[params.campoNombre].split(",") : [];
        if (aFiles.length) {
            oDataDMS = { ...[], aExtension, aFiles, aNombres };

            let subirArchivoPDFResponse = await subirArchivoDMS(oDataDMS, params, carptCorrelativo, item, "PDF");
            if (subirArchivoPDFResponse.iCode !== 1) {
                console.log("error subir xml", subirArchivoPDFResponse);
                throw new Error('Error al subir xml' || subirArchivoPDFResponse.sMessage);
            }
        }


        console.log(`FIN MIGRACION DEL REGISTRO PRELIMINAR ID: ${item.Id} Y RUC ${item.RUC}\n\n`);
    }
};

let subirArchivoDMS = async (oDataDMS, params, carptCorrelativo, item, tipo) => {

    let oResponse = {};

    try {
        // let aFiles = item[params.campoKey] ? item[params.campoKey].split(",") : [];
        // let aExtension = item[params.campoExtension] ? item[params.campoExtension].split(",") : [];
        // let aNombres = item[params.campoNombre] ? item[params.campoNombre].split(",") : [];
        let {
            aFiles, aExtension, aNombres
        } = oDataDMS
        // if (aFiles.length) {

            let listaAdjuntos = [];
                    // adjuntos.map(function (adjunto) {

            aFiles.map(function (adjunto,index) {

                listaAdjuntos.push({
                    uuid_adjunto: uuidv4(),
                    filename: aNombres[index] + "." + aExtension[index].split("/")[1],
                    path: `/root/${params.sCodSociedad}/${item.RUC}/${carptCorrelativo}/`,
                    base64: "",
                    extension: aExtension[index].split("/")[1],
                    key: adjunto
                });
            });
            

            let oParamRegistroAdjunto = {};
            oParamRegistroAdjunto.oData = {};
            oParamRegistroAdjunto.oData.listaAdjuntos = [];

            for (let j = 0; j < listaAdjuntos.length; j++) {
                const element = listaAdjuntos[j];
                oParamRegistroAdjunto.oData.listaAdjuntos.push({
                    uuid_adjunto: element.uuid_adjunto,
                    REGISTRO_PRELIMINAR_ID: item.Id,
                    NOMBRE_ADJUNTO: aNombres[j] + "." + aExtension[j].split("/")[1],
                    TIPO: aExtension[j].split("/")[1],
                    EXTENSION: aExtension[j],
                });
            }
            

            const serviceClientRegistroAdjuntoResponse =
                await serviceClientRegistroAdjunto.registroAdjunto(
                    params.sRegistroBase,
                    oParamRegistroAdjunto
                );
            if (
                serviceClientRegistroAdjuntoResponse.code !== 1) {
                throw new Error(
                    serviceClientRegistroAdjuntoResponse.code +
                    "||" +
                    serviceClientRegistroAdjuntoResponse.message
                );
            }
            

            let oParamActualizarAdjuntoXDM = {};
            oParamActualizarAdjuntoXDM.oData = {};
            oParamActualizarAdjuntoXDM.oData.listaAdjuntosXActualizar = [];
            let listaID_DMXAdjunto = [];

            // let index = 0;
            // for (const key of aFiles) {
            for (let index = 0; index < listaAdjuntos.length; index++) {
                const element = listaAdjuntos[index];
                let urlDS = params.urlGetArchivo;
                urlDS = urlDS.replace("id_key", element.key);
                let descargarBase64Response = await descargarArchivo(urlDS);
                if (descargarBase64Response.iCode < 1) {
                    throw new Error(descargarBase64Response.iCode + " || " + descargarBase64Response.sMessage);
                }
                let base64File = descargarBase64Response.oData;

                //VALIDAMOS SI YA SE MIGRO EL ARCHIVO
                let oParamFile = {
                    path: `/root/${params.sCodSociedad}/${item.RUC}/${carptCorrelativo}/${aNombres[index] + "." + aExtension[index].split("/")[1]}`,
                };
                let validarArchivoResponse = await axios.post(`${params.serviceURLDM}?accion=getFile`,
                    oParamFile
                );

                // let listaAdjuntos = [];
                // // adjuntos.map(function (adjunto) {


                // listaAdjuntos.push({
                //     uuid_adjunto: uuidv4(),
                //     filename: aNombres[index] + "." + aExtension[index].split("/")[1],
                //     path: `/root/${params.sCodSociedad}/${item.RUC}/${carptCorrelativo}/`,
                //     base64: base64File,
                //     extension: aExtension[index].split("/")[1],
                // });

                // let oParamRegistroAdjunto = {};
                // oParamRegistroAdjunto.oData = {};
                // oParamRegistroAdjunto.oData.listaAdjuntos = [];
                if (validarArchivoResponse.data.oAuditResponse.code != 1) {
                    let oParamCrearArchivo = {
                        filename: element.uuid_adjunto + "." + aExtension[index].split("/")[1],
                        path: `/root/${params.sCodSociedad}/${item.RUC}/${carptCorrelativo}/`, //CorrelativoFolder Temporal cmabiar por una consulta a SAP al momento de migrar
                        base64: base64File,
                    };

                    const serviceClientCrearArchivoResponse = await axios.post(`${params.serviceURLDM}?accion=crear_file`, oParamCrearArchivo);
                    if (serviceClientCrearArchivoResponse.data.oAuditResponse.code == 1) {

                        //Guardamos el adjunto
                        listaID_DMXAdjunto.push({
                            uuid_adjunto: element.uuid_adjunto,
                            ID_DM:
                              serviceClientCrearArchivoResponse.data.oDataResponse
                                .succinctProperties["cmis:objectId"],
                        });
                        // });
                        // oParamRegistroAdjunto.oData.listaAdjuntos.push({
                        //     uuid_adjunto: listaAdjuntos[0].uuid_adjunto,
                        //     REGISTRO_PRELIMINAR_ID: item.Id,
                        //     NOMBRE_ADJUNTO: aNombres[index] + "." + aExtension[index].split("/")[1],
                        //     TIPO: aExtension[index].split("/")[1],
                        //     EXTENSION: aExtension[index],
                        // });

                        // const serviceClientRegistroAdjuntoResponse =
                        //     await serviceClientRegistroAdjunto.registroAdjunto(
                        //         params.sRegistroBase,
                        //         oParamRegistroAdjunto
                        //     );
                        // if (
                        //     serviceClientRegistroAdjuntoResponse.code !== 1) {
                        //     throw new Error(
                        //         serviceClientRegistroAdjuntoResponse.code +
                        //         "||" +
                        //         serviceClientRegistroAdjuntoResponse.message
                        //     );
                        // }
                        // let oParamActualizarAdjuntoXDM = {};
                        // oParamActualizarAdjuntoXDM.oData = {};
                        // oParamActualizarAdjuntoXDM.oData.listaAdjuntosXActualizar = [];
                        // let listaID_DMXAdjunto = [];

                        // // for (let index = 0; index < listaAdjuntos.length; index++) {
                        // //     const element = listaAdjuntos[index];
                        // //     let oParamCrearArchivo = {};
                        // //     oParamCrearArchivo.oData = {};
                        // //     oParamCrearArchivo.oData = {
                        // //         filename:
                        // //             element.uuid_adjunto + "." + listaAdjuntos[index].extension,
                        // //         path: listaAdjuntos[index].path,
                        // //         base64: listaAdjuntos[index].base64,
                        // //     };
                        // //     oParamCrearArchivo.oAuditRequest = oAuditRequest;

                        // //     const serviceClientCrearArchivoResponse =
                        // //         await serviceClientCrearArchivo.crearArchivo(oParamCrearArchivo);
                        // //     if (
                        // //         serviceClientCrearArchivoResponse.code ==
                        // //         parseInt(global.traducciones["codeidf1"], 10)
                        // //     ) {
                        //         listaID_DMXAdjunto.push({
                        //             uuid_adjunto: listaAdjuntos[0].uuid_adjunto,
                        //             ID_DM:
                        //                 serviceClientCrearArchivoResponse.data.oDataResponse
                        //                     .succinctProperties["cmis:objectId"],
                        //         });
                        //     // }
                        // // }

                        // for (let index = 0; index < listaID_DMXAdjunto.length; index++) {
                        //     const element = listaID_DMXAdjunto[index];
                        //     let aEncontrado =
                        //         serviceClientRegistroAdjuntoResponse.oDataResponse.listaAdjuntos.filter(
                        //             function (item, index) {
                        //                 return item.UUID_ADJUNTO == element.uuid_adjunto;
                        //             }
                        //         );

                        //     if (aEncontrado.length > 0) {
                        //         for (let index2 = 0; index2 < aEncontrado.length; index2++) {
                        //             const element2 = aEncontrado[index2];
                        //             oParamActualizarAdjuntoXDM.oData.listaAdjuntosXActualizar.push({
                        //                 ID_ADJUNTO: element2.ID,
                        //                 ID_DM: element.ID_DM,
                        //             });
                        //         }
                        //     }
                        // }

                        // const serviceClientRegistroActualizarAdjuntoResponse =
                        //     await serviceClientRegistroAdjunto.actualizarAdjunto(
                        //         params.sRegistroBase,
                        //         oParamActualizarAdjuntoXDM
                        //     );
                        // if (
                        //     serviceClientRegistroActualizarAdjuntoResponse.code !==
                        //     parseInt(global.traducciones["codeidf1"], 10)
                        // ) {
                        //     throw new Error(
                        //         serviceClientRegistroActualizarAdjuntoResponse.code +
                        //         "||" +
                        //         serviceClientRegistroActualizarAdjuntoResponse.message
                        //     );
                        // }

                        // await escribirQuery("./query/jsonInsert.sql", param.query_update_reg_pre);
                        console.log(`--- ${tipo} --- Se MIGRO el archivo de ${item.RUC} de nombre ${aNombres[index]}, extension ${aExtension[index]} \n`)
                        console.log("------------------------------------------------------------------------");
                    } else {
                        console.log("serviceClientCrearArchivoResponse", serviceClientCrearArchivoResponse);
                        throw new Error(`---ERROR AL MIGRAR el archivo de ${item.RUC} de nombre ${aNombres[index]}, extension ${aExtension[index]} \n`)
                    }

                } else {
                    console.log("YA EXISTE EL ARCHIVO DE NOMBRE " + aNombres[index] + "." + aExtension[index].split("/")[1]);
                }

                // index++;
            }

            for (let index = 0; index < listaID_DMXAdjunto.length; index++) {
                const element = listaID_DMXAdjunto[index];
                let aEncontrado =
                  serviceClientRegistroAdjuntoResponse.oDataResponse.listaAdjuntos.filter(
                    function (item, index) {
                      return item.UUID_ADJUNTO == element.uuid_adjunto;
                    }
                  );
      
                if (aEncontrado.length > 0) {
                  for (let index2 = 0; index2 < aEncontrado.length; index2++) {
                    const element2 = aEncontrado[index2];
                    oParamActualizarAdjuntoXDM.oData.listaAdjuntosXActualizar.push({
                      ID_ADJUNTO: element2.ID,
                      ID_DM: element.ID_DM,
                    });
                  }
                }
              }
      
              const serviceClientRegistroActualizarAdjuntoResponse =
                await serviceClientRegistroAdjunto.actualizarAdjunto(
                    params.sRegistroBase,
                  oParamActualizarAdjuntoXDM
                );
              if (
                serviceClientRegistroActualizarAdjuntoResponse.code !== 1 ) {
                throw new Error(
                  serviceClientRegistroActualizarAdjuntoResponse.code +
                    "||" +
                    serviceClientRegistroActualizarAdjuntoResponse.message
                );
              }
      
            //   oResponse.oDataResponse.archivosXGuardar =
            //     oParamRegistroAdjunto.oData.listaAdjuntos;
        // }

        oResponse.iCode = 1;
        oResponse.sMessage = "OK";
        oResponse.oData = oParamRegistroAdjunto.oData.listaAdjuntos;
    } catch (error) {
        oResponse.iCode = error.code;
        oResponse.sMessage = error.message;
    }

    return oResponse;
}


async function leerArchivoCsv(oParam) {
    const csv = require('csvtojson');
    const parseCsvOptions = {
        noheader: false,
        delimiter: oParam.delimitador,
        // ignoreColumns: /(CreationDateTime|LastChangeDateTime)/
    };

    return await csv(parseCsvOptions).fromFile(oParam.archivoRuta, {
        encoding: 'utf8'
    });
}


let descargarArchivo = async (urlArchivo) => {
    let oResponse = {};

    try {
        console.log("url", urlArchivo);
        const response = await axios({
            method: 'GET',
            url: urlArchivo,
            responseType: 'arraybuffer',
            timeout: 600000
        })

        const fileBase64 = Buffer.from(response.data, 'binary').toString('base64')

        oResponse.iCode = 1;
        oResponse.sMessage = "OK";
        oResponse.oData = fileBase64;
    } catch (error) {
        console.log("error", error);
        oResponse.iCode = -1;
        oResponse.sMessage = error.message;
    }

    return oResponse;

}

let cliApps = function (command, options) {
    return new Promise(function (resolve, reject) {
        execSh(command, options, function (err, stdout) {
            if (err) {
                reject(err);
            } else {
                if (command.indexOf("cf env") > -1) {
                    //Obtenemos el VCAPSERVICES
                    var varEnv = stdout.substring(stdout.indexOf("VCAP_SERVICES:"), stdout.indexOf("VCAP_APPLICATION:")).replace('VCAP_SERVICES', '"VCAP_SERVICES"');
                    var jsonEnv = JSON.parse(`{ ${varEnv} }`);
                    // console.log("stoud_clipApps START",JSON.stringify(jsonEnv));
                    // console.log("stoud_clipApps END");
                    // fs.writeFileSync('./', data);
                    resolve(jsonEnv);
                } else {
                    resolve();
                }

            }
        });
    });
};


module.exports = ejecutarArchivosDS;
require('make-runnable');
