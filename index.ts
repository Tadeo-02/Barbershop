import "dotenv/config"; // Load environment variables from .env
import express from "express";
import methodOverride from "method-override";
import path from "path";

// Import CommonJS routers
import categoriesRouter from "./src/BACK/Admin/categories/categories.router";
import branchesRouter from "./src/BACK/Admin/branches/branches.router";
import usersRouter from "./src/BACK/users/users.router";
import appointmentsRouter from "./src/BACK/Appointments/appointments.router";
import { login } from "./src/BACK/users/users.controller";
//import typeOfCutRouter from "./src/BACK/typeOfCut/typeOfCut.router";
console.log("🔍 Categories router:", categoriesRouter);
console.log("🔍 Branches router:", branchesRouter);
console.log("🔍 Users router:", usersRouter);

import typeOfHaircutRouter from "./src/BACK/Admin/typeOfHaircut/typeOfHaircut.router";

console.log("🔍 Categories router:", categoriesRouter);
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
app.use("/categorias", categoriesRouter);

app.use("/usuarios", usersRouter);

app.use("/tipoCortes", typeOfHaircutRouter);

app.use("/sucursales", branchesRouter);
// Ruta específica para login
app.post("/login", login);

app.use("/turnos", appointmentsRouter);

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
