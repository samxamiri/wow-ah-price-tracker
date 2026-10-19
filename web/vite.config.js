// Plain JavaScript config (Vite accepts .js or .ts).
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // In development, forward /api calls to the Node API so the browser sees
    // one origin (no CORS needed). In production, nginx does the same job.
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
