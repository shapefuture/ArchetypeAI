// INNERVERSE §3.8 — FCM service worker (Web Push daily reminder).
// Uses the compat CDN build; config mirrors src/environments/environment.ts.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey: 'AIzaSyD1idTHp-16XiDFRCXIPjkjHQti6HjfpCw',
  authDomain: 'archetype-ai-3e43b.firebaseapp.com',
  projectId: 'archetype-ai-3e43b',
  storageBucket: 'archetype-ai-3e43b.firebasestorage.app',
  messagingSenderId: '871167128636',
  appId: '1:871167128636:web:634825dc90dc14f1ebbf39',
});
const messaging = firebase.messaging();
messaging.onBackgroundMessage(payload => {
  self.registration.showNotification(payload.notification?.title || 'Innerverse', {
    body: payload.notification?.body || fallbackBody(),
    icon: '/icons/icon-192.png',
    tag: 'innerverse-daily',
  });
});
// Used only when a push arrives without text. The worker cannot read the app's
// language setting, so it follows the browser language.
function fallbackBody() {
  return /^ru\b/i.test(self.navigator?.language || '') ? 'Какая часть вела сегодня?' : 'Which part drove today?';
}
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(self.registration.showNotification(
    data.notification?.title || 'Innerverse',
    { body: data.notification?.body || fallbackBody(), icon: '/icons/icon-192.png', tag: 'innerverse-daily' },
  ));
});
