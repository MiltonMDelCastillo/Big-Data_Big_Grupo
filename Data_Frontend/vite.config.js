import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/Big_data/',   // <- agrega esta línea
  plugins: [react()],
})
