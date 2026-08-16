import { z } from "zod";

// Schema for creating an invoice from the frontend or when completing an appointment.
export const CreateVoucherSchema = z.object({
  // Point of sale (default from environment variables)
  puntoDeVenta: z.number().int().positive().optional(),

  // Invoice type (6 = Invoice B by default for final consumers)
  tipoComprobante: z.number().int().positive().default(6),

  // Concept: 1 = Products, 2 = Services, 3 = Both.
  concepto: z.number().int().min(1).max(3).default(2),// Default: services (barbershop)

  // Buyer's document.
  tipoDocumento: z.number().int().default(99), // 99 =  final consumer
  numeroDocumento: z.number().int().default(0), // 0 =  final consumer

  // amounts
  importeTotal: z.number().positive("El importe total debe ser mayor a 0"),
  importeNetoGravado: z.number().min(0).default(0),
  importeNetoNoGravado: z.number().min(0).default(0),
  importeExento: z.number().min(0).default(0),
  importeIVA: z.number().min(0).default(0),
  importeTributos: z.number().min(0).default(0),

  // Currency
  moneda: z.string().default("PES"), // PES = Pesos Argentinos
  cotizacionMoneda: z.number().default(1),

  // Recipient's IVA tax status.
  condicionIVAReceptor: z.number().int().default(5), // 5 =  Final Consumer

  // IVA rates (optional)
  iva: z
    .array(
      z.object({
        id: z.number().int(), // ID type of IVA (5 = 21%)
        baseImponible: z.number().min(0),
        importe: z.number().min(0),
      }),
    )
    .optional(),

  // relation with appointment (opcional, for automatic billing)
  codTurno: z.string().uuid().optional(),
});

// Simplified schema for invoicing a completed appointment.
export const BillAppointmentSchema = z.object({
  codTurno: z.string().uuid("ID de turno inválido"),
  // Optionals: if not provided, they are calculated from the appointment.
  tipoComprobante: z.number().int().positive().default(6),
  tipoDocumento: z.number().int().default(99),
  numeroDocumento: z.number().int().default(0),
  condicionIVAReceptor: z.number().int().default(5),
});

// Schema for retrieving an invoice.
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
  tipoComprobante: z.number().optional(),
  puntoDeVenta: z.number().optional(),
});

export type CreateVoucherInput = z.infer<typeof CreateVoucherSchema>;
export type BillAppointmentInput = z.infer<typeof BillAppointmentSchema>;
export type GetVoucherInput = z.infer<typeof GetVoucherSchema>;
export type VoucherResponse = z.infer<typeof VoucherResponseSchema>;
