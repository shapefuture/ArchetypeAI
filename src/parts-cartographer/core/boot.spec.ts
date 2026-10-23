import { describe, expect, it } from 'vitest';
import { homeScreen, resolveBootRoute, withoutDeepLink } from './boot';

describe('resolveBootRoute', () => {
  it('routes new users to onboarding and returning users to intro from local state alone', () => {
    expect(resolveBootRoute('', false)).toEqual({ screen: 'onboarding', overlay: null });
    expect(resolveBootRoute('', true)).toEqual({ screen: 'intro', overlay: null });
    expect(homeScreen(false)).toBe('onboarding');
    expect(homeScreen(true)).toBe('intro');
  });

  it('applies each shortcut deep link to its requested route, including before onboarding', () => {
    expect(resolveBootRoute('?go=assessment', true)).toEqual({ screen: 'full-assessment', overlay: null });
    expect(resolveBootRoute('?go=quick-assessment', false)).toEqual({ screen: 'assessment', overlay: null });
    expect(resolveBootRoute('?go=legacy-assessment', true)).toEqual({ screen: 'legacy-assessment', overlay: null });
    expect(resolveBootRoute('?go=universe', false)).toEqual({ screen: 'universe', overlay: null });
  });

  it('keeps the home screen under the check-in overlay deep link', () => {
    expect(resolveBootRoute('?go=checkin', true)).toEqual({ screen: 'intro', overlay: 'checkin' });
    expect(resolveBootRoute('?go=checkin', false)).toEqual({ screen: 'onboarding', overlay: 'checkin' });
  });

  it('ignores unknown or prototype-like deep links instead of inventing a route', () => {
    expect(resolveBootRoute('?go=unknown', true)).toEqual({ screen: 'intro', overlay: null });
    expect(resolveBootRoute('?go=constructor', false)).toEqual({ screen: 'onboarding', overlay: null });
    expect(resolveBootRoute('?go=__proto__', true)).toEqual({ screen: 'intro', overlay: null });
  });
});

describe('withoutDeepLink', () => {
  it('removes only the deep-link parameter and keeps unrelated query and hash state', () => {
    expect(withoutDeepLink('/?go=checkin&lang=en#panel')).toBe('/?lang=en#panel');
    expect(withoutDeepLink('/app/?lang=ru&go=universe')).toBe('/app/?lang=ru');
  });

  it('returns the input unchanged when no deep link is present', () => {
    expect(withoutDeepLink('/?lang=en')).toBe('/?lang=en');
    expect(withoutDeepLink('/')).toBe('/');
  });
});
