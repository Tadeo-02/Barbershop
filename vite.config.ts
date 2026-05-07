import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["__tests__/setup.ts"],
    include: ["__tests__/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/FRONT/**/*.{ts,tsx}"],
      exclude: ["src/FRONT/**/*.module.css", "src/FRONT/views/main.tsx"],
    },
  },
  plugins: [react()],

  server: {
    // poner bien los nombres
    proxy: {
      "/appointments": "http://localhost:3001",
      "/turnos": "http://localhost:3001",
      "/availability": "http://localhost:3001",
      "/tipoCortes": "http://localhost:3001",
      "/categorias": "http://localhost:3001",
      "/usuarios": "http://localhost:3001",
      "/login": "http://localhost:3001",
      "/sucursales": "http://localhost:3001",
      "/horarios": "http://localhost:3001",
      "/facturacion": "http://localhost:3001",
    },
  },
});
