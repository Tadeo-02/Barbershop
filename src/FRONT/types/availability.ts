export interface Availability {
  codBloqueo: string;
  codBarbero: string;
  fechaHoraDesde: string | Date;
  fechaHoraHasta: string | Date;
  motivo: string;
}

export interface AvailableSlot {
  hora: string;
}
