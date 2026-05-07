import { z } from "zod";

// Schema para creación/actualización de un turno (input desde frontend)
export const AppointmentSchema = z.object({
  codTurno: z.string().uuid("ID de turno inválido").optional(),
  codCorte: z.string().min(1, "Código de corte es requerido").optional(),
  codCliente: z.string().min(1, "Código de cliente es requerido"),
  codBarbero: z.string().min(1, "Código de barbero es requerido"),
  precioTurno: z
    .string()
    .min(1, "Precio es requerido")
    .regex(
      /^\d+(\.\d{1,2})?$/,
      "Precio inválido. Formato numérico con hasta 2 decimales",
    )
    .optional(),
  metodoPago: z
    .string()
    .min(1, "Método de pago es requerido")
    .max(50, "Método de pago no puede tener más de 50 caracteres")
    .optional(),
  fechaCancelacion: z
    .string()
    .min(1, "Fecha es requerida")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida. Formato YYYY-MM-DD")
    .optional(),
  fechaTurno: z
    .string()
    .min(1, "Fecha de turno es requerida")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida. Formato YYYY-MM-DD"),
  horaDesde: z
    .string()
    .min(1, "Hora desde es requerida")
    .regex(/^\d{2}:\d{2}$/, "Hora inválida. Formato HH:MM"),
  horaHasta: z
    .string()
    .min(1, "Hora hasta es requerida")
    .regex(/^\d{2}:\d{2}$/, "Hora inválida. Formato HH:MM"),
  estado: z
    .string()
    .min(1, "Estado es requerido")
    .max(50, "Estado no puede tener más de 50 caracteres"),
});

// Schema para respuestas (incluye el id generado por la DB)
export const AppointmentResponseSchema = AppointmentSchema.extend({
  codTurno: z.string(),
});

const AppointmentOutputBaseSchema = z
  .object({
    codTurno: z.string(),
    codCorte: z.string().nullable().optional(),
    codCliente: z.string(),
    codBarbero: z.string(),
    precioTurno: z.number().nullable().optional(),
    metodoPago: z.string().nullable().optional(),
    fechaCancelacion: z.union([z.string(), z.date()]).nullable().optional(),
    fechaTurno: z.union([z.string(), z.date()]),
    horaDesde: z.union([z.string(), z.date()]),
    horaHasta: z.union([z.string(), z.date()]),
    estado: z.string(),
  })
  .passthrough();

export const AppointmentOutputSchema = AppointmentOutputBaseSchema.pick({
  codTurno: true,
  codCorte: true,
  codCliente: true,
  codBarbero: true,
  precioTurno: true,
  metodoPago: true,
  fechaCancelacion: true,
  fechaTurno: true,
  horaDesde: true,
  horaHasta: true,
  estado: true,
}).passthrough();

const AvailableSlotBaseSchema = z.object({
  hora: z.string(),
});

export const AvailableSlotSchema = AvailableSlotBaseSchema.pick({
  hora: true,
});

export type Appointment = z.infer<typeof AppointmentSchema>;
export type AppointmentResponse = z.infer<typeof AppointmentResponseSchema>;
