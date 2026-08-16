import { DatabaseError } from "../base/Base";

export const assertNoPendingAppointments = (
  pendingCount: number,
  message: string,
): void => {
  if (pendingCount > 0) {
    throw new DatabaseError(message);
  }
};
