import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Real UI and local data; no production identity, AI or Firestore writes.
  await page.route(/googleapis\.com|firebaseio\.com|\/api\//, (route) => route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('ifs.lang', '"en"');
    localStorage.setItem('ifs.onboarded', 'true');
    localStorage.setItem('ifs.help.seen', 'true');
  });
});

test('the 64-item reflection says when an answer is not saved, and recovers on retry', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /64/ }).first().click();
  await page.getByRole('button', { name: 'Reflect & Choose' }).click();

  await page.getByRole('radio', { name: /^2\./ }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Saved on this device.' })).toBeVisible();

  // Simulate a full device: writes to the answer key throw a quota error.
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    window.__restoreSetItem = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function setItem(key, value) {
      if (key === 'ARCHETYPE_ASSESSMENT_RESPONSES') throw new DOMException('full', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await page.getByRole('radio', { name: /^4\./ }).click();
  const alert = page.getByRole('alert');
  await expect(alert).toContainText('Not saved: this device has no room left');
  await expect(page.getByRole('status').filter({ hasText: 'Saved on this device.' })).toHaveCount(0);

  // Leaving with unsaved answers asks first; dismissing keeps the user here.
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Cancel', exact: true }).last().click();
  await expect(alert).toBeVisible();

  // Once storage works again, retrying saves the answers that were on screen.
  await page.evaluate(() => window.__restoreSetItem());
  await page.getByRole('button', { name: 'Try saving again' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Saved on this device.' })).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('ARCHETYPE_ASSESSMENT_RESPONSES')));
  expect(stored.slice(0, 2)).toEqual([2, 4]);
});
