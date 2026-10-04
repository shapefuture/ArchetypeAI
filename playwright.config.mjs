import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 120_000,
  use: {
    actionTimeout: 30_000,
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
    trace: 'retain-on-failure',
  },
  webServer: { command: 'npm run preview -- --port 4173', port: 4173, reuseExistingServer: !process.env.CI },
});
