import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  resolve: {
    alias: {
      '@assets': path.resolve(__dirname, '../../Asset')
    }
  },
  server: {
    proxy: {
      // Proxy all requests to /GoScoot/Server to bypass CORS
      '/GoScoot/Server': {
        target: 'https://still-simply-katydid.ngrok.app',
        changeOrigin: true,
        secure: false,
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      }
    }
  }
})
