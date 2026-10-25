import { test, expect } from '@playwright/test';

// Third gauntlet pass, finding 1: one malformed stored value left the app blank forever.
test.beforeEach(async ({ page }) => {
  await page.route(/googleapis\.com|firebaseio\.com|\/api\//, (route) => route.abort());
});

test('a malformed stored value does not blank the app', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.addInitScript(() => {
    localStorage.setItem('ifs.lang', '"en"');
    localStorage.setItem('ifs.onboarded', 'true');
    localStorage.setItem('ifs.help.seen', 'true');
    localStorage.setItem('ifs.sealed', '{}');
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Cabinet/ }).first()).toBeVisible({ timeout: 15_000 });
  expect(errors).toEqual([]);
});

test('a backup with a malformed value is refused, and the app keeps working', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('ifs.lang')) localStorage.setItem('ifs.lang', '"en"');
    localStorage.setItem('ifs.onboarded', 'true');
    localStorage.setItem('ifs.help.seen', 'true');
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Restore.*JSON|Restore/i }).first().click();
  await page.locator('input[type=file]').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({
    schema: 'parts-cartographer.backup.v2', data: { 'ifs.sealed': {} },
  })) });
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Restore this backup' })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: /Cabinet/ }).first()).toBeVisible({ timeout: 15_000 });
});
