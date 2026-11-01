import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages memakai subpath repository; hosting InfinityFree memakai root domain.
  base: process.env.GITHUB_ACTIONS ? '/belajar-react/' : '/',
  plugins: [react()],
  // Saat development, teruskan /api/... ke folder proyek pada Apache Laragon.
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
        rewrite: (path) => `/belajar-react${path}`,
      },
    },
  },
})
