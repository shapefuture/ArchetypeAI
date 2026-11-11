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

// The timing question is the radio group with this label (content.ts timingQ, English).
const TIMING_QUESTION = 'When does it usually show up?';

/**
 * Answers every Assessment 2.0 screen until the result shows. Bounded, so a stuck screen fails the test.
 * skipTiming skips each timing question. lighter ticks the lighter path on the first screen, before any answer.
 */
async function answerAssessment2UntilResult(page, { skipTiming = false, lighter = false } = {}) {
  if (lighter) await page.locator('.p2-check input[type="checkbox"]').check();
  let result = false;
  for (let step = 0; step < 150 && !result; step++) {
    if (await page.getByRole('heading', { name: 'Your parts map' }).isVisible()) { result = true; break; }
    if (skipTiming && await page.getByRole('radiogroup', { name: TIMING_QUESTION }).count() > 0) {
      await page.getByRole('button', { name: 'Skip', exact: true }).click();
    } else if (await page.locator('.p2-scale').count() > 0) {
      const rows = page.locator('.p2-scale');
      for (let row = 0; row < await rows.count(); row++) await rows.nth(row).locator('button').first().click();
      await page.getByRole('button', { name: 'Next', exact: true }).click();
    } else if (await page.getByRole('radio').count() > 0) {
      await page.getByRole('radio').first().click();
      const next = page.getByRole('button', { name: 'Next', exact: true });
      if (await next.count() > 0 && await next.isEnabled()) await next.click();
    } else if (await page.locator('.p2-pad').count() > 0 || (await page.locator('.p2-chips').count() > 0 && await page.locator('.p2-list').count() === 0)) {
      await page.getByRole('button', { name: 'Next', exact: true }).click();
    } else if (await page.locator('.p2-list li button').count() > 0) {
      await page.locator('.p2-list li button').first().click();
      if (await page.locator('.p2-status').count() > 0 && /least/i.test(await page.locator('.p2-status').innerText())) {
        await page.locator('.p2-list li button').nth(1).click();
      }
    } else {
      throw new Error('unrecognised Assessment 2.0 screen at step ' + step);
    }
  }
  expect(result).toBe(true);
}

test('Assessment 2.0 is the default route, Quick Scan is gone, and a full pass saves a map without writing the 147 profile', async ({ page }) => {
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Quick scan/ })).toHaveCount(0);
  const first = page.locator('button.opt').first();
  await expect(first).toContainText(/Parts map 2\.0/);
  await first.click();
  await expect(page.getByRole('heading', { name: /How steady do you feel right now/ })).toBeVisible({ timeout: 20_000 });

  await answerAssessment2UntilResult(page);
  await page.getByRole('button', { name: 'Save and open my map' }).click();
  const saved = await page.evaluate(() => ({
    result: JSON.parse(localStorage.getItem('ifs.parts2.result') ?? 'null'),
    parts: JSON.parse(localStorage.getItem('ifs.parts') ?? '[]'),
    profile: localStorage.getItem('ifs.profile'),
  }));
  // The stored result is the envelope { savedAt, result } (B9), so the result sits one level down.
  expect(typeof saved.result?.savedAt).toBe('string');
  expect(saved.result?.result?.instrument).toBe('parts-2');
  expect(saved.parts.some((part) => part.archetype?.sourceAssessment === 'parts-2')).toBe(true);
  expect(saved.profile).toBeNull();
  const partsTwo = saved.parts.filter((part) => part.archetype?.sourceAssessment === 'parts-2');
  expect(partsTwo.length).toBeGreaterThan(0);
  // This run skips placement, so no depth was answered: depth must be stored as unknown, not as a default.
  expect(partsTwo.every((part) => part.archetype.unmeasuredAxes.includes('DEPTH'))).toBe(true);
  expect(errors).toEqual([]);
});

test('a skipped timing reaches the result as Timing not answered, and is stored as unknown', async ({ page }) => {
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  const first = page.locator('button.opt').first();
  await expect(first).toContainText(/Parts map 2\.0/);
  await first.click();
  await expect(page.getByRole('heading', { name: /How steady do you feel right now/ })).toBeVisible({ timeout: 20_000 });
  await answerAssessment2UntilResult(page, { skipTiming: true });
  // Every protector's timing was skipped, so the result says so, and no protector is given a timing (plan D1).
  await expect(page.getByText('Timing not answered').first()).toBeVisible();
  await page.getByRole('button', { name: 'Save and open my map' }).click();
  const saved = await page.evaluate(() => ({
    result: JSON.parse(localStorage.getItem('ifs.parts2.result') ?? 'null'),
    parts: JSON.parse(localStorage.getItem('ifs.parts') ?? '[]'),
  }));
  const protectors = saved.result.result.parts.filter((part) => part.kind === 'protector');
  expect(protectors.length).toBeGreaterThan(0);
  expect(protectors.every((part) => part.timing === null && part.classKnown === false)).toBe(true);
  // On the map a skipped protector has no class: partType is absent and classKnown is false.
  const mapProtectors = saved.parts.filter((part) => part.archetype?.cluster === 'parts_two_protector');
  expect(mapProtectors).toHaveLength(protectors.length);
  expect(mapProtectors.every((part) => part.archetype.partType === undefined && part.archetype.classKnown === false)).toBe(true);
  expect(errors).toEqual([]);
});

test('the lighter path asks no exile question, and its saved result has no exile part and no guard', async ({ page }) => {
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  const first = page.locator('button.opt').first();
  await expect(first).toContainText(/Parts map 2\.0/);
  await first.click();
  await expect(page.getByRole('heading', { name: /How steady do you feel right now/ })).toBeVisible({ timeout: 20_000 });
  await answerAssessment2UntilResult(page, { lighter: true });
  await page.getByRole('button', { name: 'Save and open my map' }).click();
  const saved = await page.evaluate(() => ({
    result: JSON.parse(localStorage.getItem('ifs.parts2.result') ?? 'null'),
    parts: JSON.parse(localStorage.getItem('ifs.parts') ?? '[]'),
  }));
  const parts = saved.result.result.parts;
  expect(saved.result.result.lighter).toBe(true);
  expect(parts.some((part) => part.kind === 'protector')).toBe(true);
  // The lighter path has no exile questions and no wants or provider screens, so no exile or provider point is stored (plan D3, B3).
  expect(parts.filter((part) => part.kind === 'exile' || part.kind === 'provider')).toEqual([]);
  expect(parts.every((part) => part.guards.length === 0)).toBe(true);
  expect(saved.parts.filter((part) => part.archetype?.cluster === 'parts_two_exile')).toEqual([]);
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
  expect(await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('INNERVERSE_DESCENT_V2')).answers).length)).toBe(7);
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
  await filters.getByRole('combobox', { name: 'X', exact: true }).selectOption('BLENDING');
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
  // Wait for the app to finish loading, so the Restore control is the mounted one and not a pre-hydration node.
  await page.waitForLoadState('networkidle');
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
  await page.getByRole('button', { name: /Book a session/ }).click();
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

test('the situation inquiry entry opens the inquiry itself, focused and in view', async ({ page }) => {
  await page.goto('/');
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.getByRole('button', { name: /Think through one situation/ }).first().click();
  const inquiry = page.locator('#situation-inquiry');
  await expect(inquiry).toBeVisible({ timeout: 30_000 });
  await expect(inquiry).toBeFocused();
  await expect(inquiry).toBeInViewport();
  expect(await page.evaluate(() => localStorage.getItem('ARCHETYPE_ASSESSMENT_RESPONSES'))).toBeNull();
  expect(errors).toEqual([]);
});
