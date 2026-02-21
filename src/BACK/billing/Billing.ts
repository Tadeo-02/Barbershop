/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, DatabaseError } from "../base/Base";
import {
  getAfip,
  AFIP_PUNTO_VENTA,
  VOUCHER_TYPES,
  CONCEPT_TYPES,
  DOC_TYPES,
  IVA_TYPES,
  IVA_CONDITION,
} from "./afipConfig";
import type {
  CreateVoucherInput,
  VoucherResponse,
} from "../Schemas/billingSchema";

// ============================================================
// Modelo de Facturación Electrónica - ARCA (ex-AFIP)
// ============================================================

/**
 * Obtener el número del último comprobante emitido.
 */
const getLastVoucherNumber = async (
  puntoDeVenta: number = AFIP_PUNTO_VENTA,
  tipoComprobante: number = VOUCHER_TYPES.FACTURA_B,
): Promise<number> => {
  try {
    const afip = getAfip();
    const lastVoucher = await afip.ElectronicBilling.getLastVoucher(
      puntoDeVenta,
      tipoComprobante,
    );
    return lastVoucher;
  } catch (error: any) {
    throw new DatabaseError(
      `Error al obtener último comprobante: ${error.message}`,
      "AFIP_LAST_VOUCHER_ERROR",
    );
  }
};

/**
 * Crear y asignar CAE a un comprobante (factura).
 * Usa createNextVoucher para auto-numerar.
 */
const createVoucher = async (
  input: CreateVoucherInput,
): Promise<VoucherResponse> => {
  try {
    const afip = getAfip();
    const puntoDeVenta = input.puntoDeVenta || AFIP_PUNTO_VENTA;

    // Fecha actual en formato ARCA (yyyymmdd)
    const date = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];

    // Construir data del comprobante
    const data: Record<string, any> = {
      CantReg: 1,
      PtoVta: puntoDeVenta,
      CbteTipo: input.tipoComprobante,
      Concepto: input.concepto,
      DocTipo: input.tipoDocumento,
      DocNro: input.numeroDocumento,
      CbteFch: parseInt(date.replace(/-/g, ""), 10),
      ImpTotal: input.importeTotal,
      ImpTotConc: input.importeNetoNoGravado,
      ImpNeto: input.importeNetoGravado,
      ImpOpEx: input.importeExento,
      ImpIVA: input.importeIVA,
      ImpTrib: input.importeTributos,
      MonId: input.moneda,
      MonCotiz: input.cotizacionMoneda,
      CondicionIVAReceptorId: input.condicionIVAReceptor,
    };

    // Si es concepto Servicios o Productos y Servicios, agregar fechas de servicio
    if (
      input.concepto === CONCEPT_TYPES.SERVICIOS ||
      input.concepto === CONCEPT_TYPES.PRODUCTOS_Y_SERVICIOS
    ) {
      data.FchServDesde = parseInt(date.replace(/-/g, ""), 10);
      data.FchServHasta = parseInt(date.replace(/-/g, ""), 10);
      data.FchVtoPago = parseInt(date.replace(/-/g, ""), 10);
    }

    // Agregar alícuotas de IVA si se proporcionan
    if (input.iva && input.iva.length > 0) {
      data.Iva = input.iva.map((item) => ({
        Id: item.id,
        BaseImp: item.baseImponible,
        Importe: item.importe,
      }));
    }

    const res = await afip.ElectronicBilling.createNextVoucher(data);

    return {
      CAE: res.CAE,
      CAEFchVto: res.CAEFchVto,
      voucher_number: res.voucher_number,
    };
  } catch (error: any) {
    throw new DatabaseError(
      `Error al crear comprobante ARCA: ${error.message}`,
      "AFIP_CREATE_VOUCHER_ERROR",
    );
  }
};

/**
 * Facturar un turno completado.
 * Obtiene el precio del turno desde la DB y genera la factura.
 */
const billAppointment = async (
  codTurno: string,
  tipoComprobante: number = VOUCHER_TYPES.FACTURA_B,
  tipoDocumento: number = DOC_TYPES.CONSUMIDOR_FINAL,
  numeroDocumento: number = 0,
  condicionIVAReceptor: number = IVA_CONDITION.CONSUMIDOR_FINAL,
): Promise<VoucherResponse & { codTurno: string }> => {
  try {
    // Obtener datos del turno
    const turno = await prisma.turno.findUnique({
      where: { codTurno },
      include: {
        tipos_corte: true,
      },
    });

    if (!turno) {
      throw new DatabaseError("Turno no encontrado", "APPOINTMENT_NOT_FOUND");
    }

    if (turno.estado !== "completado") {
      throw new DatabaseError(
        "Solo se pueden facturar turnos completados",
        "APPOINTMENT_NOT_COMPLETED",
      );
    }

    // Obtener el importe del turno
    const importeTotal = turno.precioTurno || turno.tipos_corte?.valorBase || 0;

    if (importeTotal <= 0) {
      throw new DatabaseError(
        "El turno no tiene un precio asignado",
        "APPOINTMENT_NO_PRICE",
      );
    }

    // Para Factura B (consumidor final), el importe total incluye IVA
    // ImpNeto = ImpTotal / 1.21 (si tiene IVA 21%)
    // ImpIVA = ImpTotal - ImpNeto
    const importeNeto = Math.round((importeTotal / 1.21) * 100) / 100;
    const importeIVA = Math.round((importeTotal - importeNeto) * 100) / 100;

    // Crear el comprobante
    const voucherResult = await createVoucher({
      tipoComprobante,
      concepto: CONCEPT_TYPES.SERVICIOS,
      tipoDocumento,
      numeroDocumento,
      importeTotal,
      importeNetoGravado: importeNeto,
      importeNetoNoGravado: 0,
      importeExento: 0,
      importeIVA,
      importeTributos: 0,
      condicionIVAReceptor,
      moneda: "PES",
      cotizacionMoneda: 1,
      iva: [
        {
          id: IVA_TYPES.IVA_21,
          baseImponible: importeNeto,
          importe: importeIVA,
        },
      ],
    });

    // Guardar referencia de factura en la DB (si el modelo tiene el campo)
    // TODO: Agregar campo de facturación al modelo Turno cuando se actualice el schema

    return {
      ...voucherResult,
      codTurno,
    };
  } catch (error: any) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(
      `Error al facturar turno: ${error.message}`,
      "AFIP_BILL_APPOINTMENT_ERROR",
    );
  }
};

/**
 * Obtener información de un comprobante ya emitido.
 */
const getVoucherInfo = async (
  numeroComprobante: number,
  puntoDeVenta: number = AFIP_PUNTO_VENTA,
  tipoComprobante: number = VOUCHER_TYPES.FACTURA_B,
): Promise<any | null> => {
  try {
    const afip = getAfip();
    const voucherInfo = await afip.ElectronicBilling.getVoucherInfo(
      numeroComprobante,
      puntoDeVenta,
      tipoComprobante,
    );
    return voucherInfo;
  } catch (error: any) {
    throw new DatabaseError(
      `Error al obtener info del comprobante: ${error.message}`,
      "AFIP_VOUCHER_INFO_ERROR",
    );
  }
};

/**
 * Obtener tipos de comprobantes disponibles.
 */
const getVoucherTypes = async (): Promise<any[]> => {
  try {
    const afip = getAfip();
    return await afip.ElectronicBilling.getVoucherTypes();
  } catch (error: any) {
    throw new DatabaseError(
      `Error al obtener tipos de comprobante: ${error.message}`,
      "AFIP_VOUCHER_TYPES_ERROR",
    );
  }
};

/**
 * Obtener tipos de documentos disponibles.
 */
const getDocumentTypes = async (): Promise<any[]> => {
  try {
    const afip = getAfip();
    return await afip.ElectronicBilling.getDocumentTypes();
  } catch (error: any) {
    throw new DatabaseError(
      `Error al obtener tipos de documento: ${error.message}`,
      "AFIP_DOC_TYPES_ERROR",
    );
  }
};

/**
 * Obtener tipos de alícuotas de IVA disponibles.
 */
const getAliquotTypes = async (): Promise<any[]> => {
  try {
    const afip = getAfip();
    return await afip.ElectronicBilling.getAliquotTypes();
  } catch (error: any) {
    throw new DatabaseError(
      `Error al obtener tipos de alícuota: ${error.message}`,
      "AFIP_ALIQUOT_TYPES_ERROR",
    );
  }
};

/**
 * Obtener estado del servidor de ARCA.
 */
const getServerStatus = async (): Promise<any> => {
  try {
    const afip = getAfip();
    return await afip.ElectronicBilling.getServerStatus();
  } catch (error: any) {
    throw new DatabaseError(
      `Error al verificar estado del servidor ARCA: ${error.message}`,
      "AFIP_SERVER_STATUS_ERROR",
    );
  }
};

/**
 * Obtener puntos de venta disponibles.
 * NOTA: En testing siempre devuelve error (usar punto de venta 1).
 */
const getSalesPoints = async (): Promise<any[]> => {
  try {
    const afip = getAfip();
    return await afip.ElectronicBilling.getSalesPoints();
  } catch (error: any) {
    throw new DatabaseError(
      `Error al obtener puntos de venta: ${error.message}`,
      "AFIP_SALES_POINTS_ERROR",
    );
  }
};

export {
  getLastVoucherNumber,
  createVoucher,
  billAppointment,
  getVoucherInfo,
  getVoucherTypes,
  getDocumentTypes,
  getAliquotTypes,
  getServerStatus,
  getSalesPoints,
};
