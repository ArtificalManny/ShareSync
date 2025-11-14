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
    hmr: false,
    watch: {
      usePolling: true,
    },
    proxy: null,  // ← THIS KILLS ALL PROXY
  },
  optimizeDeps: {
    force: true,
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 900
  }
});