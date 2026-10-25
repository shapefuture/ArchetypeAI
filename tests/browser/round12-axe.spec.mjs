// Round 12 critic scratch: axe with color-contrast ENABLED on the journal, paywall and cabinet (memory panel).
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const summarize = (violations) => violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes[0]?.target, html: v.nodes[0]?.html?.slice(0, 180) }));

test.beforeEach(async ({ page }) => {
  await page.route(/googleapis\.com|firebaseio\.com|\/api\//, (route) => route.abort());
  await page.addInitScript(() => {
    if (!localStorage.getItem('ifs.lang')) localStorage.setItem('ifs.lang', '"en"');
    localStorage.setItem('ifs.onboarded', 'true');
    localStorage.setItem('ifs.help.seen', 'true');
  });
});

test('R12-A1 journal overlay: no axe violations with color-contrast on', async ({ page }) => {
  await page.goto('/');
  await page.locator('.dock-fab').click();
  await expect(page.locator('.overlay').first()).toBeVisible({ timeout: 20_000 });
  const r = await new AxeBuilder({ page }).include('.overlay').analyze();
  expect(summarize(r.violations)).toEqual([]);
});

test('R12-A2 paywall overlay: no axe violations with color-contrast on', async ({ page }) => {
  await page.goto('/');
  await page.locator('.dock-tab').filter({ hasText: /Coach/ }).first().click();
  await expect(page.locator('.overlay').first()).toBeVisible({ timeout: 20_000 });
  const r = await new AxeBuilder({ page }).include('.overlay').analyze();
  expect(summarize(r.violations)).toEqual([]);
});

test('R12-A3 cabinet with the memory panel: no axe violations with color-contrast on', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Cabinet/ }).first().click();
  await expect(page.getByText('Memory', { exact: true }).first()).toBeVisible({ timeout: 20_000 });
  const r = await new AxeBuilder({ page }).include('.phone').analyze();
  expect(summarize(r.violations)).toEqual([]);
});
