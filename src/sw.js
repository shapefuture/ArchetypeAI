/*
 * Innerverse service worker — installability + offline shell.
 * Strategy:
 *   - navigations: network-first, fall back to the cached shell (offline)
 *   - same-origin static assets: cache-first (Angular output is
 *     content-hashed, so stale entries are simply never requested again)
 *   - Firebase/Firestore/API calls: always network (never cached)
 */
const CACHE = 'innerverse-v2';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/firebase-messaging-sw.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isStaticAsset = (url) =>
  url.origin === self.location.origin &&
  /\.(js|css|png|jpg|jpeg|svg|webp|woff2?|ttf|ico|webmanifest)$/.test(url.pathname);

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Never touch Firebase, analytics, or cross-origin traffic.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // App navigations: network-first so updates land, cached shell offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('/', copy));
          return response;
        })
        .catch(() => caches.match('/').then((r) => r || caches.match('/index.html'))),
    );
    return;
  }

  // Hashed static assets: cache-first.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return response;
      })),
    );
  }
});
