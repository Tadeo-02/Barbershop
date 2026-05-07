import { describe, it, expect } from "vitest";
import {
  UserSchema,
  BarberResponseSchema,
  PASSWORD_REGEX,
} from "../../src/BACK/Schemas/usersSchema.ts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const messages = (result: ReturnType<typeof UserSchema.safeParse>) =>
  result.success ? [] : result.error.issues.map((i) => i.message);

const validUser = {
  dni: "12345678",
  nombre: "Juan",
  apellido: "Pérez",
  telefono: "1234-5678",
  email: "juan@example.com",
  contraseña: "StrongPass1!",
};

// ─── PASSWORD_REGEX ───────────────────────────────────────────────────────────

describe("PASSWORD_REGEX", () => {
  it("passes when all four character classes are present", () => {
    expect(PASSWORD_REGEX.test("StrongPass1!")).toBe(true);
  });

  it("fails when there is no lowercase letter", () => {
    expect(PASSWORD_REGEX.test("STRONGPASS1!")).toBe(false);
  });

  it("fails when there is no uppercase letter", () => {
    expect(PASSWORD_REGEX.test("strongpass1!")).toBe(false);
  });

  it("fails when there is no digit", () => {
    expect(PASSWORD_REGEX.test("StrongPass!!")).toBe(false);
  });

  it("fails when there is no symbol", () => {
    expect(PASSWORD_REGEX.test("StrongPass11")).toBe(false);
  });
});

// ─── UserSchema — field validation ───────────────────────────────────────────

describe("UserSchema — DNI", () => {
  it("rejects empty DNI", () => {
    const result = UserSchema.safeParse({ ...validUser, dni: "" });
    expect(messages(result)).toContain("DNI es requerido");
  });

  it("rejects a DNI with fewer than 8 digits", () => {
    const result = UserSchema.safeParse({ ...validUser, dni: "1234567" });
    expect(messages(result)).toContain("DNI inválido. Debe tener 8 dígitos");
  });

  it("rejects a DNI with more than 8 digits", () => {
    const result = UserSchema.safeParse({ ...validUser, dni: "123456789" });
    expect(messages(result)).toContain("DNI inválido. Debe tener 8 dígitos");
  });

  it("rejects a DNI with non-numeric characters", () => {
    const result = UserSchema.safeParse({ ...validUser, dni: "1234567A" });
    expect(messages(result)).toContain("DNI inválido. Debe tener 8 dígitos");
  });

  it("accepts a valid 8-digit DNI", () => {
    const result = UserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });
});

describe("UserSchema — nombre / apellido", () => {
  it("rejects a nombre shorter than 2 characters", () => {
    const result = UserSchema.safeParse({ ...validUser, nombre: "J" });
    expect(messages(result)).toContain(
      "Nombre debe tener al menos 2 caracteres",
    );
  });

  it("rejects a nombre longer than 50 characters", () => {
    const result = UserSchema.safeParse({
      ...validUser,
      nombre: "A".repeat(51),
    });
    expect(messages(result)).toContain(
      "Nombre no puede tener más de 50 caracteres",
    );
  });

  it("rejects a nombre with numbers", () => {
    const result = UserSchema.safeParse({ ...validUser, nombre: "Juan123" });
    expect(messages(result)).toContain("Nombre solo puede contener letras");
  });

  it("accepts a nombre with accented characters", () => {
    const result = UserSchema.safeParse({ ...validUser, nombre: "Sofía" });
    expect(result.success).toBe(true);
  });

  it("rejects an apellido shorter than 2 characters", () => {
    const result = UserSchema.safeParse({ ...validUser, apellido: "P" });
    expect(messages(result)).toContain(
      "Apellido debe tener al menos 2 caracteres",
    );
  });

  it("accepts an apellido with ñ", () => {
    const result = UserSchema.safeParse({ ...validUser, apellido: "Muñoz" });
    expect(result.success).toBe(true);
  });
});

describe("UserSchema — email", () => {
  it("rejects an invalid email", () => {
    const result = UserSchema.safeParse({ ...validUser, email: "notanemail" });
    expect(messages(result)).toContain("Email inválido");
  });

  it("accepts a valid email", () => {
    const result = UserSchema.safeParse({
      ...validUser,
      email: "valid@mail.com",
    });
    expect(result.success).toBe(true);
  });
});

describe("UserSchema — telefono", () => {
  const validPhones = [
    "1234-5678",
    "11 1234-5678",
    "+54 11 1234-5678",
    "+541112345678",
    "(011) 1234-5678",
  ];

  validPhones.forEach((phone) => {
    it(`accepts "${phone}"`, () => {
      const result = UserSchema.safeParse({ ...validUser, telefono: phone });
      expect(result.success).toBe(true);
    });
  });

  it("rejects a completely invalid phone", () => {
    const result = UserSchema.safeParse({ ...validUser, telefono: "abc" });
    expect(messages(result)).toContain(
      "Teléfono inválido. Formato esperado: +54 11 1234-5678",
    );
  });
});

describe("UserSchema — contraseña", () => {
  it("rejects a password shorter than 10 characters", () => {
    const result = UserSchema.safeParse({ ...validUser, contraseña: "Ab1!" });
    expect(result.success).toBe(false);
  });

  it("rejects a password without mixed character types", () => {
    const result = UserSchema.safeParse({
      ...validUser,
      contraseña: "alllowercase1!",
    });
    expect(messages(result)).toContain(
      "La contraseña debe incluir minúsculas, mayúsculas, números y símbolos",
    );
  });

  it("accepts a strong password", () => {
    const result = UserSchema.safeParse({
      ...validUser,
      contraseña: "StrongPass1!",
    });
    expect(result.success).toBe(true);
  });
});

// ─── UserSchema — CUIL cross-field refinements ───────────────────────────────

describe("UserSchema — CUIL refinements", () => {
  it("passes when no CUIL is provided", () => {
    const result = UserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it("rejects a CUIL with an invalid format", () => {
    const result = UserSchema.safeParse({
      ...validUser,
      cuil: "20123456781",
    });
    expect(messages(result)).toContain(
      "CUIL inválido. Formato requerido: XX-XXXXXXXX-X",
    );
  });

  it("rejects a CUIL whose middle digits do not match the DNI", () => {
    const result = UserSchema.safeParse({
      ...validUser,
      dni: "12345678",
      cuil: "20-99999999-5", // DNI digits don't match
    });
    expect(messages(result)).toContain(
      "El DNI en el CUIL no coincide con el DNI proporcionado",
    );
  });

  it("accepts a CUIL whose middle digits match the DNI", () => {
    const result = UserSchema.safeParse({
      ...validUser,
      dni: "12345678",
      cuil: "20-12345678-5",
    });
    expect(result.success).toBe(true);
  });
});

// ─── BarberResponseSchema — `activo` transform ───────────────────────────────

describe("BarberResponseSchema — activo transform", () => {
  const baseBarber = {
    codUsuario: "BAR-001",
    dni: "12345678",
    nombre: "Carlos",
    apellido: "López",
    telefono: "1234-5678",
    email: "carlos@shop.com",
    cuil: null,
  };

  it("transforms 1 (number) to true", () => {
    const result = BarberResponseSchema.safeParse({
      ...baseBarber,
      activo: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.activo).toBe(true);
  });

  it("transforms 0 (number) to false", () => {
    const result = BarberResponseSchema.safeParse({
      ...baseBarber,
      activo: 0,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.activo).toBe(false);
  });

  it("keeps true as true", () => {
    const result = BarberResponseSchema.safeParse({
      ...baseBarber,
      activo: true,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.activo).toBe(true);
  });

  it("keeps false as false", () => {
    const result = BarberResponseSchema.safeParse({
      ...baseBarber,
      activo: false,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.activo).toBe(false);
  });

  it("allows extra fields via passthrough()", () => {
    const result = BarberResponseSchema.safeParse({
      ...baseBarber,
      activo: 1,
      extraField: "unexpected",
    });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).extraField).toBe(
        "unexpected",
      );
  });
});
