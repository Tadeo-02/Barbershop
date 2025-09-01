import express from "express";
const router = express.Router();

import * as controller from "./barbers.controller";

router.get("/createBarbers", controller.create);
router.post("/", controller.store);

router.get("/", controller.index);
router.get("/:codUsuario", controller.show);

router.get("/:codUsuario/updateBarber", controller.edit);
router.put("/:codUsuario", controller.update);

router.delete("/:codUsuario", controller.destroy);

export default router;
