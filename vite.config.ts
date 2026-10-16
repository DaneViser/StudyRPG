import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the build works under any subpath,
  // e.g. GitHub Pages at https://<user>.github.io/StudyRPG/
  base: './',
})
