import "dotenv/config"; // Load environment variables from .env
import express from "express";
import methodOverride from "method-override";
import path from "path";

// Import routers (only barberos for now since others use CommonJS)
import barberosRouter from "./routes/barberos.router";

const app = express();

// Middleware
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../../public")));

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

// Routes
app.use("/barberos", barberosRouter);

// Simple test route
app.get("/", (_req, res) => {
  res.send("Server is running! Barbershop backend is up.");
});

// Error handling middleware
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
