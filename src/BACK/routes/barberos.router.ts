import express from "express";
const router = express.Router();

import * as controller from "../controllers/barberos.controller";

router.get("/createBarberos", controller.create);
router.post("/", controller.store);

router.get("/", controller.index);
router.get("/:cuil", controller.show);

router.get("/:cuil/updateBarbero", controller.edit);
router.put("/:cuil", controller.update);

router.delete("/:cuil", controller.destroy);

export default router;
