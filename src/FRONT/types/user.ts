import { z } from "zod";
import { UserResponseSchema } from "../../BACK/Schemas/usersSchema";

export type UserResponse = z.infer<typeof UserResponseSchema>;

export interface User {
  codUsuario: string;
  dni: string;
  cuil: string | null;
  codSucursal: string | null;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
}

export interface LoyaltyProgress {
  currentCategory: string;
  currentDiscount: number;
  nextCategory: string | null;
  countCurrent: number | null;
  countRequired: number | null;
  daysCurrent: number | null;
  daysRequired: number | null;
  progress: number | null;
  isMaxCategory: boolean;
  discountCycle?: number | null;
  turnsUntilNextDiscount?: number | null;
  discountProgress?: number | null;
  discountTurnsRequired?: number | null;
  discountTurnsCompleted?: number | null;
  isThisTurnEligible?: boolean | null;
}

export interface UserProfile extends User {
  categoriaActual: {
    codCategoria: string;
    nombreCategoria: string;
    descCategoria: string;
    descuentoCorte: number;
    descuentoProducto: number;
    fechaInicio: string;
  } | null;
}
