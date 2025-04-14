import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 54693,
    open: true,
    logLevel: 'debug',
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  root: resolve(__dirname), // Explicitly set the root to the project directory
  publicDir: 'public', // Ensure public directory is set
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});