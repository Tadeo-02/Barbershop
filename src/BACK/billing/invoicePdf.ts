import { prisma, DatabaseError } from '../base/Base';
import { AFIP_PUNTO_VENTA, VOUCHER_TYPES } from './afipConfig';
import { getVoucherInfo } from './Billing';
import {
  InvoicePdfData,
  generateInvoicePdf,
} from './pdfTemplates/invoiceTemplate';
import {
  ReceiptPdfData,
  generateReceiptPdf,
} from './pdfTemplates/receiptTemplate';

// ============================================================
// Re-exportar templates para que otros modulos importen desde aqui
// ============================================================
export { generateInvoicePdf, generateReceiptPdf };
export type { InvoicePdfData, ReceiptPdfData };

// ============================================================
// Recopiladores de datos (acceso a DB)
// ============================================================

/**
 * Recopilar todos los datos para el PDF a partir de codTurno + datos ARCA.
 */
export async function gatherInvoiceData(
  codTurno: string,
  voucherNumber: number,
  puntoDeVenta: number = AFIP_PUNTO_VENTA,
  tipoComprobante: number = VOUCHER_TYPES.FACTURA_B,
): Promise<InvoicePdfData> {
  const voucherInfo = await getVoucherInfo(
    voucherNumber,
    puntoDeVenta,
    tipoComprobante,
  );
  if (!voucherInfo) {
    throw new DatabaseError(
      'Comprobante no encontrado en ARCA',
      'VOUCHER_NOT_FOUND',
    );
  }

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
    throw new DatabaseError('Turno no encontrado', 'APPOINTMENT_NOT_FOUND');
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
    cae: String(
      turno.cae || voucherInfo.CodAutorizacion || voucherInfo.CAE || '',
    ),
    caeFchVto: String(
      turno.caeFchVto || voucherInfo.FchVto || voucherInfo.CAEFchVto || '',
    ),
    voucherNumber,
    puntoDeVenta,
    tipoComprobante,
    fechaEmision: String(voucherInfo.CbteFch || ''),
    importeTotal,
    importeNeto,
    importeIVA,
    codTurno,
    servicio: turno.tipos_corte?.nombreCorte || 'Servicio de barberia',
    fechaTurno: turno.fechaTurno.toISOString().split('T')[0],
    clienteNombre: `${cliente.nombre} ${cliente.apellido}`,
    clienteDni: cliente.dni,
    barberoNombre: `${barbero.nombre} ${barbero.apellido}`,
    sucursalNombre: sucursal?.nombre || "Barbería",
    sucursalDireccion: sucursal ? `${sucursal.calle} ${sucursal.altura}` : "",
  };
}

/**
 * Recopilar datos del recibo a partir del codTurno (solo DB, sin ARCA).
 */
export async function gatherReceiptData(
  codTurno: string,
): Promise<ReceiptPdfData> {
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
    throw new DatabaseError('Turno no encontrado', 'APPOINTMENT_NOT_FOUND');
  }

  if (turno.estado !== 'Cobrado') {
    throw new DatabaseError(
      'Solo se pueden generar recibos de turnos cobrados',
      'APPOINTMENT_NOT_CHARGED',
    );
  }

  const cliente = turno.usuarios_turnos_codClienteTousuarios;
  const barbero = turno.usuarios_turnos_codBarberoTousuarios;
  const sucursal = barbero.sucursales;

  const importeTotal = turno.precioTurno || turno.tipos_corte?.valorBase || 0;
  const importeNeto = Math.round((importeTotal / 1.21) * 100) / 100;
  const importeIVA = Math.round((importeTotal - importeNeto) * 100) / 100;

  const fechaEmision = new Date(
    Date.now() - new Date().getTimezoneOffset() * 60000,
  )
    .toISOString()
    .split('T')[0];

  return {
    codTurno,
    fechaEmision,
    importeTotal,
    importeNeto,
    importeIVA,
    servicio: turno.tipos_corte?.nombreCorte || 'Servicio de barberia',
    fechaTurno: turno.fechaTurno.toISOString().split('T')[0],
    clienteNombre: `${cliente.nombre} ${cliente.apellido}`,
    clienteDni: cliente.dni,
    barberoNombre: `${barbero.nombre} ${barbero.apellido}`,
    sucursalNombre: sucursal?.nombre || "Barbería",
    sucursalDireccion: sucursal ? `${sucursal.calle} ${sucursal.altura}` : "",
    cae: turno.cae,
    caeFchVto: turno.caeFchVto,
    voucherNumber: turno.voucherNumber,
    tipoComprobante: turno.tipoComprobante,
    puntoDeVenta: turno.puntoDeVenta,
  };
}