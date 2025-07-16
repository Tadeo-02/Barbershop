const express = require("express");
const router = express.Router();

const controller = require("../controllers/turnos.controller");

router.get("/createTurnos", controller.create);
router.post("/", controller.store);

router.get("/", controller.index);
router.get("/:codTurno", controller.show);

router.get("/:codTurno/modificarTurno", controller.edit);
router.put("/:codTurno", controller.update);

router.delete("/:codTurno", controller.destroy);
// 
module.exports = router;
