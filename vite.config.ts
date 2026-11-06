import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths, so the built game works from any folder, such as GitHub Pages' /level-up-life/.
  base: './',
  build: {
    // The game is one page loaded once and then played offline, and Firebase (about 570 kB) is split into its own file
    // that only downloads when a player opens friends' raids. Both sit a little over Vite's default 500 kB warning.
    chunkSizeWarningLimit: 650,
  },
})
