import * as controller from "./categories.controller";
import createRouter from "../../base/base.router";
import { Router } from "express";
import {
  userModificationLimiter,
  userLimiter,
} from "../../middleware/rateLimiter";
import {
  strictDeduplication,
  standardDeduplication,
} from "../../middleware/deduplication";
import { authenticateToken } from "../../middleware/auth";
const router: Router = Router();

// Rutas específicas deben ir antes de las rutas genéricas
// Read operations - standard user limiting
router.get(
  "/:codCategoria/clients",
  authenticateToken,
  userLimiter,
  controller.listClients,
);

const baseRouter = createRouter(controller, {
  create: "/create",
  idParam: "codCategoria",
  updatePath: "/update",
  middleware: {
    read: [authenticateToken, userLimiter],
    create: [authenticateToken, userModificationLimiter, strictDeduplication],
    update: [authenticateToken, userModificationLimiter, standardDeduplication],
    delete: [authenticateToken, userModificationLimiter, standardDeduplication],
  },
});

router.use(baseRouter);

export default router;
