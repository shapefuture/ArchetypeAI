import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Emulated phone width (390 x 844, from playwright.config.mjs). This is not a real device.
test.beforeEach(async ({ page }) => {
  // Real UI, local data and WebGL; no production identity, AI or Firestore writes.
  await page.route(/googleapis\.com|firebaseio\.com|\/api\//, (route) => route.abort());
  await page.addInitScript(() => {
    if (!localStorage.getItem('ifs.lang')) localStorage.setItem('ifs.lang', '"en"');
    localStorage.setItem('ifs.onboarded', 'true');
    localStorage.setItem('ifs.help.seen', 'true');
  });
});

const noHorizontalScroll = (page) => expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

test('the Cabinet fits a phone width and has no axe violations with the new panels', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'You', exact: true }).click();
  await noHorizontalScroll(page);
  const accessibility = await new AxeBuilder({ page }).include('.phone').disableRules(['color-contrast']).analyze();
  expect(accessibility.violations).toEqual([]);
});

test('each Innerverse panel fits a phone width and has no axe violations', async ({ page }) => {
  await page.goto('/?go=universe');
  for (const name of [/Replay/, /Negotiate/, /Coordinates/, /Rest/]) {
    await page.getByRole('button', { name }).first().click();
    const host = page.locator('.iv-panel-host');
    await expect(host).toBeVisible();
    await noHorizontalScroll(page);
    const accessibility = await new AxeBuilder({ page }).include('.iv-panel-host').disableRules(['color-contrast']).analyze();
    expect(accessibility.violations, `panel ${name}`).toEqual([]);
    await host.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(host).toHaveCount(0);
  }
});

test('the Cabinet screen opened from home has no axe violations', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Cabinet/ }).first().click();
  await expect(page.locator('section[aria-labelledby="e17-title"]')).toBeVisible();
  await noHorizontalScroll(page);
  const accessibility = await new AxeBuilder({ page }).include('.phone').disableRules(['color-contrast']).analyze();
  expect(accessibility.violations).toEqual([]);
});

test('the Practice layer has no axe violations', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Practice/ }).first().click();
  await expect(page.locator('section[aria-labelledby="e05-title"]')).toBeVisible();
  await noHorizontalScroll(page);
  const accessibility = await new AxeBuilder({ page }).include('.phone').disableRules(['color-contrast']).analyze();
  expect(accessibility.violations).toEqual([]);
});
