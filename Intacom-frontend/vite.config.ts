import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 54693,
    proxy: {
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug',
        rewrite: (path) => {
          console.log('Vite Proxy: Rewriting path:', path);
          return path;
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('Vite Proxy: Proxying request:', req.method, req.url);
          });
          proxy.on('error', (err) => {
            console.error('Vite Proxy: Proxy error:', err);
          });
        },
      },
    },
  },
  envDir: './', // Ensure .env file is loaded from the root.
});