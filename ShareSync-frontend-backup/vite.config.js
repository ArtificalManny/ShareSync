// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 54693,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        // ← strip off `/api` so  /api/profile/... → http://localhost:3000/profile/...
        rewrite: path => path.replace(/^\/api/, '')
      },
    },
  },
})