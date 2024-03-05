# Select para obtener data csv
Select "Id","RUC","Imagenes","NombresIMG","TiposIMG","ArchivoXML","NombresXML","TiposXML" FROM "PROVEEDORES_PRD"."RegistroPreliminar"
Where "Imagenes" != '' and "IdEstado" = 23
order by "Id" asc
limit 100 offset 0