import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 54693, // Use default port to avoid conflicts
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});