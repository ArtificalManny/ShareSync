import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 54693,
    hmr: {
      overlay: true,
    },
  },
  resolve: {
    alias: {
      './context': '/src/context',
      './components': '/src/components',
    },
  },
});