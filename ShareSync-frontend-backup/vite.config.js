import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 54693, // Ensure the port matches your expectation
  },
  esbuild: {
    loader: { '.js': 'jsx' }, // Correctly map .js files to use the 'jsx' loader
  },
});