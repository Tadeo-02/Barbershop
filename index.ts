import "dotenv/config"; // Load environment variables from .env
import express from "express";
import methodOverride from "method-override";
import path from "path";

// Import CommonJS routers
import barbersRouter from "./src/BACK/barbers/barbers.router";
import categoriesRouter from "./src/BACK/categories/categories.router";
import typeOfHaircutRouter from "./src/BACK/typeOfHaircut/typeOfHaircut.router";
console.log("🔍 Categories router:", categoriesRouter);
console.log("🔍 Barbers router:", barbersRouter);
console.log("🔍 TypeOfHaircut router:", typeOfHaircutRouter);
const app = express();

// Middleware
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/views"));

//! Routers
app.use("/barberos", barbersRouter);
app.use("/categorias", categoriesRouter);
app.use("/tipoCortes", typeOfHaircutRouter);

// Load CommonJS routers (commented out until converted to ES modules)
// TODO: Convert these routers to ES modules for consistency
// app.use(require("./src/BACK/routes/main.router"));
// app.use("/turnos", require("./src/BACK/routes/turnos.router"));
// app.use("/tipoCortes", require("./src/BACK/routes/tipoCortes.router"));
// app.use("/categorias", require("./src/BACK/routes/categorias.router"));

// Root route
app.get("/", (_req, res) => {
  res.send("Server is running! Barbershop backend is up.");
});

// Error handling middleware
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction
  ) => {
    console.error("Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
