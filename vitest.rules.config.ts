import { defineConfig } from 'vitest/config';

/** Node-only Vitest project for tests that execute Firestore rules in the emulator. */
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['firestore.rules.emulator.spec.ts', 'firestore.rules.round20.emulator.spec.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
