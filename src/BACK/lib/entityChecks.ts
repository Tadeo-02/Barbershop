import { DatabaseError } from "../base/Base";

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
