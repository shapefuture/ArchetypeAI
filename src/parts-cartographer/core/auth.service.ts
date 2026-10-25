// Firebase-backed AUTH_PORT. Map data remains local unless the user explicitly
// saves/shares it; the identity directory stores only email + display name.
import type { AUTH_PORT, AuthUser } from './ports';
import { store, KEYS } from './local-store';
import { environment } from '../../../src/environments/environment';

type AuthClient = Awaited<ReturnType<typeof loadAuthClient>>;
let authClientPromise: Promise<AuthClient> | null = null;

async function loadAuthClient() {
  const [sdk, appSdk] = await Promise.all([import('firebase/auth'), import('firebase/app')]);
  const app = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp(environment.firebase);
  const auth = sdk.getAuth(app);
  // Wait for Firebase to restore its persisted session before deciding whether
  // to create an anonymous user; otherwise a refresh can create a second UID.
  await new Promise<void>((resolve) => {
    let unsubscribe: (() => void) | undefined;
    unsubscribe = sdk.onAuthStateChanged(auth, () => {
      unsubscribe?.();
      resolve();
    });
  });
  return { sdk, auth };
}

function client(): Promise<AuthClient> {
  authClientPromise ??= loadAuthClient().catch((error) => {
    authClientPromise = null;
    throw error;
  });
  return authClientPromise;
}

function mapUser(user: import('firebase/auth').User): AuthUser {
  const provider = user.isAnonymous
    ? 'anonymous'
    : user.providerData.some((item) => item.providerId === 'google.com') ? 'google' : 'email';
  return { uid: user.uid, email: user.email, displayName: user.displayName, emailVerified: user.emailVerified, provider, linked: !user.isAnonymous };
}

function persistUser(user: AuthUser): AuthUser {
  store.save(KEYS.auth, user);
  if (user.linked && user.email) {
    void import('./user-directory')
      .then(({ refreshDirectoryEntry }) => refreshDirectoryEntry(user))
      .catch((error) => console.warn('Public identity profile sync failed; sign-in remains available.', error));
  }
  return user;
}

function offlineGuest(): AuthUser {
  const cached = store.load<AuthUser | null>(KEYS.auth, null);
  if (cached?.provider === 'anonymous' && !cached.linked) return cached;
  const uid = `local_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
  return persistUser({ uid, email: null, provider: 'anonymous', linked: false });
}

function requireFirebaseUser(user: import('firebase/auth').User | null): import('firebase/auth').User {
  if (!user) throw new Error('Firebase did not return an authenticated user');
  return user;
}

/** Firebase ID token for authenticated Cloudflare Worker API requests. */
export async function getFirebaseIdToken(): Promise<string> {
  const { auth: firebaseAuth } = await client();
  const user = requireFirebaseUser(firebaseAuth.currentUser);
  return user.getIdToken();
}

export async function getFirebaseIdentity(): Promise<{ uid: string; token: string }> {
  const { auth: firebaseAuth } = await client();
  const user = requireFirebaseUser(firebaseAuth.currentUser);
  return { uid: user.uid, token: await user.getIdToken() };
}

/**
 * Sends Firebase's password-reset email. A missing account is not reported,
 * so the form cannot be used to find out who has an account.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  const { sdk, auth } = await client();
  try {
    await sdk.sendPasswordResetEmail(auth, email.trim());
  } catch (error) {
    if ((error as { code?: string })?.code === 'auth/user-not-found') return;
    throw error;
  }
}

/** Sends Firebase's verification email to the signed-in address. */
export async function sendVerificationEmail(): Promise<void> {
  const { sdk, auth } = await client();
  await sdk.sendEmailVerification(requireFirebaseUser(auth.currentUser));
}

/**
 * Reloads the signed-in user and refreshes the ID token, so a just-verified
 * address reaches the security rules, then re-runs the directory sync.
 */
export async function refreshEmailVerification(): Promise<AuthUser> {
  const { auth } = await client();
  const user = requireFirebaseUser(auth.currentUser);
  await user.reload();
  await user.getIdToken(true);
  return persistUser(mapUser(requireFirebaseUser(auth.currentUser)));
}

export const auth: AUTH_PORT = {
  currentUser() {
    return store.load<AuthUser | null>(KEYS.auth, null);
  },

  async anonymousBootstrap() {
    try {
      const { sdk, auth: firebaseAuth } = await client();
      if (firebaseAuth.currentUser) return persistUser(mapUser(firebaseAuth.currentUser));
      const credential = await sdk.signInAnonymously(firebaseAuth);
      return persistUser(mapUser(credential.user));
    } catch (error) {
      console.warn('Firebase anonymous sign-in unavailable; continuing as a local guest.', error);
      return offlineGuest();
    }
  },

  async signInGoogle() {
    const { sdk, auth: firebaseAuth } = await client();
    const provider = new sdk.GoogleAuthProvider();
    const current = firebaseAuth.currentUser;
    if (current?.isAnonymous) {
      try {
        const result = await sdk.linkWithPopup(current, provider);
        return persistUser(mapUser(result.user));
      } catch (error) {
        // If this Google account already exists, sign into it rather than
        // leaving the user stuck with an anonymous credential.
        if ((error as { code?: string })?.code !== 'auth/credential-already-in-use') throw error;
      }
    }
    const result = await sdk.signInWithPopup(firebaseAuth, provider);
    return persistUser(mapUser(result.user));
  },

  async signInEmail(email, mode, password) {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) throw new Error('Email and password are required');
    const { sdk, auth: firebaseAuth } = await client();
    const current = firebaseAuth.currentUser;
    if (mode === 'up' && current?.isAnonymous) {
      const credential = sdk.EmailAuthProvider.credential(normalizedEmail, password);
      const result = await sdk.linkWithCredential(current, credential);
      return persistUser(mapUser(result.user));
    }
    const result = mode === 'up'
      ? await sdk.createUserWithEmailAndPassword(firebaseAuth, normalizedEmail, password)
      : await sdk.signInWithEmailAndPassword(firebaseAuth, normalizedEmail, password);
    return persistUser(mapUser(result.user));
  },

  async linkAnonymous(email, provider, password) {
    const { sdk, auth: firebaseAuth } = await client();
    const current = firebaseAuth.currentUser;
    if (!current?.isAnonymous) throw new Error('No anonymous Firebase user to link');
    if (provider === 'google') {
      const result = await sdk.linkWithPopup(current, new sdk.GoogleAuthProvider());
      return persistUser(mapUser(result.user));
    }
    if (!password) throw new Error('A password is required to link an email account');
    const credential = sdk.EmailAuthProvider.credential(email.trim(), password);
    const result = await sdk.linkWithCredential(current, credential);
    return persistUser(mapUser(result.user));
  },

  async signOut() {
    const { sdk, auth: firebaseAuth } = await client();
    const { disablePushReminder } = await import('./push');
    await disablePushReminder();
    await sdk.signOut(firebaseAuth);
    store.remove(KEYS.auth);
  },
};
