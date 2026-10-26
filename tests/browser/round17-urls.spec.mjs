// Critic 17 scratch: boot with hostile URL parameters must not take the app down.
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const OUT = process.env.ROUND17_OUT ?? '/tmp/round17-checks';
const URLS = ['/?go=', '/?go=checkin&go=universe', '/?go=%5B%5D', '/?stripe=success', '/?stripe=success&session_id=%00%00', '/?stripe=cancel&session_id=cs_test_abc', '/?go=assessment&stripe=success&session_id=' + 'x'.repeat(3000)];

test('URL parameters do not crash boot', async ({ context }) => {
  await context.route(/googleapis\.com|firebaseio\.com|\/api\//, (route) => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem('ifs.lang', '"en"');
    localStorage.setItem('ifs.onboarded', 'true');
    localStorage.setItem('ifs.help.seen', 'true');
  });
  const results = [];
  for (const url of URLS) {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e.message)));
    await page.goto(url);
    await page.waitForTimeout(2500);
    const body = await page.locator('body').innerText();
    results.push({ url: url.slice(0, 80), errors, boundary: /did not open/.test(body), blank: body.trim().length < 5 });
    await page.close();
  }
  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/urls.json`, JSON.stringify(results, null, 2));
  expect(results.filter((r) => r.errors.length || r.boundary || r.blank)).toEqual([]);
});
