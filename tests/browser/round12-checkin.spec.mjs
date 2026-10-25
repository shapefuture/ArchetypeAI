// Round 12 critic scratch: the softening card is consumed although it was never on screen.
import { test, expect } from '@playwright/test';

const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(12, 0, 0, 0); return d.toISOString(); };

test('R12-7 a sealed verdict that resurfaces during a visit consumes the softening card unseen', async ({ page }) => {
  const rows = [
    ...[35, 40, 45, 50].map((n) => ({ date: daysAgo(n), arousal: 2, confirmedPart: 'numb' })),
    ...[5, 10, 15, 20].map((n, i) => ({ date: daysAgo(n), arousal: 0, ...(i === 0 ? { confirmedPart: 'numb' } : {}) })),
  ];
  await page.addInitScript((data) => {
    if (sessionStorage.getItem('r12-seeded')) return;
    sessionStorage.setItem('r12-seeded', '1');
    localStorage.setItem('ifs.lang', '"en"');
    localStorage.setItem('ifs.onboarded', 'true');
    localStorage.setItem('INNERVERSE_CHECKINS_V1', JSON.stringify(data.rows));
    // Not due at page load; due 25 seconds later, during the visit (the test waits for it).
    localStorage.setItem('INNERVERSE_SEALED_VERDICTS_V1', JSON.stringify([{
      text: 'I always fail at this', createdAt: new Date(Date.now() - 48 * 3600e3).toISOString(),
      resurfacesAt: new Date(Date.now() + 25000).toISOString(),
    }]));
  }, { rows });

  await page.goto('/?go=checkin');
  await expect(page.getByText('Where are you right now?')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'In my window' }).click();
  await page.getByRole('button', { name: 'Skip' }).click();
  const dueAt = await page.evaluate(() => Date.parse(JSON.parse(localStorage.getItem('INNERVERSE_SEALED_VERDICTS_V1'))[0].resurfacesAt));
  await page.waitForTimeout(Math.max(0, dueAt - Date.now()) + 1500); // the verdict comes due while the person is still on the question
  await page.getByRole('button', { name: 'Log without a part' }).click();

  // The done stage renders the verdict card, not the softening card.
  await expect(page.getByText('I always fail at this')).toBeVisible();
  await expect(page.getByText('Numb is softening')).toHaveCount(0);
  // Expected: the once-only card is not consumed while it is off screen. Observed: it is written.
  const consumed = await page.evaluate(() => localStorage.getItem('INNERVERSE_UNBURDENED_V1'));
  expect.soft(consumed, 'softening card key written while the card is not on screen').toBeNull();

  // The person closes the check-in without rating the verdict.
  await page.getByRole('button', { name: 'Close' }).first().click();
  await expect(page.getByText('Where are you right now?')).toHaveCount(0);

  // A later visit, after the verdict is rated, never shows the card.
  await page.goto('/?go=checkin');
  await expect(page.getByText('I always fail at this')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'still true' }).click();
  await expect(page.getByText('Where are you right now?')).toBeVisible();
  await page.getByRole('button', { name: 'In my window' }).click();
  await page.getByRole('button', { name: 'Skip' }).click();
  await page.getByRole('button', { name: 'Log without a part' }).click();
  await expect(page.getByText('Logged. The weather shifts.')).toBeVisible();
  // Expected: the softening card is shown once, on the first visit that reaches the done stage.
  await expect(page.getByText('Numb is softening')).toBeVisible();
});
