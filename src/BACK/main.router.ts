import express from "express";
const router: express.Router = express.Router();

import * as controller from "./main.controller";

// router.get("/", controller.index);
router.get("/privada", controller.privated);

export default router;
