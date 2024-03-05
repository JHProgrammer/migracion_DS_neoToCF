const fs = require('fs');

function escribirQuery(ruta,data) {

    return new Promise((resolve, reject) => {

        try {
            // let rutaSql = './DownloadFiles/QueryUpdate.sql';
            let rutaSql = ruta
            fs.appendFile(rutaSql, "\n" + data, function (err) {

                if (err) {

                    reject({
                        iCode: -2,
                        msj: "Error al escribir"
                    });

                } else {

                    resolve({
                        iCode: 1,
                        msj: "OK"
                    });

                }

            });
        } catch (error) {
            console.log("error escritura sql", error);
        }
    });

}

module.exports = {
    escribirQuery
}