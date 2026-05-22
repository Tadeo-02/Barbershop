// branches/branches.router.ts
import * as controller from "./branches.controller";
import createRouter from "../../base/base.router";
import { Router } from "express";
import {
  userModificationLimiter,
  userLimiter,
  publicReadLimiter,
} from "../../middleware/rateLimiter";
import {
  strictDeduplication,
  standardDeduplication,
} from "../../middleware/deduplication";
import { authMiddleware } from "../../middleware/authMiddleware";
import { requireRole } from "../../middleware/roleMiddleware";

const router: Router = Router();

// GET /all — solo admin ve sucursales inactivas también
router.get(
  "/all",
  authMiddleware,
  requireRole("admin"),
  userLimiter,
  controller.indexAll,
);

// PATCH deactivate/reactivate — solo admin
router.patch(
  "/:codSucursal/deactivate",
  authMiddleware,
  requireRole("admin"),
  userModificationLimiter,
  standardDeduplication,
  controller.deactivate,
);

router.patch(
  "/:codSucursal/reactivate",
  authMiddleware,
  requireRole("admin"),
  userModificationLimiter,
  standardDeduplication,
  controller.reactivate,
);

const baseRouter = createRouter(controller, {
  create: "/create",
  idParam: "codSucursal",
  updatePath: "/update",
  middleware: {
    // GET / y /:id — público, cualquiera puede ver sucursales activas
    read: [publicReadLimiter],

    // POST / — solo admin crea sucursales
    create: [
      authMiddleware,
      requireRole("admin"),
      userModificationLimiter,
      strictDeduplication,
    ],

    // PUT /:id — solo admin edita
    update: [
      authMiddleware,
      requireRole("admin"),
      userModificationLimiter,
      standardDeduplication,
    ],

    // DELETE /:id — solo admin elimina
    delete: [
      authMiddleware,
      requireRole("admin"),
      userModificationLimiter,
      standardDeduplication,
    ],
  },
});

router.use(baseRouter);
export default router;
