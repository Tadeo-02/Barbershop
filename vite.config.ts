import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Temporarily remove tailwindcss plugin to fix the dev server
    // tailwindcss(),
  ],
  server: {
    proxy: {
  "/appointments": "http://localhost:3001", // o el puerto donde corre tu backend,
      "/barberos": "http://localhost:3001", // o el puerto donde corre tu backend
      "/tipoCortes": "http://localhost:3001",
      "/categorias": "http://localhost:3001", // o el puerto donde corre tu backend,
      "/usuarios": "http://localhost:3001", // nuevo endpoint para usuarios
      "/login": "http://localhost:3001", // proxy para el endpoint de login
      "/sucursales": "http://localhost:3001", // proxy para el endpoint de sucursales
      "/horarios": "http://localhost:3001", // proxy para el endpoint de schedules
    },
  },
});
