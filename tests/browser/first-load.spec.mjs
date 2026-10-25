import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

// h0y0g: the first screen needs only the landing code. What the browser must
// fetch before it can render is exactly what dist/index.html references
// (entry script, module preloads, stylesheets). Checking that list is exact;
// timing network requests against the load event raced with later downloads.
const DEFERRED = /\/assets\/(firebase-(firestore|messaging|auth|core)|three-vendor|cabinet|overlays|innerverse|assessment)-/;
// Compressed script and style bytes the first screen may require.
const BUDGET_KB = 340;

const html = () => readFileSync('dist/index.html', 'utf8');
const required = () => [...html().matchAll(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/g)].map((match) => match[1]);

test('the first screen requires only the landing code', () => {
  const files = required();
  expect(files.length).toBeGreaterThan(0);
  expect(files.filter((path) => DEFERRED.test(path)), 'chunks that should load later').toEqual([]);
  const kb = files.reduce((sum, path) => sum + gzipSync(readFileSync(`dist${path}`)).length, 0) / 1024;
  expect(kb, `first-screen scripts and styles: ${files.join(', ')}`).toBeLessThan(BUDGET_KB);
});

test('the first screen renders from those files', async ({ page }) => {
  await page.route(/googleapis\.com|firebaseio\.com|\/api\//, (route) => route.abort());
  await page.goto('/', { waitUntil: 'load' });
  await expect(page.locator('body')).not.toBeEmpty();
});
