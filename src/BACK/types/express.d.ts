import type { Rol } from "../lib/roles";

declare global {
  namespace Express {
    interface Request {
      user?: {
        codUsuario: string;
        codSucursal: string | null;
        rol: Rol;
      };
    }
  }
}

export {};
