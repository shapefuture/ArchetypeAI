// Round 21: restoring a report from History must not add a second copy of it to the History archive.
// The restore makes the entry the current profile; the archive already holds that report.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const canonical = JSON.parse(readFileSync(new URL('./fixtures/canonical-input.json', import.meta.url), 'utf8'));

test('restoring a report from History does not duplicate it in the archive', async ({ page }) => {
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

  // Two earlier reports from this device's own scored profile, as the History archive holds them.
  await page.evaluate(() => {
    const profile = JSON.parse(localStorage.getItem('ifs.profile'));
    const copies = ['2026-10-01T10:00:00.000Z', '2026-10-20T10:00:00.000Z'].map((createdAt) => JSON.stringify({ ...profile, createdAt }));
    localStorage.setItem('ifs.history.hist', JSON.stringify(copies));
  });
  await page.getByRole('button', { name: /^📖 Report$|^Report/ }).first().click();
  await expect(page.locator('#clinical-history')).toBeVisible();

  const archived = () => page.evaluate(() => JSON.parse(localStorage.getItem('ifs.history.hist') ?? '[]').length);
  const restoreRows = page.getByRole('button', { name: 'Restore backup', exact: true });
  await expect(restoreRows).toHaveCount(2);
  const archiveBefore = await archived();

  // The newest row is the 20 October report.
  await restoreRows.first().click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('ifs.profile')).createdAt)).toBe('2026-10-20T10:00:00.000Z');

  expect(await archived()).toBe(archiveBefore);
  await expect(restoreRows).toHaveCount(2);
});
