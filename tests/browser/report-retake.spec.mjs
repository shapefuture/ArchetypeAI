import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const canonical = JSON.parse(readFileSync(new URL('./fixtures/canonical-input.json', import.meta.url), 'utf8'));
const DRAFT = JSON.stringify({ schema: 'descent-draft.v2', answers: { 'shadow.taskmaster.1': 4 }, cursor: { itemId: 'shadow.taskmaster.1', stage: 'item' }, savedAt: '2026-10-01T00:00:00.000Z' });

async function openReport(page) {
  await page.route(/googleapis\.com|firebaseio\.com|\/api\//, (route) => route.abort());
  await page.addInitScript(([input, draft]) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('ifs.lang', '"en"');
    localStorage.setItem('ifs.onboarded', 'true');
    localStorage.setItem('ifs.help.seen', 'true');
    localStorage.setItem('INNERVERSE_PROFILE_V1', JSON.stringify(input));
    localStorage.setItem('INNERVERSE_DESCENT_V2', draft);
  }, [canonical, DRAFT]);
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => !!localStorage.getItem('ifs.profile')), { timeout: 20_000 }).toBe(true);
  await page.getByRole('button', { name: /^📖 Report$|^Report/ }).first().click();
  await expect(page.locator('#clinical-self')).toBeVisible();
}

test('Retake asks before deleting an unfinished test, and keeps it when declined', async ({ page }) => {
  await openReport(page);
  const dialogs = [];
  page.once('dialog', (dialog) => { dialogs.push(dialog.message()); dialog.dismiss(); });
  await page.getByRole('button', { name: 'Retake test' }).click();
  await expect.poll(() => dialogs.length).toBe(1);
  expect(dialogs[0]).toContain('unfinished test');
  expect(await page.evaluate(() => localStorage.getItem('INNERVERSE_DESCENT_V2'))).toBe(DRAFT);
  await expect(page.locator('#clinical-self')).toBeVisible();
});

test('Retake starts over once the person agrees', async ({ page }) => {
  await openReport(page);
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Retake test' }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('INNERVERSE_DESCENT_V2'))).toBeNull();
  await expect(page.locator('#clinical-self')).toHaveCount(0);
});
