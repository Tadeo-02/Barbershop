import { describe, it, expect } from "vitest";
import {
  AppointmentSchema,
  AppointmentResponseSchema,
} from "../../src/BACK/Schemas/appointmentsSchema.ts";

const messages = (result: ReturnType<typeof AppointmentSchema.safeParse>) =>
  result.success ? [] : result.error.issues.map((i) => i.message);

const validAppointment = {
  codCliente: "CLI-001",
  codBarbero: "BAR-001",
  fechaTurno: "2026-03-15",
  horaDesde: "09:00",
  horaHasta: "09:30",
  estado: "pendiente",
};

// ─── Required fields ──────────────────────────────────────────────────────────

describe("AppointmentSchema — required fields", () => {
  it("accepts a minimal valid appointment", () => {
    const result = AppointmentSchema.safeParse(validAppointment);
    expect(result.success).toBe(true);
  });

  it("rejects when codCliente is missing", () => {
    const { codCliente: _, ...rest } = validAppointment;
    const result = AppointmentSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects when codBarbero is missing", () => {
    const { codBarbero: _, ...rest } = validAppointment;
    const result = AppointmentSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects when fechaTurno is missing", () => {
    const { fechaTurno: _, ...rest } = validAppointment;
    const result = AppointmentSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects when horaDesde is missing", () => {
    const { horaDesde: _, ...rest } = validAppointment;
    const result = AppointmentSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects when horaHasta is missing", () => {
    const { horaHasta: _, ...rest } = validAppointment;
    const result = AppointmentSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects when estado is missing", () => {
    const { estado: _, ...rest } = validAppointment;
    const result = AppointmentSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

// ─── fechaTurno / fechaCancelacion — date format ──────────────────────────────

describe("AppointmentSchema — date format (YYYY-MM-DD)", () => {
  const invalidDates = ["15-03-2026", "2026/03/15", "20260315", "notadate"];

  invalidDates.forEach((date) => {
    it(`rejects fechaTurno "${date}"`, () => {
      const result = AppointmentSchema.safeParse({
        ...validAppointment,
        fechaTurno: date,
      });
      expect(messages(result)).toContain("Fecha inválida. Formato YYYY-MM-DD");
    });
  });

  it("accepts a valid fechaTurno", () => {
    const result = AppointmentSchema.safeParse(validAppointment);
    expect(result.success).toBe(true);
  });

  it("rejects an invalid optional fechaCancelacion", () => {
    const result = AppointmentSchema.safeParse({
      ...validAppointment,
      fechaCancelacion: "31/12/2026",
    });
    expect(messages(result)).toContain("Fecha inválida. Formato YYYY-MM-DD");
  });

  it("accepts a valid optional fechaCancelacion", () => {
    const result = AppointmentSchema.safeParse({
      ...validAppointment,
      fechaCancelacion: "2026-03-20",
    });
    expect(result.success).toBe(true);
  });
});

// ─── horaDesde / horaHasta — time format ─────────────────────────────────────

describe("AppointmentSchema — time format (HH:MM)", () => {
  const invalidTimes = ["9:00", "09:0", "0900", "9am"];

  invalidTimes.forEach((time) => {
    it(`rejects horaDesde "${time}"`, () => {
      const result = AppointmentSchema.safeParse({
        ...validAppointment,
        horaDesde: time,
      });
      expect(messages(result)).toContain("Hora inválida. Formato HH:MM");
    });
  });

  it("accepts horaDesde 00:00", () => {
    const result = AppointmentSchema.safeParse({
      ...validAppointment,
      horaDesde: "00:00",
    });
    expect(result.success).toBe(true);
  });

  it("accepts horaHasta 23:59", () => {
    const result = AppointmentSchema.safeParse({
      ...validAppointment,
      horaHasta: "23:59",
    });
    expect(result.success).toBe(true);
  });
});

// ─── precioTurno — optional numeric-string ───────────────────────────────────

describe("AppointmentSchema — precioTurno", () => {
  it("accepts a whole-number price", () => {
    const result = AppointmentSchema.safeParse({
      ...validAppointment,
      precioTurno: "1500",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a price with up to 2 decimal places", () => {
    const result = AppointmentSchema.safeParse({
      ...validAppointment,
      precioTurno: "1500.50",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a price with more than 2 decimal places", () => {
    const result = AppointmentSchema.safeParse({
      ...validAppointment,
      precioTurno: "1500.123",
    });
    expect(messages(result)).toContain(
      "Precio inválido. Formato numérico con hasta 2 decimales",
    );
  });

  it("rejects a non-numeric price", () => {
    const result = AppointmentSchema.safeParse({
      ...validAppointment,
      precioTurno: "free",
    });
    expect(messages(result)).toContain(
      "Precio inválido. Formato numérico con hasta 2 decimales",
    );
  });

  it("is omittable (optional field)", () => {
    const result = AppointmentSchema.safeParse(validAppointment);
    expect(result.success).toBe(true);
  });
});

// ─── codTurno — optional UUID ────────────────────────────────────────────────

describe("AppointmentSchema — codTurno", () => {
  it("accepts a valid UUID", () => {
    const result = AppointmentSchema.safeParse({
      ...validAppointment,
      codTurno: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid UUID", () => {
    const result = AppointmentSchema.safeParse({
      ...validAppointment,
      codTurno: "not-a-uuid",
    });
    expect(messages(result)).toContain("ID de turno inválido");
  });
});

// ─── AppointmentResponseSchema ────────────────────────────────────────────────

describe("AppointmentResponseSchema", () => {
  it("requires codTurno (no longer optional)", () => {
    const result = AppointmentResponseSchema.safeParse(validAppointment);
    expect(result.success).toBe(false);
  });

  it("accepts when codTurno is provided as any non-empty string", () => {
    const result = AppointmentResponseSchema.safeParse({
      ...validAppointment,
      codTurno: "db-generated-id",
    });
    expect(result.success).toBe(true);
  });
});
