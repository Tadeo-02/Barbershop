import { DatabaseError } from "../base/Base";

export const hasValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
};

export const getMissingRequiredFields = <T extends Record<string, unknown>>(
  payload: T,
  requiredFields: readonly (keyof T & string)[],
): string[] =>
  requiredFields.filter(
    (field) => !hasValue(payload[field]),
  );

export const assertRequiredFields = <T extends Record<string, unknown>>(
  payload: T,
  requiredFields: readonly (keyof T & string)[],
  message = "Faltan campos requeridos",
): void => {
  const missingFields = getMissingRequiredFields(payload, requiredFields);

  if (missingFields.length > 0) {
    throw new Error(`${message}: ${missingFields.join(", ")}`);
  }
};

export const assertEntityExists = <T>(
  entity: T | null,
  entityName: string,
): asserts entity is T => {
  if (!entity) {
    throw new DatabaseError(`${entityName} no encontrado`);
  }
};

export const assertEntityExistsWithCode = <T>(
  entity: T | null,
  entityName: string,
  code?: string,
): asserts entity is T => {
  if (!entity) {
    const suffix = code ? ` con el código ${code}` : "";
    throw new DatabaseError(`${entityName}${suffix} no encontrado`);
  }
};
