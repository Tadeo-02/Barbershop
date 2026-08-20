export const MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

/** Convert ISO string  ("2026-08-19T...") to "DD/MM/AAAA". */
export const formatDate = (dateString: string): string => {
  const [year, month, day] = dateString.split("T")[0].split("-");
  return `${day}/${month}/${year}`;
};

/** Extract "HH:MM" (UTC) from string  */
export const formatTime = (timeString: string): string => {
  const date = new Date(timeString);
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

/** Info for "badge" of date used in the cards of the next appointment. */
export const getDateBadge = (
  dateString: string,
): { monthLabel: string; dayLabel: string; fullDate: string } => {
  const [year, month, day] = dateString.split("T")[0].split("-");
  const monthIndex = Number(month);
  const monthLabel =
    monthIndex >= 1 && monthIndex <= 12 ? MONTH_LABELS[monthIndex - 1] : "";
  const dayLabel = day ? String(Number(day)) : "";
  return {
    monthLabel,
    dayLabel,
    fullDate: year && month && day ? `${day}/${month}/${year}` : "",
  };
};


export const formatDateSafe = (fecha?: string | null): string => {
  if (!fecha) return "";
  let f = fecha;

  if (f.includes("T")) f = f.split("T")[0];

  if (f.includes("-")) {
    const parts = f.split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
    }
  }

  if (f.includes("/")) return f; 

  const d = new Date(f);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return fecha; 
};

/**
 * Defensive version of formatDate for Admin.
 */
export const formatDateISO = (d?: string | Date | null): string => {
  if (!d) return "-";
  if (typeof d === "string") {
    if (d.includes("T")) return d.split("T")[0];
    return d.split(" ")[0];
  }
  try {
    return new Date(d).toISOString().split("T")[0];
  } catch {
    return String(d);
  }
};