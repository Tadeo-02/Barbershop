import { PrismaClient } from "@prisma/client";

// instancia de prima universal
export const prisma = new PrismaClient();

// error universal
export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "DatabaseError";
  }
}

// sanitización declarada universal
export const sanitizeInput = (input: string | undefined): string => {
  if (input === undefined || input === null) {
    return "";
  }
  return input.toString().trim();
};
// cierre de conexion universal
export const disconnect = async () => {
  await prisma.$disconnect();
};

// funciones universales
export interface BaseModel<
  TEntity,
  TCreateArgs extends unknown[] = unknown[],
  TUpdateArgs extends unknown[] = unknown[],
> {
  store: (...args: TCreateArgs) => Promise<TEntity>;
  findAll: () => Promise<TEntity[]>;
  findById: (id: string) => Promise<TEntity | null>;
  update: (id: string, ...args: TUpdateArgs) => Promise<TEntity>;
  destroy: (id: string) => Promise<TEntity>;
}
