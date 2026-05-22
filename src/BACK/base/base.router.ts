import express from "express";
import { Router, RequestHandler } from "express";
export interface ControllerHandlers {
  create: RequestHandler;
  store: RequestHandler;
  index: RequestHandler;
  show: RequestHandler;
  edit: RequestHandler;
  update: RequestHandler;
  destroy: RequestHandler;
}

export interface RouterConfig {
  create: string;
  idParam: string;
  updatePath: string;
  globalMiddleware?: RequestHandler[]; // <-- NUEVO: se aplica a TODAS las rutas
  middleware?: {
    create?: RequestHandler[];
    update?: RequestHandler[];
    delete?: RequestHandler[];
    read?: RequestHandler[];
  };
}
// creacion de router general
const createRouter = (
  controller: ControllerHandlers,
  config: RouterConfig = {
    create: "/create",
    idParam: "id",
    updatePath: "/update",
  },
): Router => {
  const router = express.Router();

  const applyMiddleware = (
    type: keyof NonNullable<RouterConfig["middleware"]>,
  ) => {
    // global primero, luego el específico de la operación
    return [
      ...(config.globalMiddleware || []),
      ...(config.middleware?.[type] || []),
    ];
  };

  // Read operations (no middleware by default)
  router.get(config.create, ...applyMiddleware("read"), controller.create);
  router.get("/", ...applyMiddleware("read"), controller.index);
  router.get(
    `/:${config.idParam}`,
    ...applyMiddleware("read"),
    controller.show,
  );
  router.get(
    `/:${config.idParam}${config.updatePath}`,
    ...applyMiddleware("read"),
    controller.edit,
  );

  // Create operations
  router.post("/", ...applyMiddleware("create"), controller.store);

  // Update operations
  router.put(
    `/:${config.idParam}`,
    ...applyMiddleware("update"),
    controller.update,
  );

  // Delete operations
  router.delete(
    `/:${config.idParam}`,
    ...applyMiddleware("delete"),
    controller.destroy,
  );

  return router;
};
export default createRouter;
