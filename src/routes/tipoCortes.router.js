const express = require("express");
const router = express.Router();

const controller = require("../controllers/tipoCorte.controller");

router.get("/createTipoCorte", controller.create);
router.post("/", controller.store);

router.get("/", controller.index);
router.get("/:codCorte", controller.show);

router.get("/:codCorte/modificarTipoCorte", controller.edit); 
router.put("/:codCorte", controller.update);

router.delete("/:codCorte", controller.destroy);

module.exports = router;
