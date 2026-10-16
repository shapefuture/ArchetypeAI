import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  // Real UI, local data and WebGL; no production identity, AI or Firestore writes.
  await page.route(/googleapis\.com|firebaseio\.com|\/api\//, (route) => route.abort());
  await page.addInitScript(() => {
    if (!localStorage.getItem('ifs.lang')) localStorage.setItem('ifs.lang', '"en"');
    localStorage.setItem('ifs.onboarded', 'true');
    localStorage.setItem('ifs.help.seen', 'true');
  });
});

test('a restored Russian profile and light theme survive an offline PWA reload', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Restore.*JSON|Restore/i }).first().click();
  await page.locator('input[type=file]').setInputFiles({ name: 'portable.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({
    schema: 'parts-cartographer.backup.v2', data: { 'ifs.lang': 'ru', 'ifs.theme': 'light', ARCHETYPE_ASSESSMENT_RESPONSES: Array(64).fill(3) },
  })) });
  await page.getByRole('button', { name: 'Restore this backup' }).click();
  await expect(page.locator('.phone')).toHaveAttribute('data-theme', 'light');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.phone')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: /64/ }).click();
  await expect(page.locator('#legacy-diagnostics')).toHaveCount(1);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ifs.lang')))).toBe('ru');
  await expect(page.getByRole('button', { name: /ИИ.*пантеон|пантеон.*ИИ/i })).toBeVisible();
});

test('quick scan uses 14 real answers, leaves the full profile intact, and supports Escape', async ({ page }) => {
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: /Quick scan/ }).click();
  const dialog = page.getByRole('dialog').first();
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 14; i++) {
    await expect(dialog.getByRole('status')).toHaveText(`${i + 1} / 14`);
    await dialog.locator('.ov-body button').first().click();
  }
  await expect(dialog.locator('h2')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('ifs.profile'))).toBeNull();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('147-answer assessment resumes, completes locally, exports, and opens the coordinate universe', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = []; const requests = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (request) => { if (request.method() === 'POST') requests.push(request.postData() ?? ''); });
  await page.goto('/');
  await page.getByRole('button', { name: /Start.*147/i }).first().click();
  await page.locator('.btn.primary').click();
  // The questionnaire allows keyboard answers outside form controls.
  for (let i = 0; i < 7; i++) await page.getByRole('radio').nth(2).click();
  await page.reload();
  await page.getByRole('button', { name: /Start.*147/i }).first().click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('INNERVERSE_DESCENT_V1')).answers.filter(Boolean).length)).toBe(7);
  for (let i = 7; i < 147; i++) {
    if (i === 49 || i === 98) await page.locator('.btn.primary').click();
    await page.getByRole('radio').nth(2).click();
  }
  await expect(page.locator('textarea')).toHaveCount(3);
  await page.locator('textarea').nth(0).fill('I pause before acting.');
  await page.locator('textarea').nth(1).fill('I ask for what I need.');
  await page.locator('.btn.primary').click();
  await expect(page.locator('#clinical-self')).toBeVisible();
  await expect(page.locator('#clinical-parts .part-card')).toHaveCount(14);
  const profile = await page.evaluate(() => JSON.parse(localStorage.getItem('ifs.profile')));
  expect(profile.testModel).toBe('angular-v2');
  expect(profile.parts).toHaveLength(18);
  expect(requests.some((body) => body.includes('INNERVERSE_PROFILE') || body.includes('I pause before acting') || body.includes('"shadow"'))).toBe(false);
  const accessibility = await new AxeBuilder({ page }).include('.phone').disableRules(['color-contrast']).analyze();
  expect(accessibility.violations.filter((v) => ['critical', 'serious'].includes(v.impact))).toEqual([]);
  await page.screenshot({ path: 'test-results/clinical-report-mobile.png' });
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download report', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('innerverse-report.md');
  await page.getByRole('button', { name: /See.*universe/i }).click();
  await expect(page.locator('#universe-host canvas')).toBeVisible();
  await expect.poll(async () => Number(await page.locator('#universe-host canvas').getAttribute('data-felt-characters')), { timeout: 60_000 }).toBeGreaterThanOrEqual(18);
  await page.screenshot({ path: 'test-results/coordinate-universe-mobile.png' });
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  const filters = page.getByRole('dialog', { name: 'Filters' });
  await expect(filters).toBeVisible();
  await expect(filters.getByRole('slider')).toHaveCount(5);
  await filters.getByRole('combobox', { name: 'X', exact: true }).selectOption('ATTACHMENT');
  await filters.getByRole('slider').nth(1).focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Escape');
  await expect(filters).toHaveCount(0);
  const universeAccessibility = await new AxeBuilder({ page }).include('.phone').disableRules(['color-contrast']).analyze();
  expect(universeAccessibility.violations.filter((v) => ['critical', 'serious'].includes(v.impact))).toEqual([]);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: /Universe/ }).click();
  await expect(page.locator('#universe-host canvas')).toBeVisible();
  expect(errors).toEqual([]);
});

test('historical local restore previews before applying and refreshes mounted state', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Restore.*JSON|Restore/i }).first().click();
  await page.locator('input[type=file]').setInputFiles({ name: 'angular-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ assessmentResponses: Array(64).fill(3) })) });
  await expect(page.getByText('Review local restore')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('ARCHETYPE_ASSESSMENT_RESPONSES'))).toBeNull();
  await page.getByRole('button', { name: 'Restore this backup' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ARCHETYPE_ASSESSMENT_RESPONSES')).length)).toBe(64);
  await page.getByRole('button', { name: /64.*item|relational assessment/i }).click();
  await expect(page.locator('#legacy-diagnostics')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /AI-generated pantheon/ })).toBeVisible();
});

test('sensory style presets and individual controls stay independent and persist locally', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'You', exact: true }).click();

  const presets = page.getByRole('group', { name: 'Starting style' });
  const motion = page.getByRole('group', { name: 'Motion' });
  const density = page.getByRole('group', { name: 'Layout spacing' });
  await presets.getByRole('button', { name: 'Still' }).click();
  await expect(page.locator('.phone')).toHaveAttribute('data-motion', 'still');
  await expect(page.locator('.phone')).toHaveAttribute('data-texture', 'quiet');
  await expect(page.getByRole('checkbox', { name: 'Soft interface sounds' })).not.toBeChecked();

  await page.getByRole('checkbox', { name: 'Soft interface sounds' }).check();
  await page.getByRole('checkbox', { name: 'Decorative felt texture' }).check();
  await density.getByRole('button', { name: 'Compact' }).click();
  await expect(page.locator('.phone')).toHaveAttribute('data-motion', 'still');
  await expect(page.locator('.phone')).toHaveAttribute('data-texture', 'rich');
  await expect(page.locator('.phone')).toHaveAttribute('data-density', 'compact');
  await expect(page.getByRole('checkbox', { name: 'Soft interface sounds' })).toBeChecked();
  await expect(motion.getByRole('button', { name: 'Still' })).toHaveAttribute('aria-pressed', 'true');

  const accessibility = await new AxeBuilder({ page }).include('.phone').disableRules(['color-contrast']).analyze();
  expect(accessibility.violations.filter((v) => ['critical', 'serious'].includes(v.impact))).toEqual([]);
  await page.screenshot({ path: 'test-results/sensory-settings-mobile.png' });

  await page.reload();
  await expect(page.locator('.phone')).toHaveAttribute('data-motion', 'still');
  await expect(page.locator('.phone')).toHaveAttribute('data-texture', 'rich');
  await expect(page.locator('.phone')).toHaveAttribute('data-density', 'compact');
  await page.getByRole('button', { name: 'You', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Soft interface sounds' })).toBeChecked();
});

test('browser Back and Forward restore an open layer and a route, with focus on the main landmark and the URL unchanged', async ({ page }) => {
  await page.goto('/');
  const start = page.url();
  await page.getByRole('button', { name: /Quick scan/ }).click();
  await expect(page.getByRole('dialog').first()).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goForward();
  await expect(page.getByRole('dialog').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.getByRole('button', { name: /Start.*147/i }).first().click();
  await expect(page.locator('.app-main')).toBeFocused();
  await page.goBack();
  await expect(page.getByRole('button', { name: /Start.*147/i }).first()).toBeVisible();
  await expect(page.locator('.app-main')).toBeFocused();
  expect(page.url()).toBe(start);
});
