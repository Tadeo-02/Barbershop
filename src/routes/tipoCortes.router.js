const express = require("express");
const router = express.Router(); // enrutador para la seccion tipoCortes

const controller = require("../controllers/tipoCorte.controller"); // importar controlador de tipoCorte
//get: leer datos
//post: enviar y guardar datos
//put: actualizar datos

router.get("/createTipoCorte", controller.create);
router.post("/", controller.store);

router.get("/", controller.index);
router.get("/:codCorte", controller.show);

router.get("/:codCorte/modificarTipoCorte", controller.edit); 
router.put("/:codCorte", controller.update);

router.delete("/:codCorte", controller.destroy);

module.exports = router; //exporta el enrutador para usarlo en la aplicacion
