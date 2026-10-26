// Critic 17 scratch checks: due sealed notes, populated Journal and restore preview under axe, malformed profile family.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
const OUT = process.env.ROUND17_OUT ?? '/tmp/round17-checks';

const summarize = (violations) => violations.flatMap((v) => v.nodes.map((n) => `${n.target.join(' ')} :: ${n.any.map((a) => a.message).join(' | ')}`));

async function base(context, lang, theme, extra = {}) {
  await context.route(/googleapis\.com|firebaseio\.com|\/api\//, (route) => route.abort());
  await context.addInitScript(([l, t, x]) => {
    localStorage.setItem('ifs.lang', JSON.stringify(l));
    localStorage.setItem('ifs.theme', JSON.stringify(t));
    localStorage.setItem('ifs.onboarded', 'true');
    localStorage.setItem('ifs.help.seen', 'true');
    for (const [key, value] of Object.entries(x)) {
      if (!sessionStorage.getItem('critic-seeded')) localStorage.setItem(key, value);
    }
    sessionStorage.setItem('critic-seeded', '1');
  }, [lang, theme, Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, JSON.stringify(v)]))]);
}

// A. Two sealed notes come due together. Both were written to be shown on open.
test('A: every due sealed note is shown or kept, not only the first', async ({ context }) => {
  await base(context, 'en', 'light', {
    'ifs.sealed': [
      { until: Date.now() - 60_000, text: 'FIRST due note' },
      { until: Date.now() - 30_000, text: 'SECOND due note' },
    ],
  });
  await context.addInitScript(() => {
    window.__seen = [];
    new MutationObserver(() => {
      const text = document.body?.innerText ?? '';
      for (const line of text.split('\n')) if (/due note/.test(line) && !window.__seen.includes(line)) window.__seen.push(line);
    }).observe(document, { subtree: true, childList: true, characterData: true });
  });
  const page = await context.newPage();
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => window.__seen.some((line) => line.includes('FIRST due note'))), { timeout: 20_000 }).toBe(true);
  await page.waitForTimeout(2500);
  const stored = await page.evaluate(() => localStorage.getItem('ifs.sealed'));
  const seen = await page.evaluate(() => window.__seen);
  mkdirSync(OUT, { recursive: true });
  // Expected: the second note is displayed or still stored. Observed: neither.
  expect(seen.some((line) => line.includes('SECOND due note')) || (stored ?? '').includes('SECOND due note')).toBe(true);
});

// B. Populated Journal, color-contrast on, both languages and themes.
for (const lang of ['en', 'ru']) {
  for (const theme of ['light', 'dark']) {
    test(`B: populated Journal has no color-contrast violations (${lang}, ${theme})`, async ({ context }) => {
      const now = Date.now();
      await base(context, lang, theme, {
        'ifs.journal': [
          { id: now - 3, at: now - 3, kind: 'jTrigger', what: 'Boss sent a late message', where: 'office', part: 'Taskmaster', note: '' },
          { id: now - 2, at: now - 2, kind: 'jThought', what: 'I should have replied sooner', where: '', part: 'Inner Critic', note: 'felt tight in the chest' },
          { id: now - 1, at: now - 1, kind: 'jPattern', what: 'Went quiet after the call', where: 'home', part: '', note: '' },
        ],
      });
      const page = await context.newPage();
      await page.goto('/');
      await page.locator('.dock-fab').click();
      await expect(page.locator('.overlay').first()).toBeVisible({ timeout: 20_000 });
      const r = await new AxeBuilder({ page }).include('.overlay').withRules(['color-contrast']).analyze();
      expect(summarize(r.violations), `${lang} ${theme}`).toEqual([]);
    });
  }
}

// C. Restore preview after choosing a backup file, color-contrast on.
const RESTORE_FILE = JSON.stringify({
  schema: 'parts-cartographer.backup.v2',
  exportedAt: new Date().toISOString(),
  data: {
    'ifs.lang': 'en',
    'ifs.journal': [{ id: 1, at: 1, kind: 'jTrigger', what: 'restored note', where: '', part: '', note: '' }],
    'INNERVERSE_CHECKINS_V1': [{ date: '2026-10-20T10:00:00.000Z', arousal: 1, confirmedPart: 'numb', eventType: 'loss' }],
  },
});
for (const lang of ['en', 'ru']) {
  for (const theme of ['light', 'dark']) {
    test(`C: restore preview has no color-contrast violations (${lang}, ${theme})`, async ({ context }) => {
      await base(context, lang, theme, {});
      const page = await context.newPage();
      await page.goto('/');
      await page.getByRole('button', { name: /Restore|Восстан|Бэкап|Экспорт|Export/ }).first().click({ timeout: 20_000 });
      await expect(page.locator('input[type=file]').first()).toBeAttached({ timeout: 20_000 });
      mkdirSync(OUT, { recursive: true });
      writeFileSync(`${OUT}/restore.json`, RESTORE_FILE);
      await page.locator('input[type=file]').first().setInputFiles(`${OUT}/restore.json`);
      await page.waitForTimeout(1500);
      const r = await new AxeBuilder({ page }).include('.overlay').withRules(['color-contrast']).analyze();
      expect(summarize(r.violations), `${lang} ${theme}`).toEqual([]);
    });
  }
}

// E. Check-in charter card (dual_bound_charter) after a lapse, color-contrast on, both languages and themes.
import { readFileSync } from 'node:fs';
const CANONICAL_INPUT = readFileSync(new URL('./fixtures/canonical-input.json', import.meta.url), 'utf8');
for (const lang of ['en', 'ru']) {
  for (const theme of ['light', 'dark']) {
    test(`E: check-in charter card has no color-contrast violations (${lang}, ${theme})`, async ({ context }) => {
      await context.route(/googleapis\.com|firebaseio\.com|\/api\//, (route) => route.abort());
      await context.addInitScript(([l, t, input]) => {
        localStorage.setItem('ifs.lang', JSON.stringify(l));
        localStorage.setItem('ifs.theme', JSON.stringify(t));
        localStorage.setItem('ifs.onboarded', 'true');
        localStorage.setItem('ifs.help.seen', 'true');
        if (!localStorage.getItem('INNERVERSE_PROFILE_V1')) localStorage.setItem('INNERVERSE_PROFILE_V1', input);
      }, [lang, theme, CANONICAL_INPUT]);
      const page = await context.newPage();
      await page.goto('/');
      await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('ifs.profile') ?? 'null')?.testModel), { timeout: 20_000 }).toBe('angular-v2');
      const names = await page.evaluate((l) => {
        const p = JSON.parse(localStorage.getItem('ifs.profile'));
        const idx = 7; // numb in SHADOW_PARTS order
        return (l === 'ru' ? p.subtypesRu?.[idx] : p.subtypesEn?.[idx]) ?? p.clinical?.subtypes?.numb?.name;
      }, lang);
      await page.goto('/?go=checkin');
      await expect(page.locator('.overlay').first()).toBeVisible({ timeout: 20_000 });
      await page.getByRole('button', { name: lang === 'ru' ? 'Низко' : 'Low', exact: true }).click();
      await page.locator('.overlay .chip').first().click({ timeout: 10_000 });
      const correct = page.getByRole('button', { name: lang === 'ru' ? 'Нет — руль держал другой' : 'No — someone else had the wheel', exact: true });
      if (await correct.count()) await correct.click();
      await page.locator('.overlay .chip').filter({ hasText: names }).first().click({ timeout: 10_000 });
      await expect(page.getByText(lang === 'ru' ? 'Вина' : 'Blame', { exact: false }).first()).toBeVisible({ timeout: 15_000 });
      const r = await new AxeBuilder({ page }).include('.overlay').withRules(['color-contrast']).analyze();
      expect(summarize(r.violations), `${lang} ${theme}`).toEqual([]);
    });
  }
}

// D. A backup whose saved profile has a part with an unknown family is accepted by restore and then
// the Report cannot open. Control: the same backup with a valid family opens the Report.
function profileBackup(family) {
  return JSON.stringify({
    schema: 'parts-cartographer.backup.v2',
    exportedAt: new Date().toISOString(),
    data: {
      'ifs.lang': 'en',
      'ifs.profile': {
        parts: [{ id: 'odd-1', name: 'Odd', family, energy: 50 }],
        headlineConstellation: 'Odd Constellation',
        selfEnergyRadar: {}, needHunger: {}, polarizations: [], copingStack: [], complexes: [],
      },
    },
  });
}
// A profile whose part family the screens cannot draw is refused on restore (the rest of the file is kept),
// so the Report opens from the device's own data. Before the fix the Report failed to open.
for (const [label, family] of [['control (valid family)', 'manager'], ['malformed family', 'protector']]) {
  test(`D ${label}: restored profile, then Report`, async ({ context }) => {
    await base(context, 'en', 'light', {});
    const page = await context.newPage();
    await page.goto('/');
    await page.getByRole('button', { name: /Restore|Восстан|Экспорт|Export/ }).first().click({ timeout: 20_000 });
    await expect(page.locator('input[type=file]').first()).toBeAttached({ timeout: 20_000 });
    mkdirSync(OUT, { recursive: true });
    const file = `${OUT}/profile-${family}.json`;
    writeFileSync(file, profileBackup(family));
    await page.locator('input[type=file]').first().setInputFiles(file);
    await page.getByRole('button', { name: /Restore this backup|Восстановить эту копию/ }).first().click({ timeout: 20_000 });
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: /Отчёт|Report/ }).first().click({ timeout: 20_000 });
    await page.waitForTimeout(1500);
    const bodyText = await page.locator('body').innerText();
    const opened = !/did not open/.test(bodyText);
    writeFileSync(`${OUT}/profile-${family}-result.json`, JSON.stringify({ opened, bodyText: bodyText.slice(0, 300) }, null, 2));
    expect(opened, label).toBe(true);
    if (family === 'protector') expect(await page.evaluate(() => localStorage.getItem('ifs.profile') ?? '')).not.toContain('protector');
  });
}
