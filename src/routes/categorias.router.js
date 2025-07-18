const express = require("express");
const router = express.Router();

const controller = require("../controllers/categorias.controller");

router.get("/createCategorias", controller.create);
router.post("/", controller.store);

router.get("/", controller.index);
router.get("/:codCategoria", controller.show);

router.get("/:codCategoria/modificarCategorias", controller.edit);
router.put("/:codCategoria", controller.update);

router.delete("/:codCategoria", controller.destroy);
// 
module.exports = router;
