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
