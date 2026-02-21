import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  publicDir: 'public',
  server: {
    proxy: {
      '/api': {
        target: 'https://api.astracode.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/profile-api': {
        target: 'https://astracode.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/profile-api/, '/api'),
      },
    },
  },
})
