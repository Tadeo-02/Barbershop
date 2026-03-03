import { describe, it, expect, beforeAll } from "vitest";
import { z } from "zod";
import { applyZodErrorMap } from "../../src/FRONT/views/lib/zodErrorMap.ts";

beforeAll(() => {
  applyZodErrorMap();
});

const parse = <T>(schema: z.ZodType<T>, value: unknown): string[] => {
  const result = schema.safeParse(value);
  if (!result.success) {
    return result.error.issues.map((e) => e.message);
  }
  return [];
};

describe("zodErrorMap — invalid_type", () => {
  it("returns 'Campo requerido' for undefined input on a string schema", () => {
    const schema = z.string();
    const errors = parse(schema, undefined);
    expect(errors).toContain("Campo requerido");
  });

  it("returns 'Campo requerido' for null input on a string schema", () => {
    const schema = z.string();
    const errors = parse(schema, null);
    expect(errors).toContain("Campo requerido");
  });

  it("returns 'Debe ser un numero' when a number is expected", () => {
    const schema = z.object({ age: z.number() });
    const result = schema.safeParse({ age: "notanumber" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Debe ser un numero");
    }
  });

  it("returns 'Debe ser un texto' when a string is expected but gets a number", () => {
    const schema = z.object({ name: z.string() });
    const result = schema.safeParse({ name: 42 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Debe ser un texto");
    }
  });
});

describe("zodErrorMap — too_small", () => {
  it("returns 'Campo requerido' when string min is 1 and input is empty", () => {
    const schema = z.string().min(1);
    const errors = parse(schema, "");
    expect(errors).toContain("Campo requerido");
  });

  it("returns 'Debe tener al menos N caracteres' for a longer min", () => {
    const schema = z.string().min(5);
    const errors = parse(schema, "ab");
    expect(errors).toContain("Debe tener al menos 5 caracteres");
  });

  it("returns appropriate message for number too_small (inclusive)", () => {
    const schema = z.number().min(10);
    const errors = parse(schema, 5);
    expect(errors).toContain("Debe ser mayor o igual a 10");
  });

  it("returns appropriate message for array too_small", () => {
    const schema = z.array(z.string()).min(2);
    const errors = parse(schema, ["one"]);
    expect(errors).toContain("Debe tener al menos 2 elementos");
  });
});

describe("zodErrorMap — too_big", () => {
  it("returns 'Debe tener como maximo N caracteres' for string too_big", () => {
    const schema = z.string().max(5);
    const errors = parse(schema, "toolongstring");
    expect(errors).toContain("Debe tener como maximo 5 caracteres");
  });

  it("returns appropriate message for number too_big (inclusive)", () => {
    const schema = z.number().max(100);
    const errors = parse(schema, 200);
    expect(errors).toContain("Debe ser menor o igual a 100");
  });
});

describe("zodErrorMap — invalid_format", () => {
  it("returns 'Correo invalido' for an invalid email", () => {
    const schema = z.string().email();
    const errors = parse(schema, "notanemail");
    expect(errors).toContain("Correo invalido");
  });

  it("returns 'UUID invalido' for an invalid UUID", () => {
    const schema = z.string().uuid();
    const errors = parse(schema, "not-a-uuid");
    expect(errors).toContain("UUID invalido");
  });

  it("returns 'URL invalida' for an invalid URL", () => {
    const schema = z.string().url();
    const errors = parse(schema, "just-text");
    expect(errors).toContain("URL invalida");
  });
});

describe("zodErrorMap — invalid_value (enum)", () => {
  it("returns 'Valor invalido' for a value not in the enum", () => {
    const schema = z.enum(["a", "b", "c"]);
    const errors = parse(schema, "d");
    expect(errors).toContain("Valor invalido");
  });
});
