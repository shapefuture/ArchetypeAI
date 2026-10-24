import { describe, expect, it } from 'vitest';
import { authErrorKey } from './auth-errors';
import { STRINGS } from '../i18n/strings';

describe('authErrorKey', () => {
  it('maps Firebase codes to translated messages', () => {
    expect(authErrorKey({ code: 'auth/network-request-failed', message: 'Firebase: Error (auth/network-request-failed).' })).toBe('authErrNetwork');
    expect(authErrorKey({ code: 'auth/invalid-credential' })).toBe('authErrCredentials');
    expect(authErrorKey({ code: 'auth/email-already-in-use' })).toBe('authErrEmailInUse');
    expect(authErrorKey(new Error('anything else'))).toBe('authErrGeneric');
    expect(authErrorKey(undefined)).toBe('authErrGeneric');
  });

  it('stays silent when the person closed the popup', () => {
    expect(authErrorKey({ code: 'auth/popup-closed-by-user' })).toBeNull();
  });

  it('has an English and a Russian message for every key it returns', () => {
    const codes = ['auth/network-request-failed', 'auth/invalid-credential', 'auth/email-already-in-use', 'auth/weak-password',
      'auth/invalid-email', 'auth/too-many-requests', 'auth/user-disabled', 'auth/popup-blocked', 'other'];
    for (const code of codes) {
      const key = authErrorKey({ code })!;
      const entry = (STRINGS as Record<string, { en: string; ru: string }>)[key];
      expect(entry?.en, key).toBeTruthy();
      expect(entry?.ru, key).toMatch(/[а-яё]/i);
    }
  });
});
