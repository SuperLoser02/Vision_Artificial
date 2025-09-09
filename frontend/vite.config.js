// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Lee host/puerto HMR desde variables de entorno (útil en Docker)
const HMR_HOST = process.env.VITE_HMR_HOST || 'localhost'
const HMR_PORT = Number(process.env.VITE_HMR_PORT || 5173)

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    // Asegura HMR correcto desde Docker -> host
    hmr: {
      host: HMR_HOST,
      clientPort: HMR_PORT,
      protocol: 'ws',
    },
    // Forzar sondeo en Windows/macOS con Docker Desktop
    watch: {
      usePolling: true,
      interval: 100,
    },
    // Proxy opcional para evitar CORS en desarrollo
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})