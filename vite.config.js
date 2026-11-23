import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({
  base: '/astation-5-pro/',
  appType: 'mpa',
  build: {
    target: 'es2022',
    assetsInlineLimit: 4096,
    rollupOptions: { input: {
      console: resolve(import.meta.dirname, 'index.html'),
      dreambound: resolve(import.meta.dirname, 'games/world/index.html'),
    } }
  }
});
