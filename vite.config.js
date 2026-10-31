import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages memakai subpath repository; hosting InfinityFree memakai root domain.
  base: process.env.GITHUB_ACTIONS ? '/belajar-react/' : '/',
  plugins: [react()],
  // Saat development, teruskan /api ke virtual host PHP Laragon pada domain yang sama.
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://belajar-react.test',
        changeOrigin: false,
      },
    },
  },
})
