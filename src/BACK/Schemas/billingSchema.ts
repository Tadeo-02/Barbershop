import { z } from "zod";

// Schema para crear un comprobante (factura) desde el frontend o al completar un turno
export const CreateVoucherSchema = z.object({
  // Punto de venta (default del env)
  puntoDeVenta: z.number().int().positive().optional(),

  // Tipo de comprobante (6=Factura B por defecto para consumidor final)
  tipoComprobante: z.number().int().positive().default(6),

  // Concepto: 1=Productos, 2=Servicios, 3=Ambos
  concepto: z.number().int().min(1).max(3).default(2), // Servicios por defecto (barbería)

  // Documento del comprador
  tipoDocumento: z.number().int().default(99), // 99 = Consumidor final
  numeroDocumento: z.number().int().default(0), // 0 = Consumidor final

  // Importes
  importeTotal: z.number().positive("El importe total debe ser mayor a 0"),
  importeNetoGravado: z.number().min(0).default(0),
  importeNetoNoGravado: z.number().min(0).default(0),
  importeExento: z.number().min(0).default(0),
  importeIVA: z.number().min(0).default(0),
  importeTributos: z.number().min(0).default(0),

  // Moneda
  moneda: z.string().default("PES"), // PES = Pesos Argentinos
  cotizacionMoneda: z.number().default(1),

  // Condición IVA del receptor
  condicionIVAReceptor: z.number().int().default(5), // 5 = Consumidor Final

  // Alícuotas de IVA (opcional)
  iva: z
    .array(
      z.object({
        id: z.number().int(), // ID del tipo de IVA (5 = 21%)
        baseImponible: z.number().min(0),
        importe: z.number().min(0),
      }),
    )
    .optional(),

  // Relación con turno (opcional, para facturación automática)
  codTurno: z.string().uuid().optional(),
});

// Schema simplificado para facturar un turno completado
export const BillAppointmentSchema = z.object({
  codTurno: z.string().uuid("ID de turno inválido"),
  // Opcionales: si no se envían, se calculan del turno
  tipoComprobante: z.number().int().positive().default(6),
  tipoDocumento: z.number().int().default(99),
  numeroDocumento: z.number().int().default(0),
  condicionIVAReceptor: z.number().int().default(5),
});

// Schema para consultar un comprobante
export const GetVoucherSchema = z.object({
  numeroComprobante: z.number().int().positive(),
  puntoDeVenta: z.number().int().positive().optional(),
  tipoComprobante: z.number().int().positive().default(6),
});

// Response types
export const VoucherResponseSchema = z.object({
  CAE: z.string(),
  CAEFchVto: z.string(),
  voucher_number: z.number().optional(),
});

export type CreateVoucherInput = z.infer<typeof CreateVoucherSchema>;
export type BillAppointmentInput = z.infer<typeof BillAppointmentSchema>;
export type GetVoucherInput = z.infer<typeof GetVoucherSchema>;
export type VoucherResponse = z.infer<typeof VoucherResponseSchema>;
