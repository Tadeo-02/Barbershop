export interface AppointmentFull {
  codTurno: string;
  codBarbero: string;
  codCorte?: string;
  codCliente: string;
  fechaTurno: string;
  horaDesde: string;
  horaHasta: string;
  precioTurno?: number;
  metodoPago?: string;
  estado: string;
  usuarios_turnos_codBarberoTousuarios?: {
    codUsuario: string;
    nombre: string;
    apellido: string;
    telefono?: string;
    email?: string;
    codSucursal?: string | null;
    sucursales?: {
      codSucursal: string;
      nombre: string;
      calle?: string;
      altura?: number;
    } | null;
  };
  usuarios_turnos_codClienteTousuarios?: {
    codUsuario: string;
    nombre: string;
    apellido: string;
    telefono?: string;
    email?: string;
  };
  tipos_corte?: {
    codCorte: string;
    nombreCorte: string;
    valorBase: number;
  } | null;
}

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
