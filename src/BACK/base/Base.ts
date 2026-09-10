import { PrismaClient } from "@prisma/client";

// Universal prisma instance.
export const prisma = new PrismaClient();

//  universal error
export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "DatabaseError";
  }
}

// Universal sanitization declaration.
export const sanitizeInput = (input: string | undefined): string => {
  if (input === undefined || input === null) {
    return "";
  }
  return input.toString().trim();
};

// Universal connection closure
export const disconnect = async () => {
  await prisma.$disconnect();
};

//  universal functions
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
