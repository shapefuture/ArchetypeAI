import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const NO_STORE = { 'Cache-Control': 'no-store' };
const apiProxy = {
  '/api': {
    target: 'https://archetypeai-worker.wmobilas.workers.dev',
    changeOrigin: true,
    secure: true,
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
    allowedHosts: true,
    headers: NO_STORE,
    proxy: apiProxy,
  },
  preview: {
    host: true,
    port: 4174,
    allowedHosts: true,
    headers: NO_STORE,
    proxy: apiProxy,
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1400,
  },
});
