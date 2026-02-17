import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["@prisma/client"],
  },
  server: {
    proxy: {
      "/appointments": "http://localhost:3001",
      "/turnos": "http://localhost:3001",
      "/tipoCortes": "http://localhost:3001",
      "/categorias": "http://localhost:3001",
      "/usuarios": "http://localhost:3001",
      "/login": "http://localhost:3001",
      "/sucursales": "http://localhost:3001",
      "/horarios": "http://localhost:3001",
    },
  },
});
