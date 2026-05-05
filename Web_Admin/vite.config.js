import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240,
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'pdf-vendor':   ['jspdf', 'html2canvas'],
          'icon-vendor':  ['lucide-react', 'react-icons'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://api.flowerplusofficial.com',
        changeOrigin: true,
        secure: true,
        headers: {
          'Origin': 'https://admin.flowerplusofficial.com',
          'Referer': 'https://admin.flowerplusofficial.com/',
        }
      },
      '/storage': {
        target: 'https://api.flowerplusofficial.com',
        changeOrigin: true,
        secure: true,
        headers: {
          'Origin': 'https://admin.flowerplusofficial.com',
          'Referer': 'https://admin.flowerplusofficial.com/',
        }
      }
    }
  }
})