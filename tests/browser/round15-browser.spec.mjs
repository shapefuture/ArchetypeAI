// Gauntlet 15 scratch (critic): end-to-end reproductions against the built app.
import { test, expect } from '@playwright/test';

const PART = (extra) => ({
  id: 'p-mine', name: 'Mine', family: 'manager',
  traits: { shape: 'bean', color: '#3B9BFF', eyes: 'ovals', mouth: 'smile', head: 'none', face: 'none', bow: false, cheeks: false },
  role: 'keeps order', blurb: 'b', energy: 50, burden: 'carries plans', need: 'to be heard', voice: 'v', star: false, since: 'now', ...extra,
});

const MANAGERS = ['taskmaster', 'inner_critic', 'pleaser', 'controller', 'analyst', 'hermit', 'bypasser'];
const FIREFIGHTERS = ['numb', 'rebel', 'charmer'];
const EXILES = ['abandoned', 'ashamed', 'frightened', 'unseen'];
const RESOURCE_IDS = ['sage', 'warrior', 'caregiver', 'explorer'];
const canonicalInput = () => ({
  shadow: Object.fromEntries([...MANAGERS, ...FIREFIGHTERS, ...EXILES].map((id) => [id, [4, 4, 4, 4, 4, 4, 4, 4]])),
  resources: Object.fromEntries(RESOURCE_IDS.map((id) => [id, [4, 4, 4, 4, 4, 4]])),
  self: [4, 4, 4, 4, 4, 4, 4, 4],
  validity: { attention: 4, infrequency: [4, 4] },
});

async function open(page) {
  await page.route(/googleapis\.com|firebaseio\.com|\/api\//, (route) => route.abort());
  await page.addInitScript(() => {
    if (sessionStorage.getItem('g15')) return;
    sessionStorage.setItem('g15', '1');
    localStorage.setItem('ifs.lang', '"en"');
    localStorage.setItem('ifs.onboarded', 'true');
    localStorage.setItem('ifs.help.seen', 'true');
  });
  await page.goto('/');
}

async function restore(page, data) {
  await page.getByRole('button', { name: /Restore.*JSON|Restore/i }).first().click();
  await page.locator('input[type=file]').setInputFiles({
    name: 'backup.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ schema: 'parts-cartographer.backup.v2', data })),
  });
  await page.getByRole('button', { name: 'Restore this backup' }).click();
  await page.waitForTimeout(1200);
}

test('e2e: a journal entry whose kind is an object opens the Journal without a React crash', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error).slice(0, 160)));
  await open(page);
  await restore(page, { 'ifs.lang': 'en', 'ifs.journal': [{ id: 'j1', at: 1761350400000, kind: { nested: 1 }, what: 'restored entry', where: '', part: '', note: '' }] });
  await page.locator('.dock-fab').click();
  await page.waitForTimeout(1500);
  const alerts = await page.locator('[role="alert"]').allInnerTexts();
  expect(alerts.filter((text) => text.includes('did not open'))).toEqual([]);
});

test('e2e control: a journal entry with a string kind opens the Journal', async ({ page }) => {
  await open(page);
  await restore(page, { 'ifs.lang': 'en', 'ifs.journal': [{ id: 'j2', at: 1761350400000, kind: 'jThought', what: 'restored entry', where: '', part: '', note: '' }] });
  await page.locator('.dock-fab').click();
  await page.waitForTimeout(1500);
  const alerts = await page.locator('[role="alert"]').allInnerTexts();
  expect(alerts.filter((text) => text.includes('did not open'))).toEqual([]);
  await expect(page.getByText('restored entry')).toBeVisible();
});

test('e2e: a restored part with an object nameEn does not take the Universe screen down', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error).slice(0, 160)));
  await open(page);
  await restore(page, { 'ifs.lang': 'en', 'ifs.parts': [PART({ id: 'p-odd', nameEn: { nested: 1 } })] });
  await page.getByRole('button', { name: /Universe/ }).first().click();
  await page.waitForTimeout(2500);
  const alerts = await page.locator('[role="alert"]').allInnerTexts();
  expect(alerts.filter((text) => text.includes('did not open'))).toEqual([]);
});
