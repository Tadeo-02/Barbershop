/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";

export interface RouterConfig {
  create: string;
  idParam: string;
  updatePath: string;
}
// creacion de router general
export const createRouter = (
  controller: any,
  config: RouterConfig = {
    create: "/create",
    idParam: "id",
    updatePath: "/update",
  }
) => {
  const router = express.Router();

  router.get(config.create, controller.create);
  router.post("/", controller.store);
  router.get("/", controller.index);
  router.get(`/:${config.idParam}`, controller.show);
  router.get(`/:${config.idParam}${config.updatePath}`, controller.edit);
  router.put(`/:${config.idParam}`, controller.update);
  router.delete(`/:${config.idParam}`, controller.destroy);

  return router;
};
