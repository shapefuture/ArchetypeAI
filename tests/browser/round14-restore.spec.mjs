// Round 14 critic scratch: restore a backup whose part has an object-valued need, then open the Cabinet.
import { test, expect } from '@playwright/test';

const PART = (extra) => ({
  id: 'p-mine', name: 'Mine', family: 'manager',
  traits: { shape: 'bean', color: '#3B9BFF', eyes: 'ovals', mouth: 'smile', head: 'none', face: 'none', bow: false, cheeks: false },
  role: 'keeps order', blurb: 'b', energy: 50, burden: 'carries plans', need: 'to be heard', voice: 'v', star: false, since: 'now', ...extra,
});

for (const [label, extra] of [['object need', { need: { nested: 1 } }], ['object role', { role: { nested: 1 } }], ['string need control', { need: 'to be heard' }]]) {
  test(`restored part with ${label}: the Cabinet still opens`, async ({ page }) => {
    await page.route(/googleapis\.com|firebaseio\.com|\/api\//, (route) => route.abort());
    await page.addInitScript(() => {
      localStorage.setItem('ifs.lang', '"en"');
      localStorage.setItem('ifs.onboarded', 'true');
      localStorage.setItem('ifs.help.seen', 'true');
    });
    await page.goto('/');
    await page.getByRole('button', { name: /Restore.*JSON|Restore/i }).first().click();
    const backup = { schema: 'parts-cartographer.backup.v2', data: { 'ifs.lang': 'en', 'ifs.parts': [PART(extra)] } };
    await page.locator('input[type=file]').setInputFiles({ name: 'part.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
    await page.getByRole('button', { name: 'Restore this backup' }).click();
    await page.waitForTimeout(1500);
    // The damaged part is never written to storage.
    expect(await page.evaluate(() => localStorage.getItem('ifs.parts') ?? '')).not.toContain('nested');
    await page.getByRole('button', { name: /Cabinet/ }).first().click();
    await page.waitForTimeout(1500);
    await page.locator('.part-card').first().click().catch((e) => console.log('CLICK-FAIL', String(e).slice(0, 120)));
    await page.waitForTimeout(2000);
    const alerts = await page.locator('[role="alert"]').allInnerTexts();
    expect(alerts.filter((text) => text.includes('did not open'))).toEqual([]);
  });
}
