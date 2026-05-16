export type DateLike = string | Date;

type DateParts = { date: string; time: string };

export const normalizeDateInput = (value: DateLike): Date => {
  if (value instanceof Date) return value;

  const trimmed = value.trim();
  if (trimmed.includes("T")) return new Date(trimmed);
  if (trimmed.includes(" ")) {
    return new Date(`${trimmed.replace(" ", "T")}Z`);
  }

  return new Date(trimmed);
};

export const getDateParts = (value: DateLike): DateParts => {
  const date = normalizeDateInput(value);
  const [datePart, timePart] = date.toISOString().split("T");
  const time = timePart.slice(0, 5);
  return { date: datePart, time };
};

export const formatDate = (value: DateLike): string => {
  const { date } = getDateParts(value);
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
};

export const formatTime = (value: DateLike): string => {
  const { time } = getDateParts(value);
  return time;
};

export const isAvailabilityEnded = (item: {
  fechaHoraHasta: DateLike;
}): boolean => normalizeDateInput(item.fechaHoraHasta).getTime() < Date.now();
