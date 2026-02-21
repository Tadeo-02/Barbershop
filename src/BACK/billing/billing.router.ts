import { Router } from "express";
import * as controller from "./billing.controller";
import {
  userLimiter,
  userModificationLimiter,
} from "../middleware/rateLimiter";
import { standardDeduplication } from "../middleware/deduplication";

const router: Router = Router();

// ============================================================
// Rutas de Facturación Electrónica - ARCA
// ============================================================

// --- Operaciones de escritura (crear comprobantes) ---

// Crear comprobante manualmente
router.post(
  "/comprobante",
  userModificationLimiter,
  standardDeduplication,
  controller.createVoucher,
);

// Facturar un turno completado (manual desde botón o automática)
router.post(
  "/facturar-turno",
  userModificationLimiter,
  standardDeduplication,
  controller.billAppointment,
);

// --- Operaciones de lectura (consultas) ---

// Estado del servidor ARCA
router.get("/estado-servidor", userLimiter, controller.getServerStatus);

// Último comprobante emitido
router.get(
  "/ultimo-comprobante{/:tipoComprobante}",
  userLimiter,
  controller.getLastVoucher,
);

// Info de un comprobante específico
router.get(
  "/comprobante/:numeroComprobante{/:tipoComprobante}",
  userLimiter,
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
  controller.getInvoicePdf,
);

export default router;
