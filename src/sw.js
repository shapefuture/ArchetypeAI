/*
 * Innerverse service worker — installability + offline shell.
 * Strategy:
 *   - navigations: network-first, fall back to the cached shell (offline)
 *   - same-origin static assets: cache-first (Angular output is
 *     content-hashed, so stale entries are simply never requested again)
 *   - Firebase/Firestore/API calls: always network (never cached)
 *
 * Update contract: scripts/stamp-sw.mjs replaces __BUILD_ID__ with a content
 * hash of the build at deploy time, so EVERY deploy changes sw.js bytes →
 * browser detects the update on first visit → skipWaiting → controllerchange
 * → the page reloads itself once into the new version. The cache name embeds
 * the same build id, so activation deletes every entry from previous builds
 * (no "one version behind" shell).
 */
const BUILD_ID = '__BUILD_ID__'; // stamped at build time (scripts/stamp-sw.mjs)
const CACHE = `innerverse-${BUILD_ID}`;
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/firebase-messaging-sw.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // cache:'reload' — bypass the HTTP cache so a fresh install always
      // precaches the shell that was JUST deployed, never a stale disk copy.
      .then((cache) => Promise.all(SHELL.map((url) =>
        fetch(new Request(url, { cache: 'reload' })).then((res) => cache.put(url, res)),
      )))
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

  // App navigations: network-first, fall back to the cached shell offline.
  // Correctness note: a cache-first shell stays stale for as long as the
  // browser keeps serving the OLD worker (update checks are throttled to
  // ~daily on navigations), which is exactly how "refresh shows the old
  // build until site data is cleared" happened. With network-first, a plain
  // refresh ALWAYS renders the freshly deployed shell; the cached copy is
  // only a network-failure fallback (offline). The extra round trip on
  // launch is the price of never being stale.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('/', copy));
          return response;
        })
        .catch(() =>
          caches.open(CACHE)
            .then((cache) => cache.match('/'))
            .then((cached) => cached || Response.error()),
        ),
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
