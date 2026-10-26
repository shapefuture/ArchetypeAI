// Round 22 probe (critic): restoring an archived report from History must restore that report's part scores.
// clinical-report.jsx restoreHistory builds each part as { ...rebuilt-from-archive, ...current-device-part, ... },
// so the device's current energy/felt/somatic/scoreT overwrite the archived report's scores.
// The app's profile-change effect (app.jsx) rebuilds names and archetypes but not energy.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const canonical = JSON.parse(readFileSync(new URL('./fixtures/canonical-input.json', import.meta.url), 'utf8'));

test('restoring an archived report puts that report\'s part scores on the map', async ({ page }) => {
  await page.route(/googleapis\.com|firebaseio\.com|\/api\//, (route) => route.abort());
  await page.addInitScript((input) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('ifs.lang', '"en"');
    localStorage.setItem('ifs.onboarded', 'true');
    localStorage.setItem('ifs.help.seen', 'true');
    localStorage.setItem('INNERVERSE_PROFILE_V1', JSON.stringify(input));
  }, canonical);
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => !!localStorage.getItem('ifs.profile')), { timeout: 20_000 }).toBe(true);

  const archivedAt = '2026-10-01T10:00:00.000Z';
  const currentEnergy = () => page.evaluate(() => JSON.parse(localStorage.getItem('ifs.parts') ?? '[]').find((part) => part.id === 'pleaser')?.energy);

  // This device: the Pleaser has a real energy today. The archived report scored it at the floor (T 20, energy 0).
  const today = await currentEnergy();
  expect(today).toBeGreaterThan(0);
  await page.evaluate((createdAt) => {
    const profile = JSON.parse(localStorage.getItem('ifs.profile'));
    const clinical = structuredClone(profile.clinical);
    clinical.parts.pleaser.T = 20;
    localStorage.setItem('ifs.history.hist', JSON.stringify([JSON.stringify({ ...profile, clinical, createdAt })]));
  }, archivedAt);

  await page.getByRole('button', { name: /^📖 Report$|^Report/ }).first().click();
  await expect(page.locator('#clinical-history')).toBeVisible();
  await page.getByRole('button', { name: /^Restore backup:/ }).first().click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('ifs.profile')).createdAt)).toBe(archivedAt);

  // The restored profile says the Pleaser scored T 20. The map part must show the same energy, not today's.
  await expect.poll(currentEnergy, { timeout: 10_000 }).toBe(0);
});
