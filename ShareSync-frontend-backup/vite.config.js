// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import compression from "vite-plugin-compression";

export default defineConfig({
  plugins: [
    react({
      // Disable Fast Refresh for auth-critical files
      // This prevents HMR from caching stale auth state
      exclude: [
        /AuthContext\.jsx$/,
        /main\.jsx$/,
        /client\.js$/
      ]
    }),
    compression({ algorithm: "brotliCompress" }),
    compression({ algorithm: "gzip" })
  ],
  server: {
    port: 54693,
    hmr: {
      // Keep HMR enabled but force full reload on auth changes
      overlay: true,
      protocol: 'ws',
      host: 'localhost'
    },
    watch: {
      usePolling: true,
    },
    proxy: null,
  },
  optimizeDeps: {
    force: true,
    // Exclude auth modules from pre-bundling
    exclude: ['src/context/AuthContext.jsx', 'src/api/client.js']
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Ensure auth code is in main bundle, not cached chunks
        manualChunks: {
          'auth': ['src/context/AuthContext.jsx']
        }
      }
    }
  },
  // Force rebuild on any localStorage change
  define: {
    '__AUTH_TIMESTAMP__': JSON.stringify(Date.now())
  }
});