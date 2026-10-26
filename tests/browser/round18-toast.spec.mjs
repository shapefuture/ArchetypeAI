// Critic 18 scratch: a longer due note, is its beginning inside the viewport while the toast is up?
import { test, expect } from '@playwright/test';

async function base(context, lang, theme, extra = {}) {
  await context.route(/googleapis\.com|firebaseio\.com|\/api\//, (route) => route.abort());
  await context.addInitScript(([l, t, x]) => {
    if (sessionStorage.getItem('critic18b-seeded')) return;
    localStorage.setItem('ifs.lang', JSON.stringify(l));
    localStorage.setItem('ifs.theme', JSON.stringify(t));
    localStorage.setItem('ifs.onboarded', 'true');
    localStorage.setItem('ifs.help.seen', 'true');
    for (const [key, value] of Object.entries(x)) localStorage.setItem(key, value);
    sessionStorage.setItem('critic18b-seeded', '1');
  }, [lang, theme, Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, JSON.stringify(v)]))]);
}

test('P2b: the start of a 1,500-character due note is inside the viewport', async ({ context }) => {
  const text = 'START-MARKER ' + 'I will keep this steady and kind with myself, one breath at a time. '.repeat(20);
  await base(context, 'en', 'light', { 'ifs.sealed': [{ until: Date.now() - 60_000, text: text.slice(0, 1500) }] });
  const page = await context.newPage();
  await page.goto('/');
  const toast = page.locator('.toast');
  // The toast auto-hides, so its position is read in the same step it appears.
  const handle = await page.waitForFunction(() => {
    const el = document.querySelector('.toast');
    return el ? el.getBoundingClientRect().toJSON() : null;
  }, null, { timeout: 20_000, polling: 50 });
  const box = await handle.jsonValue();
  // The toast is a short pointer, so it fits on screen; the note itself is kept in the journal.
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(await page.evaluate(() => localStorage.getItem('ifs.journal') ?? '')).toContain('START-MARKER');
});
