import { test, expect } from '@playwright/test';

// Finding 12 of the first gauntlet pass: a second tab wrote back stale parts
// and erased the first tab's edit.
test('an edit to the parts map in one tab survives an edit in another', async ({ context }) => {
  await context.route(/googleapis\.com|firebaseio\.com|\/api\//, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('ifs.lang')) localStorage.setItem('ifs.lang', '"en"');
    localStorage.setItem('ifs.onboarded', 'true');
    localStorage.setItem('ifs.help.seen', 'true');
  });
  const open = async () => {
    const page = await context.newPage();
    await page.goto('/');
    await page.getByRole('button', { name: /Cabinet/ }).first().click();
    await expect(page.locator('.part-card .pc-star').nth(3)).toBeVisible({ timeout: 15_000 });
    return page;
  };
  const a = await open();
  const b = await open();
  const stars = (page) => page.evaluate(() => Object.fromEntries(JSON.parse(localStorage.getItem('ifs.parts') ?? '[]').map((part) => [part.name, !!part.star])));
  const nameAt = (page, index) => page.locator('.part-card .pc-name').nth(index).innerText();

  const first = await nameAt(a, 2);
  const second = await nameAt(b, 3);
  expect(first).not.toBe(second);
  await a.locator('.part-card .pc-star').nth(2).click();
  await expect.poll(async () => first in (await stars(a))).toBe(true);
  const afterA = await stars(a);

  // Tab B edits a different part. Tab A's change must still be there.
  await b.locator('.part-card .pc-star').nth(3).click();
  await expect.poll(() => stars(b)).toEqual({ ...afterA, [second]: !afterA[second] });
});

// Fourth pass, finding 3: a Journal save in one tab erased the other tab's entry.
test('journal entries saved in two tabs are both kept', async ({ context }) => {
  await context.route(/googleapis\.com|firebaseio\.com|\/api\//, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('ifs.lang')) localStorage.setItem('ifs.lang', '"en"');
    localStorage.setItem('ifs.onboarded', 'true');
    localStorage.setItem('ifs.help.seen', 'true');
  });
  const open = async () => {
    const page = await context.newPage();
    await page.goto('/');
    await page.getByRole('button', { name: /Journal/ }).first().click();
    await expect(page.getByLabel('What happened?')).toBeVisible({ timeout: 15_000 });
    return page;
  };
  const a = await open();
  const b = await open();
  const write = async (page, text) => {
    await page.getByLabel('What happened?').fill(text);
    await page.getByRole('dialog').getByRole('button', { name: /Save/ }).first().click();
  };
  await write(b, 'from tab B');
  await expect.poll(() => b.evaluate(() => localStorage.getItem('ifs.journal'))).toContain('from tab B');
  await write(a, 'from tab A');
  await expect.poll(() => a.evaluate(() => JSON.parse(localStorage.getItem('ifs.journal') ?? '[]').map((e) => e.what).sort()))
    .toEqual(['from tab A', 'from tab B']);
});

// Eighth pass, finding 4: after another tab switched language, this tab showed the other language's names.
import { readFileSync } from 'node:fs';
import { settled } from './settle.mjs';
const CANONICAL_INPUT = readFileSync(new URL('./fixtures/canonical-input.json', import.meta.url), 'utf8');

test('a language switch in another tab leaves this tab in its own language', async ({ context }) => {
  await context.route(/googleapis\.com|firebaseio\.com|\/api\//, (route) => route.abort());
  await context.addInitScript((input) => {
    if (!localStorage.getItem('ifs.lang')) localStorage.setItem('ifs.lang', '"ru"');
    localStorage.setItem('ifs.onboarded', 'true');
    localStorage.setItem('ifs.help.seen', 'true');
    if (!localStorage.getItem('INNERVERSE_PROFILE_V1')) localStorage.setItem('INNERVERSE_PROFILE_V1', input);
  }, CANONICAL_INPUT);
  const a = await context.newPage();
  await a.goto('/');
  await expect.poll(() => a.evaluate(() => JSON.parse(localStorage.getItem('ifs.profile') ?? 'null')?.testModel), { timeout: 45_000 }).toBe('angular-v2');
  const b = await context.newPage();
  await b.goto('/');
  const language = await settled(b.getByRole('button', { name: /Язык/ }).first(), 45_000);
  // The row toggles, so click again only while this tab is still in Russian.
  await expect(async () => {
    if (await b.evaluate(() => document.documentElement.lang) === 'ru') await language.click();
    await expect.poll(() => b.evaluate(() => document.documentElement.lang), { timeout: 3_000 }).toBe('en');
  }).toPass({ timeout: 45_000 });
  // Tab B saved English names; tab A must keep showing Russian ones. Tab B re-translates the profile after its
  // language change. On a loaded runner the waits in this test need more headroom than 15 s, so they allow 45 s.
  await expect.poll(() => a.evaluate(() => JSON.parse(localStorage.getItem('ifs.parts') ?? '[]').some((p) => p.name === 'Taskmaster')), { timeout: 45_000 }).toBe(true);
  await expect(a.getByText('Taskmaster')).toHaveCount(0, { timeout: 45_000 });
  await expect(a.getByText('Деятель').first()).toBeVisible({ timeout: 45_000 });
});

// ArchetypeAI-0oajw: a language switch must reach storage even when another tab's write arrives while it is being
// translated. One tab is enough: the storage event a second tab would send is dispatched right after the click.
// This guards the ordering; the narrower window (the write cancelling the switch before it saves) is fixed in app.jsx
// by keeping the switch pending until a run writes it, and cannot be timed reliably from a browser test.
test('a language switch made while another tab writes is still saved in the new language', async ({ page }) => {
  await page.route(/googleapis\.com|firebaseio\.com|\/api\//, (route) => route.abort());
  await page.addInitScript((input) => {
    if (!localStorage.getItem('ifs.lang')) localStorage.setItem('ifs.lang', '"ru"');
    localStorage.setItem('ifs.onboarded', 'true');
    localStorage.setItem('ifs.help.seen', 'true');
    if (!localStorage.getItem('INNERVERSE_PROFILE_V1')) localStorage.setItem('INNERVERSE_PROFILE_V1', input);
  }, CANONICAL_INPUT);
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('ifs.parts') ?? '[]').some((p) => p.name === 'Деятель')), { timeout: 45_000 }).toBe(true);
  const language = await settled(page.getByRole('button', { name: /Язык/ }).first(), 45_000);
  // The other tab's write arrives after this tab's switch has started translating, before that translation is saved.
  await language.evaluate(async (button) => {
    button.click();
    await new Promise((resolve) => queueMicrotask(resolve));
    window.dispatchEvent(new StorageEvent('storage', { key: 'ifs.parts', storageArea: localStorage, newValue: localStorage.getItem('ifs.parts') }));
  });
  await expect.poll(() => page.evaluate(() => document.documentElement.lang), { timeout: 15_000 }).toBe('en');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('ifs.parts') ?? '[]').some((p) => p.name === 'Taskmaster')), { timeout: 45_000 }).toBe(true);
});
