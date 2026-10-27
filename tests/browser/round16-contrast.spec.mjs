import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Scratch critic check: the existing suites disable color-contrast everywhere, so this turns it back on.
for (const lang of ['en', 'ru']) {
  for (const theme of ['light', 'dark']) {
    test(`Universe tray has no color-contrast violations (${lang}, ${theme})`, async ({ page }) => {
      await page.route(/googleapis\.com|firebaseio\.com|\/api\//, (route) => route.abort());
      await page.addInitScript(([l, t]) => {
        localStorage.setItem('ifs.lang', JSON.stringify(l));
        localStorage.setItem('ifs.theme', JSON.stringify(t));
        localStorage.setItem('ifs.onboarded', 'true');
        localStorage.setItem('ifs.help.seen', 'true');
      }, [lang, theme]);
      await page.goto('/?go=universe');
      const tray = page.locator('.tray-btn').first();
      await expect(tray).toBeVisible({ timeout: 30_000 });
      const accessibility = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
      const summary = accessibility.violations.flatMap((v) => v.nodes.map((n) => `${n.target.join(' ')} :: ${n.any.map((a) => a.message).join(' | ')}`));
      expect(summary, `${lang} ${theme}`).toEqual([]);
    });
  }
}
