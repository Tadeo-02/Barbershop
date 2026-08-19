import { describe, expect, it } from "vitest";
import { parseBackendResponse } from "../../src/FRONT/views/lib/backendResponse";

describe("frontend backend response parser", () => {
  it("reads and parses a successful JSON response", async () => {
    const response = new Response(JSON.stringify({ success: true, message: "OK", data: { id: 1 } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

    const parsed = await parseBackendResponse(response);

    expect(parsed.ok).toBe(true);
    expect(parsed.status).toBe(200);
    expect(parsed.data).toEqual({ id: 1 });
    expect(parsed.message).toBe("OK");
  });

  it("returns a validation message when the payload is invalid JSON", async () => {
    const response = new Response("not-json", { status: 500 });

    const parsed = await parseBackendResponse(response, {
      invalidJsonMessage: "Respuesta inválida del servidor",
      emptyResponseMessage: "El servidor no devolvió respuesta.",
    });

    expect(parsed.ok).toBe(false);
    expect(parsed.message).toBe("Respuesta inválida del servidor");
    expect(parsed.data).toBeNull();
  });

  it("handles empty responses gracefully", async () => {
    const response = new Response("", { status: 200 });

    const parsed = await parseBackendResponse(response, {
      emptyResponseMessage: "Sin contenido",
    });

    expect(parsed.ok).toBe(true);
    expect(parsed.data).toBeNull();
    expect(parsed.message).toBe("Sin contenido");
  });
});
