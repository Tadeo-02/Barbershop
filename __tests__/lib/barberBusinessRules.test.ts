import { describe, expect, it } from "vitest";
import { DatabaseError } from "../../src/BACK/base/Base";
import { assertNoPendingAppointments } from "../../src/BACK/lib/barberBusinessRules";

describe("barber business rules", () => {
  it("allows the operation when there are no pending appointments", () => {
    expect(() => assertNoPendingAppointments(0, "No se puede cambiar de sucursal")).not.toThrow();
  });

  it("throws when the barber still has pending appointments", () => {
    expect(() => assertNoPendingAppointments(2, "No se puede cambiar de sucursal")).toThrow(DatabaseError);
    expect(() => assertNoPendingAppointments(2, "No se puede cambiar de sucursal")).toThrow(
      "No se puede cambiar de sucursal",
    );
  });
});
