import type { Request, Response } from "express";
import { login } from "../users/users.controller";

export function loginController(req: Request, res: Response) {
  return login(req, res);
}
