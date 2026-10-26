import { defineConfig } from 'vitest/config';

/** Node-only Vitest project for tests that execute Firestore rules in the emulator. */
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['firestore.rules.emulator.spec.ts', 'firestore.rules.round20.emulator.spec.ts', 'firestore.rules.round21.emulator.spec.ts', 'firestore.rules.round23.emulator.spec.ts', 'firestore.rules.round24.emulator.spec.ts', 'src/parts-cartographer/core/round25-*.rules.spec.ts', 'src/parts-cartographer/core/round26-*.rules.spec.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
