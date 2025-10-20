import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/turnos": "http://localhost:3001",
      "/tipoCortes": "http://localhost:3001",
      "/categorias": "http://localhost:3001",
      "/usuarios": "http://localhost:3001",
      "/login": "http://localhost:3001",
      "/sucursales": "http://localhost:3001",
      "/horarios": "http://localhost:3001",
      "/arca": "http://localhost:3001",
    },
  },
});
