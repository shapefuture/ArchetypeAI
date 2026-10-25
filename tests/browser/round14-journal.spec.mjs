// Round 14 critic scratch: restore a backup through the UI whose journal entry has an object note,
// then open the Journal. Expected: the entry is refused as damaged, or the Journal still opens.
import { test, expect } from '@playwright/test';

test('a restored journal entry with an object note breaks the Journal screen', async ({ page }) => {
  await page.route(/googleapis\.com|firebaseio\.com|\/api\//, (route) => route.abort());
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error).slice(0, 200)));
  await page.addInitScript(() => {
    localStorage.setItem('ifs.lang', '"en"');
    localStorage.setItem('ifs.onboarded', 'true');
    localStorage.setItem('ifs.help.seen', 'true');
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Restore.*JSON|Restore/i }).first().click();
  const backup = {
    schema: 'parts-cartographer.backup.v2',
    data: { 'ifs.lang': 'en', 'ifs.journal': [{ id: 'j1', at: 1761350400000, kind: 'jThought', what: 'restored entry', where: '', part: '', note: { nested: true } }] },
  };
  await page.locator('input[type=file]').setInputFiles({ name: 'journal.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
  await page.getByRole('button', { name: 'Restore this backup' }).click();
  await page.waitForTimeout(1500);
  // The damaged entry is never written to storage.
  expect(await page.evaluate(() => localStorage.getItem('ifs.journal') ?? '')).not.toContain('nested');
  await page.locator('.dock-fab').click();
  await page.waitForTimeout(2000);
  const alerts = await page.locator('[role="alert"]').allInnerTexts();
  expect(alerts.filter((text) => text.includes('did not open'))).toEqual([]);
});
