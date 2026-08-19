export type Rol = "admin" | "barber" | "client";

export function deriveRole(cuil: string | null | undefined): Rol {
  return cuil === "1" ? "admin" : cuil ? "barber" : "client";
}
