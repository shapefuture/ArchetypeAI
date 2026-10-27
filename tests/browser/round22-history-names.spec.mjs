// Round 22 probe (critic), accessibility: each row of the report History list (clinical-report.jsx `section('history', ...)`)
// has a "View report" and a "Restore backup" button whose accessible names do not say which report they act on.
// With two or more archived reports, a screen-reader user hears identical button names in a list.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const canonical = JSON.parse(readFileSync(new URL('./fixtures/canonical-input.json', import.meta.url), 'utf8'));

test('the History restore and view buttons have distinct accessible names per report', async ({ page }) => {
  await page.route(/googleapis\.com|firebaseio\.com|\/api\//, (route) => route.abort());
  await page.addInitScript((input) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('ifs.lang', '"en"');
    localStorage.setItem('ifs.onboarded', 'true');
    localStorage.setItem('ifs.help.seen', 'true');
    localStorage.setItem('INNERVERSE_PROFILE_V1', JSON.stringify(input));
  }, canonical);
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => !!localStorage.getItem('ifs.profile')), { timeout: 20_000 }).toBe(true);
  await page.evaluate(() => {
    const profile = JSON.parse(localStorage.getItem('ifs.profile'));
    const copies = ['2026-10-01T10:00:00.000Z', '2026-10-20T10:00:00.000Z'].map((createdAt) => JSON.stringify({ ...profile, createdAt }));
    localStorage.setItem('ifs.history.hist', JSON.stringify(copies));
  });
  await page.getByRole('button', { name: /^📖 Report$|^Report/ }).first().click();
  const history = page.locator('#clinical-history');
  await expect(history).toBeVisible();

  // Accessible names come from the accessibility tree (what a screen reader announces), not the visible text.
  const snapshot = await history.ariaSnapshot();
  const names = [...snapshot.matchAll(/button "([^"]*)"/g)].map((match) => match[1]);
  // Two rows, two buttons each: four buttons. Their names must tell the rows apart.
  expect(names, `button names: ${JSON.stringify(names)}`).toHaveLength(4);
  expect(new Set(names).size, `button names: ${JSON.stringify(names)}`).toBe(4);
});
