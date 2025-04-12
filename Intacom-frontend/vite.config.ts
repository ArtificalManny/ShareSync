import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 54693, // Ensure the frontend runs on port 54693.
    proxy: {
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug', // Enable debug logging for proxy requests.
        rewrite: (path) => {
          console.log('Proxy rewriting path:', path);
          return path;
        },
      },
    },
  },
});