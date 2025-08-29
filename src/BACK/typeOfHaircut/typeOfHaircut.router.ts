import express from "express";
const router = express.Router(); // enrutador para la seccion tipoCortes

import * as controller from "./typeOfHaircut.controller"; // importar controlador de tipoCorte
//get: leer datos
//post: enviar y guardar datos
//put: actualizar datos

router.get("/createTypeOfHaircut", controller.create);
router.post("/", controller.store);

router.get("/", controller.index);
router.get("/:codCorte", controller.show);

router.get("/:codCorte/modificarTypeOfHaircut", controller.edit);
router.put("/:codCorte", controller.update);

router.delete("/:codCorte", controller.destroy);

export default router; //exporta el enrutador para usarlo en la aplicacion
