import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

// h0y0g: the first paint downloads only the landing screens. Firestore, the
// 3D engine and the deeper screens load later, on demand or when idle.
const DEFERRED = /\/assets\/(firebase-(firestore|messaging|auth|core)|three-vendor|cabinet|overlays|innerverse|assessment)-/;
// Compressed script and style bytes allowed before the load event.
const BUDGET_KB = 340;

test('the first visit loads only the landing code before the page is ready', async ({ page }) => {
  await page.route(/googleapis\.com|firebaseio\.com|\/api\//, (route) => route.abort());
  const early = [];
  page.on('request', (request) => {
    const { pathname } = new URL(request.url());
    if (/\.(js|css)$/.test(pathname)) early.push(pathname);
  });
  await page.goto('/', { waitUntil: 'load' });
  const atLoad = [...new Set(early)];

  expect(atLoad.filter((path) => DEFERRED.test(path)), 'chunks that should load later').toEqual([]);
  const kb = atLoad.reduce((sum, path) => sum + gzipSync(readFileSync(`dist${path}`)).length, 0) / 1024;
  expect(kb, `first-load scripts and styles: ${atLoad.join(', ')}`).toBeLessThan(BUDGET_KB);
  await expect(page.locator('body')).not.toBeEmpty();
});
