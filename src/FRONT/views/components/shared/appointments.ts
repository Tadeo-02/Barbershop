import type {
  AppointmentFull,
  AppointmentDateLike,
} from "../../../types/appointment";

export type { AppointmentFull, AppointmentDateLike };

export const unwrapAppointments = <T>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "data" in data) {
    const nested = (data as { data?: unknown }).data;
    if (Array.isArray(nested)) return nested as T[];
  }
  return [];
};

export const buildTurnoDateTime = (
  fechaTurno: string,
  horaDesde: string,
): Date | null => {
  const datePart = fechaTurno.split("T")[0];
  const [year, month, day] = datePart.split("-").map((value) => Number(value));
  const startTime = new Date(horaDesde);

  if (!year || !month || !day || Number.isNaN(startTime.getTime())) {
    return null;
  }

  const hours = startTime.getUTCHours();
  const minutes = startTime.getUTCMinutes();
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

export const getTurnoDateTime = (
  turno: AppointmentDateLike,
): Date | null => buildTurnoDateTime(turno.fechaTurno, turno.horaDesde);

export const sortTurnosByDateTime = <T extends AppointmentDateLike>(
  left: T,
  right: T,
  direction: "asc" | "desc" = "asc",
): number => {
  const leftDate = buildTurnoDateTime(left.fechaTurno, left.horaDesde);
  const rightDate = buildTurnoDateTime(right.fechaTurno, right.horaDesde);

  if (!leftDate && !rightDate) return 0;
  if (!leftDate) return direction === "asc" ? 1 : -1;
  if (!rightDate) return direction === "asc" ? -1 : 1;

  return direction === "asc"
    ? leftDate.getTime() - rightDate.getTime()
    : rightDate.getTime() - leftDate.getTime();
};
export const formatDate = (dateString: string): string => {
  const [year, month, day] = dateString.split("T")[0].split("-");
  return `${day}/${month}/${year}`;
};

export const formatTime = (timeString: string): string => {
  const date = new Date(timeString);
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};
