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

type AfipCatalogItem = Record<string, unknown>;
type AfipVoucherInfo = Record<string, unknown>;
type AfipServerStatus = Record<string, unknown>;

type AfipVoucherPayload = {
  CantReg: number;
  PtoVta: number;
  CbteTipo: number;
  Concepto: number;
  DocTipo: number;
  DocNro: number;
  CbteFch: number;
  ImpTotal: number;
  ImpTotConc: number;
  ImpNeto: number;
  ImpOpEx: number;
  ImpIVA: number;
  ImpTrib: number;
  MonId: string;
  MonCotiz: number;
  CondicionIVAReceptorId: number;
  FchServDesde?: number;
  FchServHasta?: number;
  FchVtoPago?: number;
  Iva?: Array<{ Id: number; BaseImp: number; Importe: number }>;
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const ARGENTINA_TIMEZONE = "America/Argentina/Buenos_Aires";

const formatArgentinaDate = (date: Date): string => {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: ARGENTINA_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    const argentinaOffsetMs = 3 * 60 * 60 * 1000;
    return new Date(date.getTime() - argentinaOffsetMs)
      .toISOString()
      .split("T")[0];
  }
};

const toAfipDateNumber = (date: string): number =>
  parseInt(date.replace(/-/g, ""), 10);

const parseAfipDate = (value: unknown): number | null => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && /^\d{8}$/.test(value)) {
    return parseInt(value, 10);
  }
  return null;
};

const resolveIssueDate = async (
  puntoDeVenta: number,
  tipoComprobante: number,
): Promise<number> => {
  const today = toAfipDateNumber(formatArgentinaDate(new Date()));
  let issueDate = today;

  try {
    const lastVoucher = await getLastVoucherNumber(
      puntoDeVenta,
      tipoComprobante,
    );

    if (lastVoucher > 0) {
      const lastInfo = await getVoucherInfo(
        lastVoucher,
        puntoDeVenta,
        tipoComprobante,
      );
      const lastDate = parseAfipDate(
        (lastInfo as { CbteFch?: unknown } | null)?.CbteFch,
      );
      if (lastDate && lastDate > issueDate) {
        issueDate = lastDate;
      }
    }
  } catch {
    return issueDate;
  }

  return issueDate;
};

const extractVoucherAuth = (
  info: AfipVoucherInfo | null,
): { cae?: string; caeFchVto?: string } => {
  if (!info) return {};
  const cae =
    (info as { CodAutorizacion?: unknown }).CodAutorizacion ??
    (info as { CAE?: unknown }).CAE;
  const caeFchVto =
    (info as { FchVto?: unknown }).FchVto ??
    (info as { CAEFchVto?: unknown }).CAEFchVto;

  return {
    cae: cae != null ? String(cae) : undefined,
    caeFchVto: caeFchVto != null ? String(caeFchVto) : undefined,
  };
};

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
  } catch (error: unknown) {
    throw new DatabaseError(
      `Error al obtener último comprobante: ${getErrorMessage(error, "")}`,
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

    // Fecha ARCA: Argentina + no menor a la del ultimo comprobante
    const issueDate = await resolveIssueDate(
      puntoDeVenta,
      input.tipoComprobante,
    );

    // Construir data del comprobante
    const data: AfipVoucherPayload = {
      CantReg: 1,
      PtoVta: puntoDeVenta,
      CbteTipo: input.tipoComprobante,
      Concepto: input.concepto,
      DocTipo: input.tipoDocumento,
      DocNro: input.numeroDocumento,
      CbteFch: issueDate,
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
      data.FchServDesde = issueDate;
      data.FchServHasta = issueDate;
      data.FchVtoPago = issueDate;
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
      tipoComprobante: input.tipoComprobante,
      puntoDeVenta,
    };
  } catch (error: unknown) {
    throw new DatabaseError(
      `Error al crear comprobante ARCA: ${getErrorMessage(error, "")}`,
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

    if (turno.estado !== "Cobrado") {
      throw new DatabaseError(
        "Solo se pueden facturar turnos cobrados",
        "APPOINTMENT_NOT_COMPLETED",
      );
    }

    const puntoDeVenta = turno.puntoDeVenta || AFIP_PUNTO_VENTA;
    const tipoComprobanteFinal = turno.tipoComprobante || tipoComprobante;

    if (turno.cae && turno.caeFchVto && turno.voucherNumber) {
      return {
        CAE: turno.cae,
        CAEFchVto: turno.caeFchVto,
        voucher_number: turno.voucherNumber,
        tipoComprobante: tipoComprobanteFinal,
        puntoDeVenta,
        codTurno,
      };
    }

    if (turno.voucherNumber && (!turno.cae || !turno.caeFchVto)) {
      const info = await getVoucherInfo(
        turno.voucherNumber,
        puntoDeVenta,
        tipoComprobanteFinal,
      );
      const { cae, caeFchVto } = extractVoucherAuth(info);

      if (cae || caeFchVto) {
        await prisma.turno.update({
          where: { codTurno },
          data: {
            cae: cae ?? turno.cae ?? null,
            caeFchVto: caeFchVto ?? turno.caeFchVto ?? null,
            tipoComprobante: tipoComprobanteFinal,
            puntoDeVenta,
          },
        });

        return {
          CAE: cae ?? turno.cae ?? "",
          CAEFchVto: caeFchVto ?? turno.caeFchVto ?? "",
          voucher_number: turno.voucherNumber,
          tipoComprobante: tipoComprobanteFinal,
          puntoDeVenta,
          codTurno,
        };
      }

      throw new DatabaseError(
        "Datos de facturación incompletos para este turno",
        "APPOINTMENT_BILLING_INCONSISTENT",
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
      puntoDeVenta,
      tipoComprobante: tipoComprobanteFinal,
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

    // Guardar datos de facturación en el turno
    await prisma.turno.update({
      where: { codTurno },
      data: {
        cae: voucherResult.CAE,
        caeFchVto: voucherResult.CAEFchVto,
        voucherNumber: voucherResult.voucher_number,
        tipoComprobante: tipoComprobanteFinal,
        puntoDeVenta: voucherResult.puntoDeVenta || puntoDeVenta,
      },
    });

    return {
      ...voucherResult,
      codTurno,
    };
  } catch (error: unknown) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(
      `Error al facturar turno: ${getErrorMessage(error, "")}`,
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
): Promise<AfipVoucherInfo | null> => {
  try {
    const afip = getAfip();
    const voucherInfo = await afip.ElectronicBilling.getVoucherInfo(
      numeroComprobante,
      puntoDeVenta,
      tipoComprobante,
    );
    return voucherInfo;
  } catch (error: unknown) {
    throw new DatabaseError(
      `Error al obtener info del comprobante: ${getErrorMessage(error, "")}`,
      "AFIP_VOUCHER_INFO_ERROR",
    );
  }
};

/**
 * Obtener tipos de comprobantes disponibles.
 */
const getVoucherTypes = async (): Promise<AfipCatalogItem[]> => {
  try {
    const afip = getAfip();
    return await afip.ElectronicBilling.getVoucherTypes();
  } catch (error: unknown) {
    throw new DatabaseError(
      `Error al obtener tipos de comprobante: ${getErrorMessage(error, "")}`,
      "AFIP_VOUCHER_TYPES_ERROR",
    );
  }
};

/**
 * Obtener tipos de documentos disponibles.
 */
const getDocumentTypes = async (): Promise<AfipCatalogItem[]> => {
  try {
    const afip = getAfip();
    return await afip.ElectronicBilling.getDocumentTypes();
  } catch (error: unknown) {
    throw new DatabaseError(
      `Error al obtener tipos de documento: ${getErrorMessage(error, "")}`,
      "AFIP_DOC_TYPES_ERROR",
    );
  }
};

/**
 * Obtener tipos de alícuotas de IVA disponibles.
 */
const getAliquotTypes = async (): Promise<AfipCatalogItem[]> => {
  try {
    const afip = getAfip();
    return await afip.ElectronicBilling.getAliquotTypes();
  } catch (error: unknown) {
    throw new DatabaseError(
      `Error al obtener tipos de alícuota: ${getErrorMessage(error, "")}`,
      "AFIP_ALIQUOT_TYPES_ERROR",
    );
  }
};

/**
 * Obtener estado del servidor de ARCA.
 */
const getServerStatus = async (): Promise<AfipServerStatus> => {
  try {
    const afip = getAfip();
    return await afip.ElectronicBilling.getServerStatus();
  } catch (error: unknown) {
    throw new DatabaseError(
      `Error al verificar estado del servidor ARCA: ${getErrorMessage(error, "")}`,
      "AFIP_SERVER_STATUS_ERROR",
    );
  }
};

/**
 * Obtener puntos de venta disponibles.
 * NOTA: En testing siempre devuelve error (usar punto de venta 1).
 */
const getSalesPoints = async (): Promise<AfipCatalogItem[]> => {
  try {
    const afip = getAfip();
    return await afip.ElectronicBilling.getSalesPoints();
  } catch (error: unknown) {
    throw new DatabaseError(
      `Error al obtener puntos de venta: ${getErrorMessage(error, "")}`,
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
