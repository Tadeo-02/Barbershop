export class PendingAppointmentsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PendingAppointmentsError";
  }
}

export const assertNoPendingAppointments = (
  pendingCount: number,
  message: string,
): void => {
  if (pendingCount > 0) {
    throw new PendingAppointmentsError(message);
  }
};
