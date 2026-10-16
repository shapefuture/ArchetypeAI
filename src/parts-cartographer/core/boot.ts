// Local-first startup contract. Pure functions only: no timers, no network and
// no auth. The shell applies the result in the same tick it mounts, so navigation
// never waits for the cloud, and a ready route is never held back by a fixed wait.

export type BootScreen = 'onboarding' | 'intro' | 'full-assessment' | 'assessment' | 'legacy-assessment' | 'universe';
export type BootOverlay = 'checkin' | null;
export type BootRoute = { screen: BootScreen; overlay: BootOverlay };

export const DEEP_LINK_PARAM = 'go';

/** Recovery choices appear after this long on a waiting screen. They never delay a route that is ready. */
export const SLOW_BOOT_AFTER_MS = 12_000;

const DEEP_LINK_ROUTES = new Map<string, { screen?: BootScreen; overlay?: BootOverlay }>([
  ['assessment', { screen: 'full-assessment' }],
  ['quick-assessment', { screen: 'assessment' }],
  ['legacy-assessment', { screen: 'legacy-assessment' }],
  ['checkin', { overlay: 'checkin' }],
  ['universe', { screen: 'universe' }],
]);

/** The screen a returning or recovering user should land on, from local onboarding state only. */
export function homeScreen(onboarded: boolean): BootScreen {
  return onboarded ? 'intro' : 'onboarding';
}

/** Resolves the first route from the URL query and local onboarding state. Unknown links fall back to home. */
export function resolveBootRoute(search: string, onboarded: boolean): BootRoute {
  const base = homeScreen(onboarded);
  const target = DEEP_LINK_ROUTES.get(new URLSearchParams(search).get(DEEP_LINK_PARAM) ?? '');
  if (!target) return { screen: base, overlay: null };
  return { screen: target.screen ?? base, overlay: target.overlay ?? null };
}

/** Removes only the deep-link parameter, so unrelated query and hash state survive. Returns the input when there is nothing to remove. */
export function withoutDeepLink(path: string): string {
  const url = new URL(path, 'https://app.invalid');
  if (!url.searchParams.has(DEEP_LINK_PARAM)) return path;
  url.searchParams.delete(DEEP_LINK_PARAM);
  return `${url.pathname}${url.search}${url.hash}`;
}
