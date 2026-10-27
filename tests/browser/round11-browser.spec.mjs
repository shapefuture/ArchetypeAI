// Gauntlet round 11 scratch (critic): axe with color-contrast ENABLED on check-in, practice and synastry overlays.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(12, 0, 0, 0); return d.toISOString(); };
const summarize = (violations) => violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes[0]?.target, html: v.nodes[0]?.html?.slice(0, 160) }));

async function seed(page, checkIns = []) {
  await page.addInitScript((rows) => {
    if (sessionStorage.getItem('r11-seeded')) return;
    sessionStorage.setItem('r11-seeded', '1');
    localStorage.setItem('ifs.lang', '"en"');
    localStorage.setItem('ifs.onboarded', 'true');
    localStorage.setItem('INNERVERSE_CHECKINS_V1', JSON.stringify(rows));
  }, checkIns);
}

test('R11-X1 check-in arousal stage: no axe violations with color-contrast on', async ({ page }) => {
  await seed(page);
  await page.goto('/?go=checkin');
  await expect(page.getByText('Where are you right now?')).toBeVisible({ timeout: 20_000 });
  const r = await new AxeBuilder({ page }).include('.overlay').analyze();
  expect(summarize(r.violations)).toEqual([]);
});

test('R11-X2 check-in done stage with a softening card: no axe violations', async ({ page }) => {
  const rows = [
    ...[35, 40, 45, 50].map((n) => ({ date: daysAgo(n), arousal: 2, confirmedPart: 'numb' })),
    ...[5, 10, 15, 20].map((n, i) => ({ date: daysAgo(n), arousal: 0, ...(i === 0 ? { confirmedPart: 'numb' } : {}) })),
  ];
  await seed(page, rows);
  await page.goto('/?go=checkin');
  await expect(page.getByText('Where are you right now?')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'In my window' }).click();
  await page.getByRole('button', { name: 'Skip' }).click();
  await page.getByRole('button', { name: 'Log without a part' }).click();
  await expect(page.getByText('Logged. The weather shifts.')).toBeVisible();
  const r = await new AxeBuilder({ page }).include('.overlay').analyze();
  expect(summarize(r.violations)).toEqual([]);
});

test('R11-X5 softening card key is not written until the card is shown (real deep link)', async ({ page }) => {
  const rows = [
    ...[35, 40, 45, 50].map((n) => ({ date: daysAgo(n), arousal: 2, confirmedPart: 'numb' })),
    ...[5, 10, 15, 20].map((n, i) => ({ date: daysAgo(n), arousal: 0, ...(i === 0 ? { confirmedPart: 'numb' } : {}) })),
  ];
  await seed(page, rows);
  await page.goto('/?go=checkin');
  await expect(page.getByText('Where are you right now?')).toBeVisible({ timeout: 20_000 });
  const stored = await page.evaluate(() => localStorage.getItem('INNERVERSE_UNBURDENED_V1'));
  expect(stored, 'the once-only card must not be consumed while the arousal question is still showing').toBeNull();
});

test('R11-X6 check-in opened from home: an arousal tap moves to the next question and stays there', async ({ page }) => {
  await seed(page);
  await page.goto('/');
  await page.getByRole('button', { name: /Check-in/ }).first().click();
  await expect(page.getByText('Where are you right now?')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'In my window' }).click();
  await expect(page.getByText('What kind of day was it?')).toBeVisible({ timeout: 5_000 });
  await page.waitForTimeout(1500);
  await expect(page.getByText('What kind of day was it?')).toBeVisible();
});

test('R11-X7 check-in via deep link: an arousal tap moves to the next question and stays there', async ({ page }) => {
  await seed(page);
  await page.goto('/?go=checkin');
  await expect(page.getByText('Where are you right now?')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'In my window' }).click();
  await expect(page.getByText('What kind of day was it?')).toBeVisible({ timeout: 5_000 });
  await page.waitForTimeout(1500);
  await expect(page.getByText('What kind of day was it?')).toBeVisible();
});

test('R11-X8 deep-link check-in: how many taps until the next question appears', async ({ page }) => {
  await seed(page);
  await page.goto('/?go=checkin');
  await expect(page.getByText('Where are you right now?')).toBeVisible({ timeout: 20_000 });
  const taps = [];
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'In my window' }).click();
    await page.waitForTimeout(1500);
    const eventVisible = await page.getByText('What kind of day was it?').isVisible();
    taps.push(eventVisible);
    if (eventVisible) break;
  }
  expect(taps, 'the second tap should reach the event question if the reset is one-time').toEqual([true]);
});

test('R11-X9 deep-link check-in: the overlay DOM node is replaced by the first tap (remount)', async ({ page }) => {
  await seed(page);
  await page.goto('/?go=checkin');
  await expect(page.getByText('Where are you right now?')).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => { window.__r11Dialog = document.querySelector('[role="dialog"]'); });
  await page.getByRole('button', { name: 'In my window' }).click();
  await page.waitForTimeout(1500);
  const sameNode = await page.evaluate(() => document.querySelector('[role="dialog"]') === window.__r11Dialog);
  expect(sameNode, 'the check-in dialog should keep its DOM node across an answer').toBe(true);
});

test('R11-X10 control: the check-in dialog opened from home keeps its DOM node across an answer', async ({ page }) => {
  await seed(page);
  await page.goto('/');
  await page.getByRole('button', { name: /Check-in/ }).first().click();
  await expect(page.getByText('Where are you right now?')).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => { window.__r11Dialog = document.querySelector('[role="dialog"]'); });
  await page.getByRole('button', { name: 'In my window' }).click();
  await page.waitForTimeout(1500);
  const sameNode = await page.evaluate(() => document.querySelector('[role="dialog"]') === window.__r11Dialog);
  expect(sameNode).toBe(true);
});

test('R11-X11 check-in done stage from home (with a softening card): no axe violations with color-contrast on', async ({ page }) => {
  const rows = [
    ...[35, 40, 45, 50].map((n) => ({ date: daysAgo(n), arousal: 2, confirmedPart: 'numb' })),
    ...[5, 10, 15, 20].map((n, i) => ({ date: daysAgo(n), arousal: 0, ...(i === 0 ? { confirmedPart: 'numb' } : {}) })),
  ];
  await seed(page, rows);
  await page.goto('/');
  await page.getByRole('button', { name: /Check-in/ }).first().click();
  await expect(page.getByText('Where are you right now?')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'In my window' }).click();
  await page.getByRole('button', { name: 'Skip' }).click();
  await page.getByRole('button', { name: 'Log without a part' }).click();
  await expect(page.getByText('Logged. The weather shifts.')).toBeVisible();
  const r = await new AxeBuilder({ page }).include('.overlay').analyze();
  expect(summarize(r.violations)).toEqual([]);
});

test('R11-X3 practice overlay: no axe violations with color-contrast on', async ({ page }) => {
  await seed(page);
  await page.goto('/');
  await page.getByRole('button', { name: /Practice/ }).first().click();
  await expect(page.locator('section[aria-labelledby="e05-title"]')).toBeVisible({ timeout: 20_000 });
  const r = await new AxeBuilder({ page }).include('.overlay').analyze();
  expect(summarize(r.violations)).toEqual([]);
});

test('R11-X4 synastry overlay: no axe violations with color-contrast on', async ({ page }) => {
  await seed(page);
  await page.goto('/');
  await page.getByRole('button', { name: /Synastry/ }).first().click();
  await expect(page.locator('.overlay').first()).toBeVisible({ timeout: 20_000 });
  const r = await new AxeBuilder({ page }).include('.overlay').analyze();
  expect(summarize(r.violations)).toEqual([]);
});
