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
  deleteDoc: vi.fn(async () => undefined),
  deleteToken: vi.fn(async () => true),
  onMessage: vi.fn((_messaging: unknown, _callback: (payload: any) => void) => vi.fn()),
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
  deleteToken: firebaseMocks.deleteToken,
  onMessage: firebaseMocks.onMessage,
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: firebaseMocks.getFirestore,
  doc: firebaseMocks.doc,
  setDoc: firebaseMocks.setDoc,
  deleteDoc: firebaseMocks.deleteDoc,
}));

import { currentPushState, enablePushReminder, disablePushReminder, maybeShowLocalCheckInNudge } from './push';

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
  it('replaces a rotated token and forwards only visible notification text', async () => {
    localStorage.setItem('INNERVERSE_PUSH_TOKEN_V1', 'old-token');
    const listener = vi.fn();
    window.addEventListener('ifs:push-message', listener);
    try {
      expect(await enablePushReminder()).toBe('enabled');
      expect(firebaseMocks.deleteDoc).toHaveBeenCalledWith({ collection: 'pushTokens', id: 'old-token' });
      const receive = firebaseMocks.onMessage.mock.calls[0][1] as any;
      receive({ notification: { title: 'Check in', body: 'A gentle pause' }, data: { private: 'not displayed' } });
      expect(listener.mock.calls[0][0].detail).toEqual({ title: 'Check in', body: 'A gentle pause' });
    } finally { window.removeEventListener('ifs:push-message', listener); }
  });
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

  it('withdraws a token while keeping the PWA shell worker intact', async () => {
    await enablePushReminder();
    await disablePushReminder();
    expect(firebaseMocks.deleteDoc).toHaveBeenCalledWith({ collection: 'pushTokens', id: 'fcm-token' });
    expect(firebaseMocks.deleteToken).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('INNERVERSE_PUSH_TOKEN_V1')).toBeNull();
    expect(await currentPushState()).toBe('ready');
  });

  it('only shows a foreground nudge when granted and the last check-in is stale', () => {
    const FakeNotification = installNotification('granted');
    const now = new Date('2026-10-03T12:00:00.000Z');
    expect(maybeShowLocalCheckInNudge(new Date(now.getTime() - 20 * 3_600_000), now)).toBe(true);
    expect(FakeNotification.calls).toHaveLength(1);
    expect(maybeShowLocalCheckInNudge(null, now)).toBe(false);
    expect(maybeShowLocalCheckInNudge(new Date(now.getTime() - 2 * 3_600_000), now)).toBe(false);
  });
});
