const express = require("express");
const router = express.Router();

const controller = require("../controllers/barberos.controller");

router.get("/createBarberos", controller.create);
router.post("/", controller.store);

router.get("/", controller.index);
router.get("/:cuil", controller.show);

router.get("/:cuil/updateBarbero", controller.edit);
router.put("/:cuil", controller.update);

router.delete("/:cuil", controller.destroy);
// 
module.exports = router;