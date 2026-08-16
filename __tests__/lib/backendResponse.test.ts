import { describe, expect, it } from "vitest";
import {
  createErrorResponse,
  createNotFoundResponse,
  createSuccessResponse,
  getErrorMessage,
} from "../../src/BACK/lib/backendResponse";

describe("backendResponse helper", () => {
  it("creates a success payload with message and data", () => {
    const payload = createSuccessResponse({ id: 7 }, "Usuario creado");

    expect(payload).toEqual({
      success: true,
      message: "Usuario creado",
      data: { id: 7 },
    });
  });

  it("creates a validation error payload", () => {
    const payload = createErrorResponse("Faltan datos", "validation_error");

    expect(payload).toEqual({
      success: false,
      message: "Faltan datos",
      type: "validation_error",
    });
  });

  it("creates a not found payload", () => {
    const payload = createNotFoundResponse("Usuario");

    expect(payload).toEqual({
      success: false,
      message: "Usuario no encontrado",
      type: "not_found",
    });
  });

  it("extracts the real error message or fallback", () => {
    expect(getErrorMessage(new Error("bad request"), "fallback")).toBe(
      "bad request",
    );
    expect(getErrorMessage("plain text", "fallback")).toBe("fallback");
  });
});
