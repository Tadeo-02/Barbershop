import PDFDocument from "pdfkit";
import { AFIP_PUNTO_VENTA } from "../afipConfig";
import {
    formatAfipDate,
    formatCuit,
    formatVoucherNumber,
    voucherTypeName,
} from "./pdfHelpers";

// ============================================================
// Template de Recibo Simple (sin datos ARCA)
// ============================================================

/** Datos para el recibo simple */
export interface ReceiptPdfData {
    codTurno: string;
    fechaEmision: string;

    importeTotal: number;
    importeNeto: number;
    importeIVA: number;

    servicio: string;
    fechaTurno: string;

    clienteNombre: string;
    clienteDni: string;

    barberoNombre: string;

    sucursalNombre: string;
    sucursalDireccion: string;

    // Datos de facturación desde la DB (opcionales)
    cae: string | null;
    caeFchVto: string | null;
    voucherNumber: number | null;
    tipoComprobante: number | null;
    puntoDeVenta: number | null;
}

/**
 * Genera un PDF de recibo (sin datos ARCA) y lo devuelve como Buffer.
 */
export function generateReceiptPdf(data: ReceiptPdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: "A4",
                margin: 0,
                info: {
                    Title: `Recibo - ${data.codTurno}`,
                    Author: data.sucursalNombre,
                },
            });

            const chunks: Buffer[] = [];
            doc.on("data", (c: Buffer) => chunks.push(c));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", reject);

            const MX = 40;
            const PW = doc.page.width;
            const CW = PW - MX * 2;
            const HALF = PW / 2;
            const cuit = process.env.AFIP_CUIT || "20409378472";

            const hasTipoComprobante = data.tipoComprobante != null;
            const hasVoucherNumber = data.voucherNumber != null;
            const hasCae = !!data.cae;
            const hasFiscalData =
                hasTipoComprobante || hasVoucherNumber || hasCae || !!data.caeFchVto;

            const fechaParts = data.fechaEmision.split("-");
            const fechaFormateada = `${fechaParts[2]}/${fechaParts[1]}/${fechaParts[0]}`;

            // ════════════════════════════════════════════════════
            // BLOQUE 1 — ENCABEZADO (3 columnas)
            // ════════════════════════════════════════════════════
            const HDR_H = 110;
            doc.rect(0, 0, PW, HDR_H).fill("#f7f7f7");
            doc.rect(0, HDR_H, PW, 1).fill("#cccccc");

            // — Col izquierda: datos del emisor —
            const leftW = HALF - 60;
            doc.fillColor("#111111").fontSize(13).font("Helvetica-Bold")
                .text(data.sucursalNombre.toUpperCase(), MX, 16, { width: leftW, lineBreak: false });
            if (data.sucursalDireccion) {
                doc.fontSize(9).font("Helvetica").fillColor("#444444")
                    .text(data.sucursalDireccion, MX, 36, { width: leftW, lineBreak: false });
            }
            doc.fontSize(9).fillColor("#444444")
                .text(`CUIT: ${formatCuit(cuit)}`, MX, 52, { width: leftW, lineBreak: false });
            doc.fontSize(8).fillColor("#666666")
                .text("Responsable Inscripto", MX, 67, { width: leftW, lineBreak: false });

            // — Col centro: caja de letra o ícono recibo —
            const BOX = 64;
            const boxX = HALF - BOX / 2;
            const boxY = (HDR_H - BOX) / 2;
            doc.rect(boxX, boxY, BOX, BOX).lineWidth(2).stroke("#333333");

            if (hasTipoComprobante && data.tipoComprobante != null) {
                const tipoNombre = voucherTypeName(data.tipoComprobante);
                const letra = tipoNombre.split(" ").pop() || "";
                doc.fillColor("#111111").fontSize(32).font("Helvetica-Bold")
                    .text(letra, boxX, boxY + 13, { width: BOX, align: "center", lineBreak: false });
                doc.fontSize(7).font("Helvetica").fillColor("#555555")
                    .text("COD.", boxX, boxY + BOX + 4, { width: BOX, align: "center", lineBreak: false });
            } else {
                doc.fillColor("#111111").fontSize(9).font("Helvetica-Bold")
                    .text("RECIBO", boxX, boxY + 25, { width: BOX, align: "center", lineBreak: false });
            }

            // — Col derecha: tipo + número + fecha —
            const rightX = HALF + 44;
            const rightW = PW - rightX - MX;

            if (hasTipoComprobante && data.tipoComprobante != null) {
                const tipoNombre = voucherTypeName(data.tipoComprobante);
                doc.fontSize(12).font("Helvetica-Bold").fillColor("#111111")
                    .text(tipoNombre.toUpperCase(), rightX, 16, { width: rightW, lineBreak: false });
                if (hasVoucherNumber && data.voucherNumber != null) {
                    const ptoVta = data.puntoDeVenta || AFIP_PUNTO_VENTA;
                    doc.fontSize(10).font("Helvetica").fillColor("#333333")
                        .text(`N° ${formatVoucherNumber(ptoVta, data.voucherNumber)}`, rightX, 34, { width: rightW, lineBreak: false });
                }
            } else {
                doc.fontSize(12).font("Helvetica-Bold").fillColor("#111111")
                    .text("RECIBO DE PAGO", rightX, 16, { width: rightW, lineBreak: false });
            }
            doc.fontSize(9).font("Helvetica").fillColor("#555555")
                .text(`Fecha de emisión: ${fechaFormateada}`, rightX, 52, { width: rightW, lineBreak: false });
            doc.fontSize(8).fillColor("#666666")
                .text(`Ref.: ${data.codTurno}`, rightX, 68, { width: rightW, lineBreak: false });

            let Y = HDR_H + 16;

            // ════════════════════════════════════════════════════
            // BLOQUE 2 — RECEPTOR (2 columnas)
            // ════════════════════════════════════════════════════
            doc.rect(MX, Y, CW, 18).fill("#222222");
            doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold")
                .text("DATOS DEL RECEPTOR", MX + 6, Y + 5, { width: CW - 12, lineBreak: false });
            Y += 18;

            const REC_H = 60;
            doc.rect(MX, Y, CW, REC_H).fill("#fafafa").stroke("#e0e0e0");

            const col1W = Math.floor(CW * 0.55);
            const col2X = MX + col1W + 12;
            const col2W = CW - col1W - 12;

            doc.fillColor("#555555").fontSize(8).font("Helvetica-Bold")
                .text("Apellido y Nombre / Razón Social:", MX + 6, Y + 8, { width: col1W - 8, lineBreak: false });
            doc.fillColor("#111111").fontSize(10).font("Helvetica")
                .text(data.clienteNombre, MX + 6, Y + 22, { width: col1W - 8, lineBreak: false });
            doc.fillColor("#555555").fontSize(8).font("Helvetica-Bold")
                .text("DNI / CUIL / CUIT:", MX + 6, Y + 40, { width: col1W - 8, lineBreak: false });
            doc.fillColor("#111111").fontSize(10).font("Helvetica")
                .text(data.clienteDni, MX + 6, Y + 50, { width: col1W - 8, lineBreak: false });

            doc.fillColor("#555555").fontSize(8).font("Helvetica-Bold")
                .text("Condición frente al IVA:", col2X, Y + 8, { width: col2W, lineBreak: false });
            doc.fillColor("#111111").fontSize(10).font("Helvetica")
                .text("Consumidor Final", col2X, Y + 22, { width: col2W, lineBreak: false });

            Y += REC_H + 16;

            // ════════════════════════════════════════════════════
            // BLOQUE 3 — TABLA DE ÍTEMS
            // ════════════════════════════════════════════════════
            const c = {
                cod: { x: MX, w: 90 },
                desc: { x: MX + 90, w: 130 },
                barb: { x: MX + 220, w: 125 },
                fecha: { x: MX + 345, w: 85 },
                imp: { x: MX + 430, w: CW - 430 },
            };

            const TH = 22;
            doc.rect(MX, Y, CW, TH).fill("#222222");
            doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold");
            doc.text("Código", c.cod.x + 4, Y + 7, { width: c.cod.w - 4, lineBreak: false });
            doc.text("Descripción", c.desc.x + 4, Y + 7, { width: c.desc.w - 4, lineBreak: false });
            doc.text("Barbero", c.barb.x + 4, Y + 7, { width: c.barb.w - 4, align: "center", lineBreak: false });
            doc.text("Fecha turno", c.fecha.x + 4, Y + 7, { width: c.fecha.w - 4, align: "center", lineBreak: false });
            doc.text("Importe", c.imp.x + 4, Y + 7, { width: c.imp.w - 8, align: "right", lineBreak: false });
            Y += TH;

            const ROW_H = 34;
            doc.rect(MX, Y, CW, ROW_H).fill("#f9f9f9").stroke("#e0e0e0");
            const rowTextY = Y + Math.floor((ROW_H - 11) / 2);
            doc.fillColor("#333333").fontSize(9).font("Helvetica");
            doc.text(data.codTurno, c.cod.x + 4, rowTextY, { width: c.cod.w - 4, lineBreak: false });
            doc.text(data.servicio, c.desc.x + 4, rowTextY, { width: c.desc.w - 4, lineBreak: false });
            doc.text(data.barberoNombre, c.barb.x + 4, rowTextY, { width: c.barb.w - 4, align: "center", lineBreak: false });
            doc.text(data.fechaTurno, c.fecha.x + 4, rowTextY, { width: c.fecha.w - 4, align: "center", lineBreak: false });
            doc.font("Helvetica-Bold")
                .text(`$ ${data.importeTotal.toFixed(2)}`, c.imp.x + 4, rowTextY, { width: c.imp.w - 8, align: "right", lineBreak: false });
            Y += ROW_H;

            doc.rect(MX, Y, CW, 1).fill("#cccccc");
            Y += 16;

            // ════════════════════════════════════════════════════
            // BLOQUE 4 — TOTALES
            // ════════════════════════════════════════════════════
            const TOT_W = 210;
            const TOT_X = MX + CW - TOT_W;
            const TOT_ROW = 22;

            doc.rect(TOT_X, Y, TOT_W, TOT_ROW).fill("#f0f0f0").stroke("#dddddd");
            doc.fillColor("#444444").fontSize(8).font("Helvetica")
                .text("Neto Gravado:", TOT_X + 8, Y + 7, { width: 115, lineBreak: false });
            doc.font("Helvetica-Bold")
                .text(`$ ${data.importeNeto.toFixed(2)}`, TOT_X + 8, Y + 7, { width: TOT_W - 16, align: "right", lineBreak: false });
            Y += TOT_ROW;

            doc.rect(TOT_X, Y, TOT_W, TOT_ROW).fill("#e8e8e8").stroke("#dddddd");
            doc.fillColor("#444444").fontSize(8).font("Helvetica")
                .text("IVA 21%:", TOT_X + 8, Y + 7, { width: 115, lineBreak: false });
            doc.font("Helvetica-Bold")
                .text(`$ ${data.importeIVA.toFixed(2)}`, TOT_X + 8, Y + 7, { width: TOT_W - 16, align: "right", lineBreak: false });
            Y += TOT_ROW;

            const TOT_FINAL = 30;
            doc.rect(TOT_X, Y, TOT_W, TOT_FINAL).fill("#111111");
            doc.fillColor("#ffffff").fontSize(12).font("Helvetica-Bold")
                .text("TOTAL:", TOT_X + 8, Y + 9, { width: 100, lineBreak: false });
            doc.text(`$ ${data.importeTotal.toFixed(2)}`, TOT_X + 8, Y + 9, { width: TOT_W - 16, align: "right", lineBreak: false });
            Y += TOT_FINAL + 22;

            // ════════════════════════════════════════════════════
            // BLOQUE 5 — DATOS FISCALES / CAE (si existen)
            // ════════════════════════════════════════════════════
            if (hasFiscalData) {
                doc.rect(MX, Y, CW, 1).fill("#bbbbbb");
                Y += 12;

                const leftRows: Array<{ label: string; value: string }> = [];
                const rightRows: Array<{ label: string; value: string }> = [];

                if (hasTipoComprobante && data.tipoComprobante != null)
                    leftRows.push({ label: "Tipo:", value: voucherTypeName(data.tipoComprobante) });
                if (hasVoucherNumber && data.voucherNumber != null) {
                    const ptoVta = data.puntoDeVenta || AFIP_PUNTO_VENTA;
                    leftRows.push({ label: "N° comp.:", value: formatVoucherNumber(ptoVta, data.voucherNumber) });
                }
                if (hasCae && data.cae)
                    rightRows.push({ label: "CAE N°:", value: data.cae });
                if (data.caeFchVto)
                    rightRows.push({ label: "Vto. CAE:", value: formatAfipDate(data.caeFchVto) });

                const maxRows = Math.max(leftRows.length, rightRows.length, 1);
                const CAE_H = 32 + maxRows * 18;

                doc.rect(MX, Y, CW, CAE_H).lineWidth(1).stroke("#999999");
                doc.fillColor("#111111").fontSize(9).font("Helvetica-Bold")
                    .text("Comprobante Autorizado por ARCA", MX, Y + 10, { width: CW, align: "center", lineBreak: false });

                const rowStartY = Y + 26;
                doc.fontSize(8);

                leftRows.forEach((row, i) => {
                    const ry = rowStartY + i * 18;
                    doc.fillColor("#555555").font("Helvetica")
                        .text(row.label, MX + 10, ry, { lineBreak: false });
                    doc.fillColor("#111111").font("Helvetica-Bold")
                        .text(row.value, MX + 70, ry, { width: HALF - MX - 80, lineBreak: false });
                });

                rightRows.forEach((row, i) => {
                    const ry = rowStartY + i * 18;
                    doc.fillColor("#555555").font("Helvetica")
                        .text(row.label, HALF + 10, ry, { lineBreak: false });
                    doc.fillColor("#111111").font("Helvetica-Bold")
                        .text(row.value, HALF + 70, ry, { width: PW - HALF - 70 - MX, lineBreak: false });
                });

                if (leftRows.length > 0 || rightRows.length > 0) {
                    doc.strokeColor("#cccccc").lineWidth(0.5)
                        .moveTo(HALF, Y + 20).lineTo(HALF, Y + CAE_H - 6).stroke();
                }

                Y += CAE_H + 12;
            }

            // ════════════════════════════════════════════════════
            // PIE DE PÁGINA
            // ════════════════════════════════════════════════════
            doc.rect(0, doc.page.height - 36, PW, 36).fill("#222222");
            const footerText = hasCae
                ? "Comprobante electrónico generado por sistema. Válido como factura electrónica según RG ARCA."
                : "Recibo generado por sistema. Este documento no constituye factura electrónica.";
            doc.fontSize(7).fillColor("#aaaaaa").font("Helvetica")
                .text(footerText, MX, doc.page.height - 22, { width: CW, align: "center", lineBreak: false });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}
