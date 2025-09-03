/* eslint-disable @typescript-eslint/no-explicit-any */
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
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>'";&]/g, "");
};

// cierre de conexion universal
export const disconnect = async () => {
  await prisma.$disconnect();
};

// funciones universales
export interface BaseModel {
  store: (...args: any[]) => Promise<any>;
  findAll: () => Promise<any[]>;
  findById: (id: string) => Promise<any | null>;
  update: (id: string, ...args: any[]) => Promise<any>;
  destroy: (id: string) => Promise<any>;
}
