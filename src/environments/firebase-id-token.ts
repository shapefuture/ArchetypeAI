import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { getFirebaseApp } from './firebase-init';

let authReady: Promise<void> | null = null;

async function waitForInitialAuthState(auth = getAuth(getFirebaseApp())): Promise<User | null> {
  if (auth.currentUser) return auth.currentUser;
  authReady ??= new Promise<void>((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      () => {
        unsubscribe();
        resolve();
      },
      (error) => {
        unsubscribe();
        authReady = null;
        reject(error);
      },
    );
  });
  await authReady;
  return auth.currentUser;
}

/** Return the current Firebase ID token for authenticated Worker API requests. */
export async function getFirebaseIdToken(): Promise<string> {
  const user = await waitForInitialAuthState();
  if (!user) throw new Error('A Firebase sign-in is required for this request');
  return user.getIdToken();
}
