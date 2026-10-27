// Critic 18 scratch: color-contrast on the synastry overlay (empty state) in both languages and themes.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const summarize = (violations) => violations.flatMap((v) => v.nodes.map((n) => `${n.target.join(' ')} :: ${n.any.map((a) => a.message).join(' | ')}`));

async function base(context, lang, theme) {
  await context.route(/googleapis\.com|firebaseio\.com|\/api\//, (route) => route.abort());
  await context.addInitScript(([l, t]) => {
    localStorage.setItem('ifs.lang', JSON.stringify(l));
    localStorage.setItem('ifs.theme', JSON.stringify(t));
    localStorage.setItem('ifs.onboarded', 'true');
    localStorage.setItem('ifs.help.seen', 'true');
  }, [lang, theme]);
}

for (const lang of ['en', 'ru']) {
  for (const theme of ['light', 'dark']) {
    test(`P4: synastry overlay has no color-contrast violations (${lang}, ${theme})`, async ({ context }) => {
      await base(context, lang, theme);
      const page = await context.newPage();
      await page.goto('/');
      const label = lang === 'ru' ? 'Сравнение' : 'Synastry';
      const opener = page.getByRole('button', { name: new RegExp(label) }).first();
      await expect(opener).toBeVisible({ timeout: 30_000 });
      await opener.click();
      await expect(page.locator('.overlay').first()).toBeVisible({ timeout: 20_000 });
      const r = await new AxeBuilder({ page }).include('.overlay').withRules(['color-contrast']).analyze();
      expect(summarize(r.violations), `${lang} ${theme}`).toEqual([]);
    });
  }
}
