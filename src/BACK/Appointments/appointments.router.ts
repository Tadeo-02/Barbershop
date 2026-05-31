import * as controller from "./appointments.controller";
import createRouter from "../base/base.router";
import { Router } from "express";
import {
  userModificationLimiter,
  userLimiter,
} from "../middleware/rateLimiter";
import {
  strictDeduplication,
  standardDeduplication,
} from "../middleware/deduplication";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/roleMiddleware";
import { validateRequest } from "../middleware/zodValidation";
import { z } from "zod";
import { AppointmentSchema } from "../schemas/appointmentsSchema";

const router: Router = Router();

// — schemas igual que antes, sin cambios —
const codTurnoParamSchema = z.object({ codTurno: z.string().min(1) });
const optionalTurnoParamSchema = z.object({
  codTurno: z.string().optional(),
});
const availableParamsSchema = z.object({
  fechaTurno: z.string().min(1),
  codSucursal: z.string().min(1),
});
const barberParamsSchema = z.object({
  codBarbero: z.string().min(1),
  fechaTurno: z.string().min(1),
});
const userParamsSchema = z.object({ codUsuario: z.string().min(1) });
const branchParamsSchema = z.object({ codSucursal: z.string().min(1) });
const checkoutBodySchema = z.object({
  codCorte: z.string().min(1),
  precioTurno: z.union([z.string(), z.number()]),
  metodoPago: z.string().min(1),
});
const updateAppointmentBodySchema = z.object({
  fechaTurno: z.string().min(1),
  horaDesde: z.string().min(1),
  horaHasta: z.string().min(1),
});

// ─── CREAR TURNO ────────────────────────────────────────────────────────────
// Solo clientes crean turnos (no tiene sentido que un barbero se saque turno)
router.post(
  "/",
  authMiddleware,
  requireRole("client", "admin"), // admin puede crear en nombre de un cliente
  userModificationLimiter,
  strictDeduplication,
  validateRequest({ body: AppointmentSchema.omit({ codTurno: true }) }),
  controller.store,
);

// ─── BASE ROUTER (CRUD genérico) ─────────────────────────────────────────────
// El index/show del baseRouter no se usa en producción para appointments
// (se usan las rutas específicas de abajo), pero se protegen igual
const baseRouter = createRouter(controller, {
  create: "/create",
  idParam: "codTurno",
  updatePath: "/update",
  middleware: {
    read: [
      authMiddleware,
      requireRole("barber", "admin"), // solo staff ve el listado genérico
      userLimiter,
      validateRequest({ params: optionalTurnoParamSchema }),
    ],
    create: [
      authMiddleware,
      requireRole("client", "admin"),
      userModificationLimiter,
      strictDeduplication,
      validateRequest({ body: AppointmentSchema.omit({ codTurno: true }) }),
    ],
    update: [
      authMiddleware,
      requireRole("barber", "admin"),
      userModificationLimiter,
      standardDeduplication,
      validateRequest({
        params: codTurnoParamSchema,
        body: AppointmentSchema.partial(),
      }),
    ],
    delete: [
      authMiddleware,
      requireRole("admin"), // solo admin puede eliminar físicamente
      userModificationLimiter,
      standardDeduplication,
      validateRequest({ params: codTurnoParamSchema }),
    ],
  },
});

router.use(baseRouter);

// ─── CONSULTAS DE DISPONIBILIDAD ─────────────────────────────────────────────
// Pública con rate limit: cualquiera necesita ver horarios disponibles
// (incluso antes de loguearse para decidir si sacar turno)
router.get(
  "/available/:fechaTurno/:codSucursal",
  userLimiter,
  validateRequest({ params: availableParamsSchema }),
  controller.findByAvailableDate,
);

// ─── CONSULTAS DEL CLIENTE ───────────────────────────────────────────────────
// Un cliente solo puede ver SUS turnos — la validación de ownership va en el controller
router.get(
  "/user/:codUsuario",
  authMiddleware,
  requireRole("client", "admin"),
  userLimiter,
  validateRequest({ params: userParamsSchema }),
  controller.findByUserId,
);

// ─── CONSULTAS DEL BARBERO ───────────────────────────────────────────────────
router.get(
  "/barber/:codBarbero/:fechaTurno",
  authMiddleware,
  requireRole("client", "barber", "admin"),
  userLimiter,
  validateRequest({ params: barberParamsSchema }),
  controller.findByBarberId,
);

router.get(
  "/pending/barber/:codBarbero",
  authMiddleware,
  requireRole("barber", "admin"),
  userLimiter,
  validateRequest({ params: z.object({ codBarbero: z.string().min(1) }) }),
  controller.findPendingByBarberId,
);

// ─── CONSULTAS DE SUCURSAL (STAFF) ───────────────────────────────────────────
router.get(
  "/branch/:codSucursal",
  authMiddleware,
  requireRole("barber", "admin"),
  userLimiter,
  validateRequest({ params: branchParamsSchema }),
  controller.findByBranchId,
);

router.get(
  "/pending/branch/:codSucursal",
  authMiddleware,
  requireRole("barber", "admin"),
  userLimiter,
  validateRequest({ params: branchParamsSchema }),
  controller.findPendingByBranchId,
);

// ─── MODIFICACIONES DE ESTADO ────────────────────────────────────────────────
// Cancelar: cliente cancela el suyo, barbero/admin pueden cancelar cualquiera
router.put(
  "/:codTurno/cancel",
  authMiddleware,
  requireRole("client", "barber", "admin"),
  userModificationLimiter,
  standardDeduplication,
  validateRequest({ params: codTurnoParamSchema }),
  controller.cancelAppointment,
);

// Checkout: solo el barbero que atendió o admin cierran el turno con pago
router.put(
  "/:codTurno/checkout",
  authMiddleware,
  requireRole("barber", "admin"),
  userModificationLimiter,
  standardDeduplication,
  validateRequest({
    params: codTurnoParamSchema,
    body: checkoutBodySchema,
  }),
  controller.checkoutAppointment,
);

// Reprogramar: cliente puede mover su turno, barbero/admin también
router.put(
  "/:codTurno/update",
  authMiddleware,
  requireRole("client", "barber", "admin"),
  userModificationLimiter,
  standardDeduplication,
  validateRequest({
    params: codTurnoParamSchema,
    body: updateAppointmentBodySchema,
  }),
  controller.updateAppointment,
);

// No-show: solo el barbero o admin marcan inasistencia
router.put(
  "/:codTurno/no-show",
  authMiddleware,
  requireRole("barber", "admin"),
  userModificationLimiter,
  standardDeduplication,
  validateRequest({ params: codTurnoParamSchema }),
  controller.markAsNoShow,
);

export default router;
