import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.spec.ts', '*.spec.ts'],
    exclude: ['node_modules', 'tmp'],
    setupFiles: ['src/test.ts'],
  },
});
