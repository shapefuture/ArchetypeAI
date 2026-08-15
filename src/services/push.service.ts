/**
 * INNERVERSE — Web Push daily reminder (§3.8, issue h8c).
 * Firebase Cloud Messaging: permission → token (VAPID) → token registered in
 * Firestore so a Cloud Function can send the daily check-in nudge. The
 * sending side (console-tested certificate + scheduled function) is the only
 * deploy-time step left; the client round-trip is complete here.
 */
import { Injectable } from '@angular/core';
import { doc, setDoc } from 'firebase/firestore';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { getFirebaseApp } from '../environments/firebase-init';
import { getFirestoreDb } from '../environments/firebase-init';
import { environment } from '../environments/environment';

const TOKEN_KEY = 'INNERVERSE_PUSH_TOKEN_V1';

export type PushState = 'unsupported' | 'denied' | 'ready' | 'enabled';

@Injectable({ providedIn: 'root' })
export class PushService {
  /** jsdom/no-SW environments → 'unsupported'; UI hides the toggle. */
  async currentState(): Promise<PushState> {
    if (typeof Notification === 'undefined') return 'unsupported';
    try {
      if (!(await isSupported())) return 'unsupported';
    } catch { return 'unsupported'; }
    if (Notification.permission === 'denied') return 'denied';
    if (Notification.permission === 'granted' && localStorage.getItem(TOKEN_KEY)) return 'enabled';
    return 'ready';
  }

  /** Ask permission, mint an FCM token, register it for the daily send. */
  async enable(): Promise<PushState> {
    const state = await this.currentState();
    if (state === 'unsupported') return 'unsupported';
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      const asked = await Notification.requestPermission();
      if (asked !== 'granted') return 'denied';
    }
    try {
      const token = await getToken(getMessaging(getFirebaseApp()), {
        vapidKey: environment.vapidPublicKey,
        serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js'),
      });
      if (!token) return 'denied';
      localStorage.setItem(TOKEN_KEY, token);
      await setDoc(doc(getFirestoreDb(), 'pushTokens', token), {
        token, createdAt: new Date().toISOString(),
      });
      return 'enabled';
    } catch {
      return 'denied';
    }
  }

  /** Local fallback while the app is open: nudge if the last check-in is stale. */
  maybeLocalNudge(lastCheckInAt: Date | null, now: Date = new Date()): boolean {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;
    const stale = !lastCheckInAt || (now.getTime() - lastCheckInAt.getTime()) / 3600000 >= 20;
    if (!stale) return false;
    try {
      new Notification('Innerverse', { body: 'Which part drove today?', tag: 'innerverse-daily' });
      return true;
    } catch { return false; }
  }
}
