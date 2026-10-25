import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

// Runs public/firebase-messaging-sw.js with the Firebase compat scripts stubbed out.
function loadWorker(windows: Array<{ url: string; focus: () => Promise<unknown> }>) {
  const listeners: Record<string, (event: any) => void> = {};
  const openWindow = vi.fn(async () => undefined);
  const self = {
    location: { origin: 'https://app.test' },
    navigator: { language: 'ru-RU' },
    addEventListener: (type: string, fn: (event: any) => void) => { listeners[type] = fn; },
    registration: { showNotification: vi.fn() },
    clients: { matchAll: async () => windows, openWindow },
  };
  const firebase = { initializeApp: () => ({}), messaging: () => ({ onBackgroundMessage: () => {} }) };
  runInNewContext(readFileSync('public/firebase-messaging-sw.js', 'utf8'), { self, firebase, importScripts: () => {}, URL, Promise, console });
  return { listeners, openWindow, self };
}

describe('reminder notifications', () => {
  it('opens the app when tapped and nothing is open', async () => {
    const { listeners, openWindow } = loadWorker([]);
    const close = vi.fn();
    let done: Promise<unknown> = Promise.resolve();
    listeners.notificationclick({ notification: { close }, waitUntil: (p: Promise<unknown>) => { done = p; } });
    await done;
    expect(close).toHaveBeenCalled();
    expect(openWindow).toHaveBeenCalledWith('/');
  });

  it('focuses an open app tab instead of opening another', async () => {
    const focus = vi.fn(async () => undefined);
    const { listeners, openWindow } = loadWorker([{ url: 'https://app.test/?go=universe', focus }]);
    let done: Promise<unknown> = Promise.resolve();
    listeners.notificationclick({ notification: { close: () => {} }, waitUntil: (p: Promise<unknown>) => { done = p; } });
    await done;
    expect(focus).toHaveBeenCalled();
    expect(openWindow).not.toHaveBeenCalled();
  });

  it('shows the Russian fallback when a push has no text, even without a JSON body', () => {
    const { listeners, self } = loadWorker([]);
    listeners.push({ data: { json: () => { throw new Error('not json'); } }, waitUntil: () => {} });
    expect(self.registration.showNotification).toHaveBeenCalledWith('Innerverse', expect.objectContaining({ body: 'Какая часть вела сегодня?' }));
  });
});
