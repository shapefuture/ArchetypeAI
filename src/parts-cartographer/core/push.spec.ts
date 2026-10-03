import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const firebaseMocks = vi.hoisted(() => ({
  app: { name: 'app' },
  currentUser: { uid: 'firebase-uid' },
  registration: { scope: '/fcm/' },
  token: 'fcm-token',
  isSupported: vi.fn(async () => true),
  getApps: vi.fn(() => [{ name: 'app' }]),
  getApp: vi.fn(() => ({ name: 'app' })),
  initializeApp: vi.fn(() => ({ name: 'app' })),
  getAuth: vi.fn(() => ({ currentUser: { uid: 'firebase-uid' } })),
  getMessaging: vi.fn(() => ({ name: 'messaging' })),
  getToken: vi.fn(async () => 'fcm-token'),
  getFirestore: vi.fn(() => ({ name: 'firestore' })),
  doc: vi.fn((_db, collection, id) => ({ collection, id })),
  setDoc: vi.fn(async () => undefined),
}));

vi.mock('firebase/app', () => ({
  getApps: firebaseMocks.getApps,
  getApp: firebaseMocks.getApp,
  initializeApp: firebaseMocks.initializeApp,
}));
vi.mock('firebase/auth', () => ({ getAuth: firebaseMocks.getAuth }));
vi.mock('firebase/messaging', () => ({
  isSupported: firebaseMocks.isSupported,
  getMessaging: firebaseMocks.getMessaging,
  getToken: firebaseMocks.getToken,
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: firebaseMocks.getFirestore,
  doc: firebaseMocks.doc,
  setDoc: firebaseMocks.setDoc,
}));

import { currentPushState, enablePushReminder, maybeShowLocalCheckInNudge } from './push';

const originalNotification = Object.getOwnPropertyDescriptor(globalThis, 'Notification');
const originalServiceWorker = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');

function installNotification(permission: NotificationPermission = 'default') {
  class FakeNotification {
    static calls: unknown[][] = [];
    static permission = permission;
    static requestPermission = vi.fn(async () => 'granted' as NotificationPermission);
    constructor(...args: unknown[]) { FakeNotification.calls.push(args); }
  }
  Object.defineProperty(globalThis, 'Notification', { configurable: true, value: FakeNotification });
  return FakeNotification;
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  firebaseMocks.isSupported.mockResolvedValue(true);
  firebaseMocks.getApps.mockReturnValue([{ name: 'app' }]);
  firebaseMocks.getApp.mockReturnValue({ name: 'app' });
  firebaseMocks.getAuth.mockReturnValue({ currentUser: { uid: 'firebase-uid' } });
  firebaseMocks.getToken.mockResolvedValue('fcm-token');
  firebaseMocks.setDoc.mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { register: vi.fn(async () => firebaseMocks.registration) },
  });
  installNotification();
});

afterEach(() => {
  if (originalNotification) Object.defineProperty(globalThis, 'Notification', originalNotification);
  else Reflect.deleteProperty(globalThis, 'Notification');
  if (originalServiceWorker) Object.defineProperty(navigator, 'serviceWorker', originalServiceWorker);
  else Reflect.deleteProperty(navigator, 'serviceWorker');
  localStorage.clear();
});

describe('React push reminder parity', () => {
  it('reports readiness before consent and stores a Firebase-owned FCM token after consent', async () => {
    expect(await currentPushState()).toBe('ready');
    expect(await enablePushReminder()).toBe('enabled');
    expect(localStorage.getItem('INNERVERSE_PUSH_TOKEN_V1')).toBe('fcm-token');
    expect(firebaseMocks.getToken).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      vapidKey: expect.any(String),
      serviceWorkerRegistration: firebaseMocks.registration,
    }));
    expect(firebaseMocks.setDoc).toHaveBeenCalledWith(
      { collection: 'pushTokens', id: 'fcm-token' },
      expect.objectContaining({ token: 'fcm-token', uid: 'firebase-uid' }),
    );
  });

  it('does not ask again after the browser denies permission', async () => {
    installNotification('denied');
    expect(await currentPushState()).toBe('denied');
    expect(await enablePushReminder()).toBe('denied');
  });

  it('only shows a foreground nudge when granted and the last check-in is stale', () => {
    const FakeNotification = installNotification('granted');
    const now = new Date('2026-10-03T12:00:00.000Z');
    expect(maybeShowLocalCheckInNudge(new Date(now.getTime() - 20 * 3_600_000), now)).toBe(true);
    expect(FakeNotification.calls).toHaveLength(1);
    expect(maybeShowLocalCheckInNudge(new Date(now.getTime() - 2 * 3_600_000), now)).toBe(false);
  });
});
