import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import compression from "vite-plugin-compression";

export default defineConfig({
  plugins: [
    react(),
    // Brotli + gzip for smaller assets in preview/production
    compression({ algorithm: "brotliCompress" }),
    compression({ algorithm: "gzip" })
  ],
  server: {
    port: 54693,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false
      },
      // Socket.IO websocket traffic
      "/socket.io": {
        target: "http://localhost:3000",
        ws: true,
        changeOrigin: true
      }
    }
  },
  build: {
    sourcemap: false, // slightly improves LH perf score
    chunkSizeWarningLimit: 900
  }
});
