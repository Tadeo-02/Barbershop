const express = require("express");
const router = express.Router();

const controller = require("../controllers/categories.controller");

router.get("/createCategories", controller.create);
router.post("/", controller.store);

router.get("/", controller.index);
router.get("/:codCategoria", controller.show);

router.get("/:codCategoria/updateCategories", controller.edit);
router.put("/:codCategoria", controller.update);

router.delete("/:codCategoria", controller.destroy);

module.exports = router;
