import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths, so the built game works from any folder, such as GitHub Pages' /level-up-life/.
  base: './',
})
