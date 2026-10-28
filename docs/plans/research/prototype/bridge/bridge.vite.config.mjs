// Builds the prototype's bridge to the real app code (universe, 147 scoring, profile adapter).
// Usage (repo root): npx vite build --config docs/plans/research/prototype/bridge/bridge.vite.config.mjs -- <outDir>
// The output (bridge.js plus the felt worker) is published beside the prototype page.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = fileURLToPath(new URL('../../../../../', import.meta.url));
const outDir = process.env.BRIDGE_OUT || fileURLToPath(new URL('./dist/', import.meta.url));

export default defineConfig({
  root,
  base: './',
  publicDir: false,
  logLevel: 'warn',
  worker: { format: 'es' },
  build: {
    outDir,
    emptyOutDir: true,
    target: 'es2020',
    minify: true,
    chunkSizeWarningLimit: 4000,
    lib: { entry: fileURLToPath(new URL('./main.ts', import.meta.url)), formats: ['es'], fileName: () => 'bridge.js' },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
