import "dotenv/config"; // Load environment variables from .env
import logger from "./src/BACK/lib/logger";
import express from "express";
import methodOverride from "method-override";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";

// Fail fast if JWT_SECRET is missing
if (!process.env.JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is not set");
}

// Import rate limiters
import { generalLimiter } from "./src/BACK/middleware/rateLimiter";
import {
  securityMonitor,
  getSecurityEventsHandler,
} from "./src/BACK/middleware/securityMonitor";
import { authMiddleware } from "./src/BACK/middleware/authMiddleware";
import { requireRole } from "./src/BACK/middleware/roleMiddleware";

// Import routers
import categoriesRouter from "./src/BACK/Admin/categories/categories.router";
import branchesRouter from "./src/BACK/Admin/branches/branches.router";
import usersRouter from "./src/BACK/users/users.router";
import appointmentsRouter from "./src/BACK/Appointments/appointments.router";
import typeOfHaircutRouter from "./src/BACK/Admin/typeOfHaircut/typeOfHaircut.router";
import billingRouter from "./src/BACK/billing/billing.router";
import availabilityRouter from "./src/BACK/Availability/availability.router";

const app = express();

// 0. Trust first proxy (required for correct req.ip behind Render/Cloudflare/etc.)
app.set("trust proxy", 1);

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
    crossOriginEmbedderPolicy: false,
  }),
);

// 2. CORS - Configure allowed origins (comma-separated FRONTEND_URL)
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  }),
);

// CORS error handler — return 403 JSON instead of crashing into 500
app.use((err: Error, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "Origen no permitido por CORS" });
  }
  next(err);
});

// 3. Cookie parser (before body parsers so cookies are available)
app.use(cookieParser());

// 4. Request size limits
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
app.use(express.json({ limit: "10mb" }));

// 5. Security monitoring
app.use(securityMonitor());

// Other Middleware
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/views"));

// Apply general rate limiter to all routes
app.use(generalLimiter);

// Routers
app.use("/categorias", categoriesRouter);
app.use("/usuarios", usersRouter);
app.use("/tipoCortes", typeOfHaircutRouter);
app.use("/sucursales", branchesRouter);
app.use("/turnos", appointmentsRouter);
app.use("/availability", availabilityRouter);
app.use("/facturacion", billingRouter);

// Root route
app.get("/", (_req, res) => {
  res.send("Server is running! Barbershop backend is up.");
});

app.get(
  "/admin/security-events",
  authMiddleware,
  requireRole("admin"),
  getSecurityEventsHandler,
);

// Error handling middleware
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction,
  ) => {
    logger.error({ error: err }, "Error");
    res.status(500).json({ message: "Internal Server Error" });
  },
);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(
    { port: PORT, nodeEnv: process.env.NODE_ENV || "development" },
    "Server running",
  );
});
