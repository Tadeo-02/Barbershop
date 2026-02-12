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

export type Appointment = z.infer<typeof AppointmentSchema>;
export type AppointmentResponse = z.infer<typeof AppointmentResponseSchema>;
