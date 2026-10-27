// Round 33 probe (critic). The account menu on the Base tab (screens/landing.jsx, the `menu` array) labels its row
// t('signOut') ("Sign out") for a linked account, but its action is setOverlay('login'), the sign-in panel. No code in the
// React client calls auth.signOut() (core/auth.service.ts), and the Login overlay (overlays.jsx, Login) offers only sign-in.
// So a signed-in person cannot sign out, and the row that says "Sign out" leaves the account signed in.
// Expected: choosing "Sign out" on a linked account clears the signed-in account from this device (ifs.auth is removed).
// Control: the same row for a guest opens the sign-in panel, which is what it says it does.
// Firebase's sign-in request is held open so the seeded account is not replaced by an offline guest at boot.
import { test, expect } from '@playwright/test';

const LINKED = { uid: 'uid_r33_owner', email: 'owner@example.com', displayName: null, emailVerified: true, provider: 'email', linked: true };

async function open(page, account) {
  // Never answered: the anonymous bootstrap waits here, so the seeded account stays the signed-in one.
  await page.route(/identitytoolkit\.googleapis\.com/, () => {});
  await page.route(/securetoken\.googleapis\.com|firestore\.googleapis\.com|firebaseinstallations\.googleapis\.com/, (route) => route.abort());
  await page.addInitScript((seed) => {
    if (sessionStorage.getItem('r33-seeded')) return;
    sessionStorage.setItem('r33-seeded', '1');
    localStorage.setItem('ifs.lang', '"en"');
    localStorage.setItem('ifs.onboarded', 'true');
    localStorage.setItem('ifs.help.seen', 'true');
    localStorage.setItem('ifs.auth', JSON.stringify(seed));
  }, account);
  await page.goto('/');
}

test('control: the account row of a guest opens the sign-in panel', async ({ page }) => {
  await open(page, { uid: 'local_r33guest', email: null, provider: 'anonymous', linked: false });
  const row = page.getByRole('button', { name: /Sign in/ }).first();
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.click();
  await expect(page.getByRole('button', { name: /Sign in with Google|Google/ }).first()).toBeVisible();
});

test('a linked account can sign out from the account row', async ({ page }) => {
  await open(page, LINKED);
  const row = page.getByRole('button', { name: /Sign out/ }).first();
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.click();
  // A sign-out removes the signed-in account from this device. The row only opens the sign-in panel, so the account stays.
  await expect.poll(() => page.evaluate(() => localStorage.getItem('ifs.auth')), { timeout: 5_000 }).toBeNull();
});
