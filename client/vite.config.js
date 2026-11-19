import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),  tailwindcss()],
  server: {
    // forward backend calls to the Express server during development.
    // Only '/api/chat/' (trailing slash matters: matching is by string prefix, so
    // '/api' or '/api/chat' would also catch the client's own source file
    // client/api/chatApi.js, served at /api/chatApi.js, and break module loading).
    proxy: {
      '/api/chat/': 'http://localhost:3000',
    },
  },
})
