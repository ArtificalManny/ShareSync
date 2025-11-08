// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import compression from "vite-plugin-compression";

export default defineConfig({
  plugins: [
    react(),
    compression({ algorithm: "brotliCompress" }),
    compression({ algorithm: "gzip" })
  ],
  server: {
    port: 54693,
    proxy: {
      "/api": {
        target: "http://localhost:5001",   // ← Backend is on 5001
        changeOrigin: true,
        secure: false
      },
      "/socket.io": {
        target: "ws://localhost:5001",     // ← WebSocket also on 5001
        ws: true,
        changeOrigin: true
      }
    }
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 900
  }
});