// vite.config.js
import { defineConfig } from 'vite'
import react       from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 54693,        // your React dev server
    proxy: {
      // everything /api/* → http://localhost:3000/api/*
      '/api': {
        target:    'http://localhost:3000',
        changeOrigin: true,
        secure:    false,
      },
    },
  },
})
