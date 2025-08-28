import path from "path";
import type { Request, Response } from "express";

//const index = (req: Request, res: Response) => {
//  res.render("index");
//};

const privated = (req: Request, res: Response) => {
  // console.log(__dirname)
  res.sendFile(path.resolve(__dirname, "../../index.html"));
};

export {
  // index,
  privated,
};
