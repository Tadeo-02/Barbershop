export type UserRole = "client" | "barber" | "admin";

export const ROLE_VALUES: readonly UserRole[] = ["client", "barber", "admin"];

export function deriveRole(cuil: string | null | undefined): UserRole {
  return cuil === "1" ? "admin" : cuil ? "barber" : "client";
}
