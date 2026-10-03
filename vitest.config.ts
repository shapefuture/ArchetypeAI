import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'angular',
          include: ['src/**/*.spec.ts'],
          exclude: ['src/parts-cartographer/**', 'node_modules', 'tmp'],
          setupFiles: ['src/test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'react',
          include: ['src/parts-cartographer/**/*.spec.ts', '*.spec.ts'],
          exclude: ['node_modules', 'tmp'],
        },
      },
    ],
  },
});
