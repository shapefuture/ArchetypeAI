// Critic 18 scratch checks against the built app (npm run build && npm run preview).
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const summarize = (violations) => violations.flatMap((v) => v.nodes.map((n) => `${n.target.join(' ')} :: ${n.any.map((a) => a.message).join(' | ')}`));

async function base(context, lang, theme, extra = {}) {
  await context.route(/googleapis\.com|firebaseio\.com|\/api\//, (route) => route.abort());
  await context.addInitScript(([l, t, x]) => {
    if (sessionStorage.getItem('critic18-seeded')) return;
    localStorage.setItem('ifs.lang', JSON.stringify(l));
    localStorage.setItem('ifs.theme', JSON.stringify(t));
    localStorage.setItem('ifs.onboarded', 'true');
    localStorage.setItem('ifs.help.seen', 'true');
    for (const [key, value] of Object.entries(x)) localStorage.setItem(key, value);
    sessionStorage.setItem('critic18-seeded', '1');
  }, [lang, theme, Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, JSON.stringify(v)]))]);
}

// P1. A verdict is sealed while localStorage is full. The toast must not say "sealed" for a verdict that was not kept.
test('P1: sealing a verdict on a full device does not report success', async ({ context }) => {
  await base(context, 'en', 'light');
  const page = await context.newPage();
  await page.goto('/?go=checkin');
  await expect(page.getByText('Daily check-in').first()).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Hyper', exact: true }).click();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await page.getByRole('button', { name: 'Log without a part', exact: true }).click();
  await expect(page.getByText('Logged. The weather shifts.')).toBeVisible({ timeout: 10_000 });
  // Fill the origin's storage until the next write fails.
  await page.evaluate(() => {
    for (const size of [1 << 22, 1 << 20, 1 << 16, 1 << 12, 1 << 8, 1 << 4, 1]) {
      for (let n = 0; ; n += 1) {
        try { localStorage.setItem(`filler-${size}-${n}`, 'x'.repeat(size)); } catch { break; }
      }
    }
  });
  const textarea = page.locator('textarea').last();
  await textarea.fill('The conclusion I will keep');
  await page.getByRole('button', { name: 'Seal it', exact: true }).click();
  const toast = page.locator('.toast');
  await expect(toast).toBeVisible({ timeout: 5_000 });
  const observed = {
    toast: await toast.innerText(),
    draftLeft: await page.locator('textarea').last().inputValue(),
    stored: await page.evaluate(() => localStorage.getItem('INNERVERSE_SEALED_VERDICTS_V1')),
  };
  // Expected: the warning is shown (or the text stays in the box), and nothing claims it was sealed.
  // Observed: the toast says sealed, the draft is gone and nothing was stored.
  expect(observed.toast.toLowerCase()).not.toContain('sealed');
  expect(observed.draftLeft === 'The conclusion I will keep' || observed.stored !== null).toBe(true);
});

// P2. A due sealed note: how long it stays readable and stored.
test('P2: a due sealed note stays readable or stored after its toast', async ({ context }) => {
  const text = 'Long note: '.concat('I will remember this lake and the quiet of the morning. '.repeat(10)).slice(0, 600);
  await base(context, 'en', 'light', { 'ifs.sealed': [{ until: Date.now() - 60_000, text }] });
  const page = await context.newPage();
  await page.goto('/');
  const toast = page.locator('.toast');
  await expect(toast).toBeVisible({ timeout: 20_000 });
  const box = await toast.boundingBox();
  const viewport = page.viewportSize();
  await page.waitForTimeout(4_500);
  const after = {
    stored: await page.evaluate(() => localStorage.getItem('ifs.sealed')),
    toastVisible: await toast.isVisible().catch(() => false),
  };
  // The note moves into the journal, which keeps it; the toast is only a pointer to it.
  const journal = await page.evaluate(() => localStorage.getItem('ifs.journal') ?? '');
  expect(journal.includes('Long note')).toBe(true);
  expect(after.stored === null || !after.stored.includes('Long note')).toBe(true);
});

// P3. Sealed verdict card (due verdict on the check-in), color-contrast on, both languages and themes.
for (const lang of ['en', 'ru']) {
  for (const theme of ['light', 'dark']) {
    test(`P3: due sealed verdict card has no color-contrast violations (${lang}, ${theme})`, async ({ context }) => {
      const past = new Date(Date.now() - 3 * 86400000).toISOString();
      const due = new Date(Date.now() - 86400000).toISOString();
      await base(context, lang, theme, {
        INNERVERSE_SEALED_VERDICTS_V1: [{ text: 'I always get it wrong when people are near', createdAt: past, resurfacesAt: due }],
      });
      const page = await context.newPage();
      await page.goto('/?go=checkin');
      await expect(page.locator('.overlay').first()).toBeVisible({ timeout: 30_000 });
      await expect(page.locator('blockquote').first()).toBeVisible({ timeout: 10_000 });
      const r = await new AxeBuilder({ page }).include('.overlay').withRules(['color-contrast']).analyze();
      expect(summarize(r.violations), `${lang} ${theme}`).toEqual([]);
    });
  }
}
