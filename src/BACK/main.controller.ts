import path from "path";
import type { Request, Response } from "express";

//const index = (req: Request, res: Response) => {
//  res.render("index");
//};

const health = (_req: Request, res: Response) => {
  void _req;
  res
    .status(200)
    .json({ status: "healthy", timestamp: new Date().toISOString() });
};

const privated = (_req: Request, res: Response) => {
  void _req;
  // console.log(__dirname)
  res.sendFile(path.resolve(__dirname, "../../index.html"));
};

export {
  // index,
  health,
  privated,
};
