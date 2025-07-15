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
})
