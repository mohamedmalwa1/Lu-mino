// mohamedmalwa1/lu-mino/Lu-mino-eef071840a5399afd97f3e5772965c80cf5a7740/frontend/nursery-portal/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // --- ADD THIS ENTIRE 'server' SECTION ---
  server: {
    proxy: {
      // Proxy requests from /api/... to the Django backend
      '/api': {
        target: 'http://127.0.0.1:8000', // Your Django backend address
        changeOrigin: true, // Recommended for virtual hosts
      },
    },
  },
  // -----------------------------------------
})
