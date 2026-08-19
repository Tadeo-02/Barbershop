import crypto from "crypto";

export const createRawToken = (): string => crypto.randomBytes(32).toString("hex");

export const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");
