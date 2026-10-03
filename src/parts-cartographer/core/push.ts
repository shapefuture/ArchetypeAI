import { environment } from '../../environments/environment';

const TOKEN_KEY = 'INNERVERSE_PUSH_TOKEN_V1';

export type ReactPushState = 'unsupported' | 'denied' | 'ready' | 'enabled';

function getSavedToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

async function messagingSupported(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined' || !('serviceWorker' in navigator)) return false;
  try {
    const { isSupported } = await import('firebase/messaging');
    return await isSupported();
  } catch {
    return false;
  }
}

/** Permission and browser support state for the opt-in FCM reminder. */
export async function currentPushState(): Promise<ReactPushState> {
  if (!(await messagingSupported())) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  if (Notification.permission === 'granted' && getSavedToken()) return 'enabled';
  return 'ready';
}

/** Ask permission, obtain an FCM token using the isolated /fcm/ worker scope, and register ownership in Firestore. */
export async function enablePushReminder(): Promise<ReactPushState> {
  if (!(await messagingSupported())) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';

  try {
    const permission = Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission();
    if (permission !== 'granted') return 'denied';

    // The PWA shell owns `/`; FCM uses a separate narrow scope so the two
    // registrations cannot replace one another.
    const serviceWorkerRegistration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js',
      { scope: '/fcm/' },
    );

    const [appSdk, authSdk, messagingSdk, firestoreSdk] = await Promise.all([
      import('firebase/app'), import('firebase/auth'), import('firebase/messaging'), import('firebase/firestore'),
    ]);
    const app = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp(environment.firebase);
    const user = authSdk.getAuth(app).currentUser;
    if (!user) return 'denied';

    const messaging = messagingSdk.getMessaging(app);
    const token = await messagingSdk.getToken(messaging, {
      vapidKey: environment.vapidPublicKey,
      serviceWorkerRegistration,
    });
    if (!token) return 'denied';

    const db = firestoreSdk.getFirestore(app);
    await firestoreSdk.setDoc(firestoreSdk.doc(db, 'pushTokens', token), {
      token,
      uid: user.uid,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(TOKEN_KEY, token);
    return 'enabled';
  } catch (error) {
    console.warn('FCM reminder could not be enabled.', error);
    return 'denied';
  }
}

/** Foreground fallback nudge when the last check-in is at least 20 hours old. */
export function maybeShowLocalCheckInNudge(lastCheckInAt: Date | null, now = new Date()): boolean {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;
  const stale = !lastCheckInAt || (now.getTime() - lastCheckInAt.getTime()) / 3_600_000 >= 20;
  if (!stale) return false;
  try {
    new Notification('Innerverse', { body: 'Which part drove today?', tag: 'innerverse-daily' });
    return true;
  } catch {
    return false;
  }
}
