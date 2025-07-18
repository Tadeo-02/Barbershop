import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    
    // Use dynamic import for tailwindcss
    (async () => {
      const tailwindcss = await import("@tailwindcss/vite").then((m) => m.default);
      return tailwindcss();
    })(),
  ],
  server: {
    proxy: {
      '/turnos': 'http://localhost:3000', // o el puerto donde corre tu backend,
      '/barberos': 'http://localhost:3000' // o el puerto donde corre tu backend
      '/tipoCortes': 'http://localhost:3000' // o el puerto donde corre tu backend,
      }
  }
})
