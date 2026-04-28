import express from "express";
const router: express.Router = express.Router();

import * as controller from "./main.controller";

// Health check endpoint for Docker and monitoring
router.get("/health", controller.health);

// router.get("/", controller.index);
router.get("/privada", controller.privated);

export default router;
