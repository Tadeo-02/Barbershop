/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request, Response } from "express";
import * as model from "./Billing";
import {
  CreateVoucherSchema,
  BillAppointmentSchema,
} from "../Schemas/billingSchema";
import { AFIP_PUNTO_VENTA, VOUCHER_TYPES } from "./afipConfig";
import { prisma } from "../base/Base";
import {
  gatherInvoiceData,
  generateInvoicePdf,
  gatherReceiptData,
  generateReceiptPdf,
} from "./invoicePdf";

// ============================================================
// Controller de Facturación Electrónica - ARCA
// ============================================================

/**
 * POST /facturacion/comprobante
 * Crear un comprobante (factura) manualmente.
 */
export const createVoucher = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const parsed = CreateVoucherSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Datos de comprobante inválidos",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await model.createVoucher(parsed.data);

    res.status(201).json({
      success: true,
      message: "Comprobante creado exitosamente",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Error al crear comprobante",
      code: error.code,
    });
  }
};

/**
 * POST /facturacion/facturar-turno
 * Facturar un turno completado (automática o manualmente desde botón).
 */
export const billAppointment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const parsed = BillAppointmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Datos de facturación inválidos",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const {
      codTurno,
      tipoComprobante,
      tipoDocumento,
      numeroDocumento,
      condicionIVAReceptor,
    } = parsed.data;

    const result = await model.billAppointment(
      codTurno,
      tipoComprobante,
      tipoDocumento,
      numeroDocumento,
      condicionIVAReceptor,
    );

    res.status(201).json({
      success: true,
      message: "Turno facturado exitosamente",
      data: result,
    });
  } catch (error: any) {
    const statusCode =
      error.code === "APPOINTMENT_NOT_FOUND"
        ? 404
        : error.code === "APPOINTMENT_NOT_COMPLETED" ||
            error.code === "APPOINTMENT_NO_PRICE"
          ? 400
          : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message || "Error al facturar turno",
      code: error.code,
    });
  }
};

/**
 * GET /facturacion/ultimo-comprobante/:tipoComprobante?
 * Obtener número del último comprobante.
 */
export const getLastVoucher = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const tipoComprobante = parseInt(
      req.params.tipoComprobante || String(VOUCHER_TYPES.FACTURA_B),
      10,
    );

    const lastVoucher = await model.getLastVoucherNumber(
      AFIP_PUNTO_VENTA,
      tipoComprobante,
    );

    res.status(200).json({
      success: true,
      data: {
        ultimoComprobante: lastVoucher,
        puntoDeVenta: AFIP_PUNTO_VENTA,
        tipoComprobante,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Error al obtener último comprobante",
    });
  }
};

/**
 * GET /facturacion/comprobante/:numeroComprobante/:tipoComprobante?
 * Obtener información de un comprobante ya emitido.
 */
export const getVoucherInfo = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const numeroComprobante = parseInt(req.params.numeroComprobante, 10);
    const tipoComprobante = parseInt(
      req.params.tipoComprobante || String(VOUCHER_TYPES.FACTURA_B),
      10,
    );

    if (isNaN(numeroComprobante)) {
      res.status(400).json({
        success: false,
        message: "Número de comprobante inválido",
      });
      return;
    }

    const info = await model.getVoucherInfo(
      numeroComprobante,
      AFIP_PUNTO_VENTA,
      tipoComprobante,
    );

    if (info === null) {
      res.status(404).json({
        success: false,
        message: "Comprobante no encontrado",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: info,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Error al obtener comprobante",
    });
  }
};

/**
 * GET /facturacion/tipos-comprobante
 * Obtener tipos de comprobantes disponibles.
 */
export const getVoucherTypes = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const types = await model.getVoucherTypes();
    res.status(200).json({ success: true, data: types });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Error al obtener tipos de comprobante",
    });
  }
};

/**
 * GET /facturacion/tipos-documento
 * Obtener tipos de documentos disponibles.
 */
export const getDocumentTypes = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const types = await model.getDocumentTypes();
    res.status(200).json({ success: true, data: types });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Error al obtener tipos de documento",
    });
  }
};

/**
 * GET /facturacion/tipos-alicuota
 * Obtener tipos de alícuotas de IVA disponibles.
 */
export const getAliquotTypes = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const types = await model.getAliquotTypes();
    res.status(200).json({ success: true, data: types });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Error al obtener tipos de alícuota",
    });
  }
};

/**
 * GET /facturacion/estado-servidor
 * Verificar estado del servidor de ARCA.
 */
export const getServerStatus = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const status = await model.getServerStatus();
    res.status(200).json({ success: true, data: status });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Error al verificar estado del servidor",
    });
  }
};

/**
 * GET /facturacion/puntos-venta
 * Obtener puntos de venta disponibles.
 */
export const getSalesPoints = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const points = await model.getSalesPoints();
    res.status(200).json({ success: true, data: points });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Error al obtener puntos de venta",
    });
  }
};

/**
 * GET /facturacion/pdf/:codTurno/:voucherNumber/:tipoComprobante?
 * Generar y descargar PDF de una factura ya emitida.
 */
export const getInvoicePdf = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { codTurno, voucherNumber } = req.params;
    const tipoComprobante = parseInt(
      req.params.tipoComprobante || String(VOUCHER_TYPES.FACTURA_B),
      10,
    );
    const nroComprobante = parseInt(voucherNumber, 10);

    if (!codTurno || isNaN(nroComprobante)) {
      res.status(400).json({
        success: false,
        message: "codTurno y voucherNumber son requeridos",
      });
      return;
    }

    const data = await gatherInvoiceData(
      codTurno,
      nroComprobante,
      AFIP_PUNTO_VENTA,
      tipoComprobante,
    );

    const pdfBuffer = await generateInvoicePdf(data);

    const filename = `factura_${String(AFIP_PUNTO_VENTA).padStart(4, "0")}-${String(nroComprobante).padStart(8, "0")}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error: any) {
    const statusCode =
      error.code === "VOUCHER_NOT_FOUND" ||
      error.code === "APPOINTMENT_NOT_FOUND"
        ? 404
        : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message || "Error al generar PDF de factura",
    });
  }
};

/**
 * GET /facturacion/recibo/:codTurno
 * Generar PDF: factura ARCA completa si el turno tiene datos de facturación,
 * o recibo simple si no fue facturado por ARCA.
 */
export const getReceiptPdf = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { codTurno } = req.params;

    if (!codTurno) {
      res.status(400).json({
        success: false,
        message: "codTurno es requerido",
      });
      return;
    }

    // Check if turno has ARCA billing data
    const turno = await prisma.turno.findUnique({
      where: { codTurno },
      select: {
        cae: true,
        voucherNumber: true,
        tipoComprobante: true,
        puntoDeVenta: true,
      },
    });

    if (turno?.cae && turno.voucherNumber) {
      // Serve full ARCA invoice PDF
      const puntoDeVenta = turno.puntoDeVenta || AFIP_PUNTO_VENTA;
      const tipoComprobante = turno.tipoComprobante || VOUCHER_TYPES.FACTURA_B;

      const data = await gatherInvoiceData(
        codTurno,
        turno.voucherNumber,
        puntoDeVenta,
        tipoComprobante,
      );
      const pdfBuffer = await generateInvoicePdf(data);

      const voucherNum = `${String(puntoDeVenta).padStart(4, "0")}-${String(turno.voucherNumber).padStart(8, "0")}`;
      const filename = `factura_${voucherNum}.pdf`;

      // Voucher type names
      const voucherTypeNames: Record<number, string> = {
        1: "Factura A",
        2: "Nota de Débito A",
        3: "Nota de Crédito A",
        6: "Factura B",
        7: "Nota de Débito B",
        8: "Nota de Crédito B",
        11: "Factura C",
        12: "Nota de Débito C",
        13: "Nota de Crédito C",
      };

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.setHeader(
        "Access-Control-Expose-Headers",
        "X-Voucher-Type, X-Voucher-Number, X-CAE",
      );
      res.setHeader(
        "X-Voucher-Type",
        voucherTypeNames[tipoComprobante] ||
          `Comprobante tipo ${tipoComprobante}`,
      );
      res.setHeader("X-Voucher-Number", voucherNum);
      res.setHeader("X-CAE", turno.cae);
      res.send(pdfBuffer);
      return;
    }

    // Fallback: simple receipt without ARCA data
    const data = await gatherReceiptData(codTurno);
    const pdfBuffer = await generateReceiptPdf(data);

    const filename = `recibo_${codTurno}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader(
      "Access-Control-Expose-Headers",
      "X-Voucher-Type, X-Voucher-Number, X-CAE",
    );
    res.send(pdfBuffer);
  } catch (error: any) {
    const statusCode =
      error.code === "APPOINTMENT_NOT_FOUND" ||
      error.code === "VOUCHER_NOT_FOUND"
        ? 404
        : error.code === "APPOINTMENT_NOT_CHARGED"
          ? 400
          : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message || "Error al generar PDF",
    });
  }
};
