import type { Sucursal } from "./branch";
import type { Haircut } from "./haircut";

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
    sucursales?: Pick<Sucursal, "codSucursal" | "nombre"> & {
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
  tipos_corte?: Pick<Haircut, "codCorte" | "nombreCorte" | "valorBase"> | null;
}

export interface AppointmentDateLike {
  fechaTurno: string;
  horaDesde: string;
}

export type AppointmentSummary = Pick<
  AppointmentFull,
  | "codTurno"
  | "fechaTurno"
  | "horaDesde"
  | "horaHasta"
  | "estado"
  | "usuarios_turnos_codBarberoTousuarios"
>;

export type AppointmentPartial = Pick<
  AppointmentFull,
  | "codTurno"
  | "fechaTurno"
  | "horaDesde"
  | "horaHasta"
  | "estado"
  | "usuarios_turnos_codClienteTousuarios"
  | "usuarios_turnos_codBarberoTousuarios"
>;
