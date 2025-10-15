import * as controller from "./users.controller";
import { createRouter } from "../base/base.router";
import { findByIdWithCategory } from "./Users";

const router = createRouter(controller, {
  create: "/create",
  idParam: "codUsuario",
  updatePath: "/update",
});

// Rutas específicas para users
router.post("/login", controller.login);
router.get("/branch/:codSucursal", controller.findByBranchId);

// Agregar esta nueva ruta
router.get("/profiles/:codUsuario", async (req, res) => {
  try {
    const { codUsuario } = req.params;

    const userWithCategory = await findByIdWithCategory(codUsuario);

    res.json({
      success: true,
      data: userWithCategory,
    });
  } catch (error) {
    console.error("Error getting user profile with category:", error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Error interno del servidor",
    });
  }
});

export default router;
