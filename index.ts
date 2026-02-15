import "dotenv/config"; // Load environment variables from .env
import express from "express";
import methodOverride from "method-override";
import path from "path";
import helmet from "helmet";
import cors from "cors";

// Import rate limiters
import { generalLimiter, authLimiter } from "./src/BACK/middleware/rateLimiter";
import {
  securityMonitor,
  getSecurityEventsHandler,
} from "./src/BACK/middleware/securityMonitor";

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

// Security Middleware
// 1. Helmet - Sets various HTTP headers for security
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow loading resources from other origins
  }),
);

// 2. CORS - Configure allowed origins
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Vite default port
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// 3. Request size limits - Prevent large payload attacks
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
app.use(express.json({ limit: "10mb" }));

// 4. Security monitoring - Track suspicious activity
app.use(securityMonitor());

// Other Middleware
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/views"));

// Apply general rate limiter to all routes
app.use(generalLimiter);

//! Routers
app.use("/categorias", categoriesRouter);

app.use("/usuarios", usersRouter);

app.use("/tipoCortes", typeOfHaircutRouter);

app.use("/sucursales", branchesRouter);
// Ruta específica para login (with auth limiter)
app.post("/login", authLimiter, login);

app.use("/turnos", appointmentsRouter);

// Root route
app.get("/", (_req, res) => {
  res.send("Server is running! Barbershop backend is up.");
});

// Admin route to view security events (should be protected with auth in production)
app.get("/admin/security-events", getSecurityEventsHandler);

// Error handling middleware
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction,
  ) => {
    console.error("Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  },
);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
