// Mutation testing for the Assessment 2.0 scoring and map code (bd: mutation sample on scoring.ts found 9/16 boundary
// changes the suite did not catch). Runs weekly in .github/workflows/mutation.yml and on demand:
//   npx stryker run
// Report-only for now: `break` is unset, so a low score never fails the run. Raise it once the baseline is known.
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'vitest',
  vitest: { configFile: 'vitest.config.ts' },
  checkers: [],
  coverageAnalysis: 'perTest',
  mutate: [
    'src/shared/core/data/assessment2/scoring.ts',
    'src/shared/core/data/assessment2/pilot-metrics.ts',
    'src/shared/core/data/map-axes.ts',
    'src/parts-cartographer/services/universe-lens.ts',
    'src/parts-cartographer/services/universe-3plus1.ts',
    'src/parts-cartographer/core/parts-two-flow.ts',
    'src/parts-cartographer/core/parts-two-store.ts',
    'src/parts-cartographer/core/usable-parts.ts',
  ],
  reporters: ['clear-text', 'progress', 'html'],
  htmlReporter: { fileName: 'reports/mutation/index.html' },
  thresholds: { high: 85, low: 70, break: null },
  // Large folders the unit tests never read are left out of the sandbox (src also imports felt-atelier, so it stays).
  ignorePatterns: ['/zero-r-v3', '/dist', '/docs', '/architecture', '/design', '/output', '/descent-offer', '/test-results', '/reports', '/tmp', '/.beads', '*.zip', '/*.jpg', '/*.png'],
  disableTypeChecks: 'src/**/*.{ts,tsx}',
  concurrency: 2,
  timeoutMS: 20_000,
  timeoutFactor: 2,
  tempDirName: 'tmp/stryker',
};
