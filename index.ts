import "dotenv/config"; // Load environment variables from .env
import express from "express";
import methodOverride from "method-override";
import path from "path";

// Import CommonJS routers
import barberosRouter from "./src/BACK/barbers/barberos.router";
import tipoCortesRouter from "./src/BACK/typeOfCut/tipoCortes.router";

const app = express();

// Middleware
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/views"));

// Routes - ES Module routers
app.use("/barberos", barberosRouter);
app.use("/tipoCortes", tipoCortesRouter);

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
