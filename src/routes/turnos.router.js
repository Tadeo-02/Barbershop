const express = require("express");
const router = express.Router();

const controller = require("../controllers/turnos.controller");

router.get("/createTurnos", controller.create);
router.post("/", controller.store);

// router.get("/", controller.index);
// router.get("/:id", controller.show);

// router.get("/:id/edit", controller.edit);
// router.put("/:id", controller.update);

router.delete("/:codTurno", controller.destroy);
// 
module.exports = router;
