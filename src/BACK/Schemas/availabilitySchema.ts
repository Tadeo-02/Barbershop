import { z } from "zod";

export const AvailabilitySchema = z.object({
  codBloqueo: z.string(),
  codBarbero: z.string().min(1, "Código de barbero es requerido"),
  fechaHoraDesde: z
    .string()
    .min(1, "Fecha y hora son requerida")
    .regex(
      /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) (?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/,
      "Fecha o hora inválida. Formato YYYY-MM-DD HH:MM:SS",
    ),
  fechaHoraHasta: z
    .string()
    .min(1, "Fecha y hora son requerida")
    .regex(
      /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) (?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/,
      "Fecha o hora inválida. Formato YYYY-MM-DD HH:MM:SS",
    ),
  motivo: z.string().max(250, "Motivo no puede tener más de 250 caracteres"),
});