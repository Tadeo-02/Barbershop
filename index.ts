import "dotenv/config"; // cargamos las variables de entrono desde el .env

import express from "express";
import methodOverride from "method-override";
import path from "path";

const app = express();

app.use(methodOverride("_method"));

// const layouts = require("express-ejs-layouts");

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/views"));

// app.use(layouts);
// app.set("layout", "layouts/layout");

// Load CommonJS routers using dynamic imports
(async () => {
  const mainRouter = await import("./src/BACK/routes/main.router");
  app.use(mainRouter.default || mainRouter);

  const turnosRouter = await import("./src/BACK/routes/turnos.router");
  app.use("/turnos", turnosRouter.default || turnosRouter);

  const tipoCortesRouter = await import("./src/BACK/routes/tipoCortes.router");
  app.use("/tipoCortes", tipoCortesRouter.default || tipoCortesRouter);

  const categoriasRouter = await import("./src/BACK/routes/categorias.router");
  app.use("/categorias", categoriasRouter.default || categoriasRouter);
})();

import barberosRouter from "./src/BACK/routes/barberos.router.js";
app.use("/barberos", barberosRouter);

// app.use("/productos", require("./src/routes/productos.router"));

// app.use("/contacto", require("./src/routes/contacto.router"));

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
