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
  root: resolve(__dirname),
  publicDir: 'public',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});