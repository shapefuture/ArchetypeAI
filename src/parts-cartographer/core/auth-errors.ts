/**
 * Turns a Firebase Auth failure into a key of i18n/strings.ts, so a person
 * reads a sentence in their language instead of "Firebase: Error (auth/...)".
 * Returns null when there is nothing to say (the person closed the popup).
 */
const BY_CODE: Record<string, string | null> = {
  'auth/network-request-failed': 'authErrNetwork',
  'auth/invalid-credential': 'authErrCredentials',
  'auth/invalid-login-credentials': 'authErrCredentials',
  'auth/wrong-password': 'authErrCredentials',
  'auth/user-not-found': 'authErrCredentials',
  'auth/email-already-in-use': 'authErrEmailInUse',
  'auth/credential-already-in-use': 'authErrEmailInUse',
  'auth/weak-password': 'authErrWeakPassword',
  'auth/invalid-email': 'authErrInvalidEmail',
  'auth/missing-email': 'authErrInvalidEmail',
  'auth/too-many-requests': 'authErrTooMany',
  'auth/user-disabled': 'authErrDisabled',
  'auth/popup-blocked': 'authErrPopupBlocked',
  'auth/popup-closed-by-user': null,
  'auth/cancelled-popup-request': null,
  'auth/user-cancelled': null,
};

export function authErrorKey(error: unknown): string | null {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : '';
  return code in BY_CODE ? BY_CODE[code] : 'authErrGeneric';
}
