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
      "/turnos": "http://localhost:3000", // o el puerto donde corre tu backend,
      "/barberos": "http://localhost:3000", // o el puerto donde corre tu backend
      "/tipoCortes": "http://localhost:3000",
      "/categorias": "http://localhost:3000", // o el puerto donde corre tu backend,
    },
  },
});
