import { Router } from "express";
import * as controller from "./billing.controller";
import {
  userLimiter,
  userModificationLimiter,
} from "../middleware/rateLimiter";
import { standardDeduplication } from "../middleware/deduplication";
import { validateRequest } from "../middleware/zodValidation";
import { z } from "zod";
import {
  BillAppointmentSchema,
  CreateVoucherSchema,
} from "../Schemas/billingSchema";

const router: Router = Router();

const tipoComprobanteParamSchema = z.object({
  tipoComprobante: z.string().optional(),
});
const voucherInfoParamsSchema = z.object({
  numeroComprobante: z.string(),
  tipoComprobante: z.string().optional(),
});
const invoicePdfParamsSchema = z.object({
  codTurno: z.string().min(1),
  voucherNumber: z.string().min(1),
  tipoComprobante: z.string().optional(),
});
const codTurnoParamSchema = z.object({ codTurno: z.string().min(1) });

// ============================================================
// Rutas de Facturación Electrónica - ARCA
// ============================================================

// --- Operaciones de escritura (crear comprobantes) ---

// Crear comprobante manualmente
router.post(
  "/comprobante",
  userModificationLimiter,
  standardDeduplication,
  validateRequest({ body: CreateVoucherSchema }),
  controller.createVoucher,
);

// Facturar un turno completado (manual desde botón o automática)
router.post(
  "/facturar-turno",
  userModificationLimiter,
  standardDeduplication,
  validateRequest({ body: BillAppointmentSchema }),
  controller.billAppointment,
);

// --- Operaciones de lectura (consultas) ---

// Estado del servidor ARCA
router.get("/estado-servidor", userLimiter, controller.getServerStatus);

// Último comprobante emitido
router.get(
  "/ultimo-comprobante{/:tipoComprobante}",
  userLimiter,
  validateRequest({ params: tipoComprobanteParamSchema }),
  controller.getLastVoucher,
);

// Info de un comprobante específico
router.get(
  "/comprobante/:numeroComprobante{/:tipoComprobante}",
  userLimiter,
  validateRequest({ params: voucherInfoParamsSchema }),
  controller.getVoucherInfo,
);

// Catálogos de ARCA
router.get("/tipos-comprobante", userLimiter, controller.getVoucherTypes);
router.get("/tipos-documento", userLimiter, controller.getDocumentTypes);
router.get("/tipos-alicuota", userLimiter, controller.getAliquotTypes);
router.get("/puntos-venta", userLimiter, controller.getSalesPoints);

// PDF de factura
router.get(
  "/pdf/:codTurno/:voucherNumber{/:tipoComprobante}",
  userLimiter,
  validateRequest({ params: invoicePdfParamsSchema }),
  controller.getInvoicePdf,
);

// Datos de facturación de un turno (JSON, desde DB)
router.get(
  "/datos-turno/:codTurno",
  userLimiter,
  validateRequest({ params: codTurnoParamSchema }),
  controller.getBillingData,
);

// PDF de recibo (sin datos ARCA, solo datos del turno)
router.get(
  "/recibo/:codTurno",
  userLimiter,
  validateRequest({ params: codTurnoParamSchema }),
  controller.getReceiptPdf,
);

export default router;
