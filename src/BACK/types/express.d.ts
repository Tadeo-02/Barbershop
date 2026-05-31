type JwtRole = "admin" | "barber" | "client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        codUsuario: string;
        codSucursal: string | null;
        rol: JwtRole;
      };
    }
  }
}

export {};
