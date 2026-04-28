import path from "path";
import type { Request, Response } from "express";

const health = (_req: Request, res: Response) => {
  // Removed 'void _req;' - the underscore in the parameter is enough
  res
    .status(200)
    .json({ status: "healthy", timestamp: new Date().toISOString() });
};

const privated = (_req: Request, res: Response) => {
  // Ensure __dirname is available (common issue in ESM)
  res.sendFile(path.resolve(__dirname, "../../index.html"));
};

export { health, privated };
