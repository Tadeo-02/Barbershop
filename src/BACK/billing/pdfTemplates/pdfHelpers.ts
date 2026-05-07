import { VOUCHER_TYPES } from "../afipConfig";

// ============================================================
// Helpers compartidos para la generación de PDFs
// ============================================================

/** Nombre legible del tipo de comprobante */
export function voucherTypeName(tipo: number): string {
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
export function formatCuit(cuit: number | string): string {
    const s = String(cuit);
    if (s.length === 11)
        return `${s.slice(0, 2)}-${s.slice(2, 10)}-${s.slice(10)}`;
    return s;
}

/** Formatear fecha yyyymmdd → dd/mm/yyyy */
export function formatAfipDate(d: string | number): string {
    const s = String(d);
    if (s.length === 8)
        return `${s.slice(6, 8)}/${s.slice(4, 6)}/${s.slice(0, 4)}`;
    return s;
}

/** Formatear número de comprobante como 0001-00000123 */
export function formatVoucherNumber(ptoVta: number, nro: number): string {
    return `${String(ptoVta).padStart(4, "0")}-${String(nro).padStart(8, "0")}`;
}

/** Dibuja una línea horizontal en la posición actual del cursor */
export function drawLine(doc: PDFKit.PDFDocument): void {
    const y = doc.y;
    doc
        .strokeColor("#cccccc")
        .lineWidth(0.5)
        .moveTo(50, y)
        .lineTo(doc.page.width - 50, y)
        .stroke()
        .strokeColor("#000000");
}

/** Encabezado de sección con fondo gris oscuro */
export function drawSectionHeader(
    doc: PDFKit.PDFDocument,
    title: string,
    x: number,
    y: number,
    width: number,
): void {
    doc.rect(x, y, width, 22).fill("#2d2d2d");
    doc
        .fillColor("#ffffff")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text(title, x + 8, y + 7, { width: width - 16 });
}

/** Fila etiqueta + valor */
export function drawLabelValue(
    doc: PDFKit.PDFDocument,
    label: string,
    value: string,
    x: number,
    y: number,
    width: number,
): void {
    doc
        .fillColor("#555555")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text(label, x + 8, y, { width: 100 });
    doc
        .fillColor("#000000")
        .fontSize(10)
        .font("Helvetica")
        .text(value, x + 115, y, { width: width - 123 });
}
