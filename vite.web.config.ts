import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { version } from './package.json'

// Versão online (navegador), publicada na Vercel. Usa a mesma tela do app de desktop
export default defineConfig({
  root: resolve('src/renderer'),
  base: '/',
  resolve: {
    alias: {
      '@renderer': resolve('src/renderer/src')
    }
  },
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(version)
  },
  build: {
    outDir: resolve('dist-web'),
    emptyOutDir: true
  }
})
