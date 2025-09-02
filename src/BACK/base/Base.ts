/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";

// Instancia única de Prisma para toda la aplicación
export const prisma = new PrismaClient();

// Error personalizado para toda la aplicación
export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "DatabaseError";
  }
}

// Función utilitaria para sanitizar datos
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>'";&]/g, "");
};

// Función para cerrar la conexión de Prisma
export const disconnect = async () => {
  await prisma.$disconnect();
};

// Tipos comunes
export interface BaseModel {
  store: (...args: any[]) => Promise<any>;
  findAll: () => Promise<any[]>;
  findById: (id: string) => Promise<any | null>;
  update: (id: string, ...args: any[]) => Promise<any>;
  destroy: (id: string) => Promise<any>;
}
