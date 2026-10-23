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
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Firebase is split by service: sign-in at boot needs only app + auth,
          // while Firestore and messaging load when a feature first uses them.
          if (/\/node_modules\/(@firebase\/(firestore|webchannel-wrapper)|firebase\/firestore|re2js)\//.test(id)) return 'firebase-firestore';
          if (/\/node_modules\/(@firebase\/(messaging|installations)|firebase\/messaging)\//.test(id)) return 'firebase-messaging';
          if (/\/node_modules\/(@firebase|firebase)\/auth\//.test(id)) return 'firebase-auth';
          if (id.includes('/node_modules/@firebase/') || id.includes('/node_modules/firebase/')) return 'firebase-core';
          if (id.includes('/node_modules/three/')) return 'three-vendor';
          if (/\/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react-vendor';
        },
      },
    },
  },
});
