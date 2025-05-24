import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 54693, // Ensure this matches your expected port
    open: true, // Automatically open the browser
  },
  build: {
    outDir: 'dist',
    sourcemap: true, // Enable sourcemaps for better debugging
  },
});