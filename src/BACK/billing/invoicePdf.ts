import PDFDocument from "pdfkit";
import { prisma, DatabaseError } from "../base/Base";
import { AFIP_PUNTO_VENTA, VOUCHER_TYPES } from "./afipConfig";
import { getVoucherInfo } from "./Billing";

// ============================================================
// Generador de PDF de Factura Electrónica
// ============================================================

/** Datos necesarios para generar el PDF */
interface InvoicePdfData {
  // Datos del comprobante ARCA
  cae: string;
  caeFchVto: string;
  voucherNumber: number;
  puntoDeVenta: number;
  tipoComprobante: number;
  fechaEmision: string;

  // Importes
  importeTotal: number;
  importeNeto: number;
  importeIVA: number;

  // Datos del turno / servicio
  codTurno: string;
  servicio: string;
  fechaTurno: string;

  // Datos del cliente
  clienteNombre: string;
  clienteDni: string;

  // Datos del barbero
  barberoNombre: string;

  // Datos de la sucursal
  sucursalNombre: string;
  sucursalDireccion: string;
}

/** Nombre legible del tipo de comprobante */
function voucherTypeName(tipo: number): string {
  const names: Record<number, string> = {
    [VOUCHER_TYPES.FACTURA_A]: "Factura A",
    [VOUCHER_TYPES.FACTURA_B]: "Factura B",
    [VOUCHER_TYPES.FACTURA_C]: "Factura C",
    [VOUCHER_TYPES.NOTA_DEBITO_A]: "Nota de Débito A",
    [VOUCHER_TYPES.NOTA_DEBITO_B]: "Nota de Débito B",
    [VOUCHER_TYPES.NOTA_DEBITO_C]: "Nota de Débito C",
    [VOUCHER_TYPES.NOTA_CREDITO_A]: "Nota de Crédito A",
    [VOUCHER_TYPES.NOTA_CREDITO_B]: "Nota de Crédito B",
    [VOUCHER_TYPES.NOTA_CREDITO_C]: "Nota de Crédito C",
  };
  return names[tipo] || `Comprobante tipo ${tipo}`;
}

/** Formatear CUIT con guiones: 20-40937847-2 */
function formatCuit(cuit: number | string): string {
  const s = String(cuit);
  if (s.length === 11)
    return `${s.slice(0, 2)}-${s.slice(2, 10)}-${s.slice(10)}`;
  return s;
}

/** Formatear fecha yyyymmdd → dd/mm/yyyy */
function formatAfipDate(d: string | number): string {
  const s = String(d);
  if (s.length === 8)
    return `${s.slice(6, 8)}/${s.slice(4, 6)}/${s.slice(0, 4)}`;
  return s;
}

/** Formatear número de comprobante como 0001-00000123 */
function formatVoucherNumber(ptoVta: number, nro: number): string {
  return `${String(ptoVta).padStart(4, "0")}-${String(nro).padStart(8, "0")}`;
}

/**
 * Recopilar todos los datos para el PDF a partir de codTurno + datos ARCA.
 */
export async function gatherInvoiceData(
  codTurno: string,
  voucherNumber: number,
  puntoDeVenta: number = AFIP_PUNTO_VENTA,
  tipoComprobante: number = VOUCHER_TYPES.FACTURA_B,
): Promise<InvoicePdfData> {
  // Obtener info del comprobante desde ARCA
  const voucherInfo = await getVoucherInfo(
    voucherNumber,
    puntoDeVenta,
    tipoComprobante,
  );
  if (!voucherInfo) {
    throw new DatabaseError(
      "Comprobante no encontrado en ARCA",
      "VOUCHER_NOT_FOUND",
    );
  }

  // Obtener datos del turno con relaciones
  const turno = await prisma.turno.findUnique({
    where: { codTurno },
    include: {
      tipos_corte: true,
      usuarios_turnos_codClienteTousuarios: {
        include: { sucursales: true },
      },
      usuarios_turnos_codBarberoTousuarios: {
        include: { sucursales: true },
      },
    },
  });

  if (!turno) {
    throw new DatabaseError("Turno no encontrado", "APPOINTMENT_NOT_FOUND");
  }

  const cliente = turno.usuarios_turnos_codClienteTousuarios;
  const barbero = turno.usuarios_turnos_codBarberoTousuarios;
  const sucursal = barbero.sucursales;

  const importeTotal = voucherInfo.ImpTotal || turno.precioTurno || 0;
  const importeNeto =
    voucherInfo.ImpNeto || Math.round((importeTotal / 1.21) * 100) / 100;
  const importeIVA =
    voucherInfo.ImpIVA || Math.round((importeTotal - importeNeto) * 100) / 100;

  return {
    cae: String(voucherInfo.CodAutorizacion || voucherInfo.CAE || ""),
    caeFchVto: String(voucherInfo.FchVto || voucherInfo.CAEFchVto || ""),
    voucherNumber,
    puntoDeVenta,
    tipoComprobante,
    fechaEmision: String(voucherInfo.CbteFch || ""),

    importeTotal,
    importeNeto,
    importeIVA,

    codTurno,
    servicio: turno.tipos_corte?.nombreCorte || "Servicio de barbería",
    fechaTurno: turno.fechaTurno.toISOString().split("T")[0],

    clienteNombre: `${cliente.nombre} ${cliente.apellido}`,
    clienteDni: cliente.dni,

    barberoNombre: `${barbero.nombre} ${barbero.apellido}`,

    sucursalNombre: sucursal?.nombre || "Barbería",
    sucursalDireccion: sucursal ? `${sucursal.calle} ${sucursal.altura}` : "",
  };
}

/**
 * Genera un PDF de factura y lo devuelve como Buffer.
 */
export function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        info: {
          Title: `Factura ${formatVoucherNumber(data.puntoDeVenta, data.voucherNumber)}`,
          Author: data.sucursalNombre,
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageWidth = doc.page.width - 100; // margins

      // ── Header ──────────────────────────────────────────
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text(data.sucursalNombre.toUpperCase(), { align: "center" });

      if (data.sucursalDireccion) {
        doc
          .fontSize(10)
          .font("Helvetica")
          .text(data.sucursalDireccion, { align: "center" });
      }

      const cuit = process.env.AFIP_CUIT || "20409378472";
      doc.fontSize(10).text(`CUIT: ${formatCuit(cuit)}`, { align: "center" });
      doc.moveDown(0.5);

      // ── Tipo de comprobante ─────────────────────────────
      const tipoNombre = voucherTypeName(data.tipoComprobante);
      const letra = tipoNombre.split(" ").pop() || "";

      // Recuadro con la letra del comprobante
      const letraBoxX = doc.page.width / 2 - 15;
      const letraBoxY = doc.y;
      doc.rect(letraBoxX, letraBoxY, 30, 30).stroke();
      doc
        .fontSize(18)
        .font("Helvetica-Bold")
        .text(letra, letraBoxX, letraBoxY + 7, {
          width: 30,
          align: "center",
        });
      doc.y = letraBoxY + 40;

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(tipoNombre, { align: "center" });
      doc
        .fontSize(11)
        .text(
          `N° ${formatVoucherNumber(data.puntoDeVenta, data.voucherNumber)}`,
          {
            align: "center",
          },
        );
      doc.moveDown(0.3);
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`Fecha de emisión: ${formatAfipDate(data.fechaEmision)}`, {
          align: "center",
        });

      doc.moveDown(1);

      // ── Línea separadora ────────────────────────────────
      drawLine(doc);
      doc.moveDown(0.5);

      // ── Datos del cliente ───────────────────────────────
      doc.fontSize(11).font("Helvetica-Bold").text("DATOS DEL CLIENTE");
      doc.fontSize(10).font("Helvetica");
      doc.text(`Nombre: ${data.clienteNombre}`);
      doc.text(`DNI: ${data.clienteDni}`);
      doc.text("Condición frente al IVA: Consumidor Final");
      doc.moveDown(0.5);

      drawLine(doc);
      doc.moveDown(0.5);

      // ── Detalle del servicio ────────────────────────────
      doc.fontSize(11).font("Helvetica-Bold").text("DETALLE");
      doc.moveDown(0.3);

      // Tabla header
      const colX = [50, 300, 400];
      const tableY = doc.y;

      doc.fontSize(9).font("Helvetica-Bold");
      doc.text("Descripción", colX[0], tableY);
      doc.text("Cant.", colX[1], tableY, { width: 80, align: "center" });
      doc.text("Importe", colX[2], tableY, { width: 100, align: "right" });

      doc.y = tableY + 15;
      drawLine(doc);
      doc.moveDown(0.3);

      // Fila del servicio
      const rowY = doc.y;
      doc.fontSize(10).font("Helvetica");
      doc.text(data.servicio, colX[0], rowY);
      doc.text("1", colX[1], rowY, { width: 80, align: "center" });
      doc.text(`$ ${data.importeTotal.toFixed(2)}`, colX[2], rowY, {
        width: 100,
        align: "right",
      });

      doc.y = rowY + 15;
      doc.text(`Barbero: ${data.barberoNombre}`, colX[0]);
      doc.text(`Fecha del turno: ${data.fechaTurno}`, colX[0]);

      doc.moveDown(1);
      drawLine(doc);
      doc.moveDown(0.5);

      // ── Totales ─────────────────────────────────────────
      const totalsX = 350;
      const valuesX = 450;

      doc.fontSize(10).font("Helvetica");
      let totY = doc.y;
      doc.text("Subtotal (Neto Gravado):", totalsX, totY);
      doc.text(`$ ${data.importeNeto.toFixed(2)}`, valuesX, totY, {
        width: 100,
        align: "right",
      });

      totY += 18;
      doc.text("IVA 21%:", totalsX, totY);
      doc.text(`$ ${data.importeIVA.toFixed(2)}`, valuesX, totY, {
        width: 100,
        align: "right",
      });

      totY += 22;
      doc.font("Helvetica-Bold").fontSize(12);
      doc.text("TOTAL:", totalsX, totY);
      doc.text(`$ ${data.importeTotal.toFixed(2)}`, valuesX, totY, {
        width: 100,
        align: "right",
      });

      doc.y = totY + 30;
      drawLine(doc);
      doc.moveDown(1);

      // ── CAE ─────────────────────────────────────────────
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("DATOS FISCALES", { align: "center" });
      doc.moveDown(0.3);
      doc.fontSize(10).font("Helvetica");
      doc.text(`CAE: ${data.cae}`, { align: "center" });
      doc.text(`Fecha de vencimiento CAE: ${formatAfipDate(data.caeFchVto)}`, {
        align: "center",
      });

      doc.moveDown(2);

      // ── Pie de página ───────────────────────────────────
      doc
        .fontSize(8)
        .fillColor("#666666")
        .text(
          "Comprobante electrónico generado por sistema. Válido como factura electrónica según RG ARCA.",
          50,
          doc.page.height - 80,
          { align: "center", width: pageWidth },
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/** Helper: Dibuja una línea horizontal */
function drawLine(doc: PDFKit.PDFDocument) {
  const y = doc.y;
  doc
    .strokeColor("#cccccc")
    .lineWidth(0.5)
    .moveTo(50, y)
    .lineTo(doc.page.width - 50, y)
    .stroke()
    .strokeColor("#000000");
}
