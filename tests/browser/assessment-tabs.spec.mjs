import { test, expect } from '@playwright/test';

const stored64 = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('ARCHETYPE_ASSESSMENT_RESPONSES')));

test.beforeEach(async ({ context }) => {
  // Real UI and local data; no production identity, AI or Firestore writes.
  await context.route(/googleapis\.com|firebaseio\.com|\/api\//, (route) => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem('ifs.lang', '"en"');
    localStorage.setItem('ifs.onboarded', 'true');
    localStorage.setItem('ifs.help.seen', 'true');
  });
});

test('two tabs editing the 64-item reflection resolve the conflict explicitly', async ({ context }) => {
  const first = await context.newPage();
  await first.goto('/');
  await first.getByRole('button', { name: /64/ }).first().click();
  await first.getByRole('button', { name: 'Reflect & Choose' }).click();
  await first.getByRole('radio', { name: /^2\./ }).click();
  await expect(first.getByRole('status').filter({ hasText: 'Saved on this device.' })).toBeVisible();

  // A second tab resumes the same draft and answers the next question differently.
  const second = await context.newPage();
  await second.goto('/');
  await second.getByRole('button', { name: /64/ }).first().click();
  // It resumes at the next unanswered question.
  await second.getByRole('radio', { name: /^5\./ }).click();
  expect((await stored64(second)).slice(0, 2)).toEqual([2, 5]);

  // The first tab is told, and stops saving until the user chooses.
  const notice = first.getByRole('alert').filter({ hasText: 'This assessment changed in another tab' });
  await expect(notice).toBeVisible();
  await first.getByRole('radio', { name: /^3\./ }).click();
  expect((await stored64(first)).slice(0, 2)).toEqual([2, 5]);

  // Keeping this tab's answers writes them deliberately.
  await first.getByRole('button', { name: "Keep this tab's answers" }).click();
  await expect(notice).toHaveCount(0);
  expect((await stored64(first)).slice(0, 2)).toEqual([2, 3]);

  // The second tab now sees the change and can adopt it.
  const secondNotice = second.getByRole('alert').filter({ hasText: 'This assessment changed in another tab' });
  await expect(secondNotice).toBeVisible();
  await second.getByRole('button', { name: "Use the other tab's answers" }).click();
  await expect(secondNotice).toHaveCount(0);
  await expect(second.getByRole('status').filter({ hasText: 'Saved on this device.' })).toBeVisible();
  expect((await stored64(second)).slice(0, 2)).toEqual([2, 3]);
});

const stored147 = (page) => page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('INNERVERSE_DESCENT_V2')).answers).sort());

test('two tabs editing the 147-item battery resolve the conflict explicitly', async ({ context }) => {
  const first = await context.newPage();
  await first.goto('/');
  await first.getByRole('button', { name: /Start.*147/i }).first().click();
  await first.locator('.btn.primary').click();
  await first.getByRole('radio').nth(1).click();
  await expect(first.getByRole('status').filter({ hasText: 'Saved on this device.' })).toBeVisible();

  const second = await context.newPage();
  await second.goto('/');
  await second.getByRole('button', { name: /Start.*147/i }).first().click();
  await second.getByRole('radio').nth(4).click();
  expect(await stored147(second)).toEqual([2, 5]);

  const notice = first.getByRole('alert').filter({ hasText: 'This assessment changed in another tab' });
  await expect(notice).toBeVisible();
  await first.getByRole('radio').nth(2).click();
  expect(await stored147(first)).toEqual([2, 5]);

  await first.getByRole('button', { name: "Keep this tab's answers" }).click();
  await expect(notice).toHaveCount(0);
  expect(await stored147(first)).toEqual([2, 3]);

  const secondNotice = second.getByRole('alert').filter({ hasText: 'This assessment changed in another tab' });
  await expect(secondNotice).toBeVisible();
  await second.getByRole('button', { name: "Use the other tab's answers" }).click();
  await expect(secondNotice).toHaveCount(0);
  expect(await stored147(second)).toEqual([2, 3]);
});
