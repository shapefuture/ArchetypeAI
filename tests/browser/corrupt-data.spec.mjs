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

// Fourth pass, finding 1: a journal of the wrong shape broke the Journal for good.
test('a malformed journal does not break the Journal', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ifs.lang', '"en"');
    localStorage.setItem('ifs.onboarded', 'true');
    localStorage.setItem('ifs.help.seen', 'true');
    if (!sessionStorage.getItem('seeded')) { localStorage.setItem('ifs.journal', '{}'); sessionStorage.setItem('seeded', '1'); }
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Journal/ }).first().click();
  await expect(page.getByLabel('What happened?')).toBeVisible({ timeout: 15_000 });
  await page.getByLabel('What happened?').fill('still works');
  await page.getByRole('dialog').getByRole('button', { name: /Save/ }).first().click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('ifs.journal') ?? '[]').map((e) => e.what))).toEqual(['still works']);
});

// Fifth pass, finding 4: one stored part without traits broke every screen.
test('a stored part of the wrong shape does not break the home screen', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.addInitScript(() => {
    localStorage.setItem('ifs.lang', '"en"');
    localStorage.setItem('ifs.onboarded', 'true');
    localStorage.setItem('ifs.help.seen', 'true');
    localStorage.setItem('ifs.parts', JSON.stringify([{ id: 'a', name: 'x', family: 'manager', energy: 50 }]));
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Cabinet/ }).first().click();
  await expect(page.locator('section[aria-labelledby="e17-title"]')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('This screen did not open')).toHaveCount(0);
  expect(errors).toEqual([]);
});

// Sixth pass, finding 1: adding one memory made the Cabinet fail on every later visit.
test('the Cabinet still opens after a memory is added', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.addInitScript(() => {
    localStorage.setItem('ifs.lang', '"en"');
    localStorage.setItem('ifs.onboarded', 'true');
    localStorage.setItem('ifs.help.seen', 'true');
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Cabinet/ }).first().click();
  const field = page.getByLabel(/Add a memory you want kept/);
  await expect(field).toBeVisible({ timeout: 15_000 });
  await field.fill('a memory to keep');
  await page.getByRole('button', { name: 'Add memory' }).click();
  await page.reload();
  await page.getByRole('button', { name: /Cabinet/ }).first().click();
  await expect(page.locator('section[aria-labelledby="e17-title"]')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('This screen did not open')).toHaveCount(0);
  expect(errors).toEqual([]);
});
