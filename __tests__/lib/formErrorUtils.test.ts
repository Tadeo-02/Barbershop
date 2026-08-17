import { describe, expect, it } from "vitest";
import {
  extractMessageValue,
  normalizeFormErrors,
  normalizeMessage,
} from "../../src/FRONT/views/lib/formErrorUtils";

describe("normalizeMessage", () => {
  it("trims and keeps a valid message", () => {
    expect(normalizeMessage("  Nombre requerido  ")).toBe("Nombre requerido");
  });

  it("returns undefined for empty or invalid values", () => {
    expect(normalizeMessage("   ")).toBeUndefined();
    expect(normalizeMessage(123 as unknown)).toBeUndefined();
  });
});

describe("extractMessageValue", () => {
  it("returns a cleaned message when the payload exposes one", () => {
    expect(extractMessageValue({ message: "  Error de validación  " })).toBe(
      "Error de validación",
    );
    expect(extractMessageValue({ message: "   " })).toBeUndefined();
    expect(extractMessageValue({})).toBeUndefined();
    expect(extractMessageValue(null)).toBeUndefined();
    expect(extractMessageValue(123 as unknown)).toBeUndefined();
  });
});

describe("normalizeFormErrors", () => {
  it("normalizes every message in the error map without mutating empty strings", () => {
    const result = {
      errors: {
        nombreCategoria: { message: "   Nombre requerido   " },
        descCategoria: { message: "" },
        descuentoCorte: { message: "  5  " },
      },
    };

    const normalized = normalizeFormErrors(result);

    expect(normalized?.errors?.nombreCategoria?.message).toBe("Nombre requerido");
    expect(normalized?.errors?.descCategoria?.message).toBe("");
    expect(normalized?.errors?.descuentoCorte?.message).toBe("5");
  });
});
