// Round 23 probe (critic), accessibility: the History row buttons (clinical-report.jsx) take their accessible names from the
// report's constellation name and its date only (toLocaleDateString). Two reports of the same constellation saved on the same
// day, for example two retakes on one day, produce identical "View report" and "Restore backup" names, so the commit's claim
// that two rows no longer read the same to a screen reader does not hold for that case.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const canonical = JSON.parse(readFileSync(new URL('./fixtures/canonical-input.json', import.meta.url), 'utf8'));

test('two same-day reports with one constellation have distinct History button names', async ({ page }) => {
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
    // Two retakes on the same calendar day, a few hours apart, so the date-only label is identical.
    const copies = ['2026-10-20T10:00:00.000Z', '2026-10-20T11:30:00.000Z'].map((createdAt) => JSON.stringify({ ...profile, createdAt }));
    localStorage.setItem('ifs.history.hist', JSON.stringify(copies));
  });
  await page.getByRole('button', { name: /^📖 Report$|^Report/ }).first().click();
  const history = page.locator('#clinical-history');
  await expect(history).toBeVisible();

  const snapshot = await history.ariaSnapshot();
  const names = [...snapshot.matchAll(/button "([^"]*)"/g)].map((match) => match[1]);
  expect(names, `button names: ${JSON.stringify(names)}`).toHaveLength(4);
  expect(new Set(names).size, `button names: ${JSON.stringify(names)}`).toBe(4);
});
