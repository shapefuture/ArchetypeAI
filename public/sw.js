/* Parts Cartographer service worker — stamped post-build from dist/index.html hash */
const BUILD = '__BUILD_ID__';
const CACHE = `parts-cartographer-${BUILD}`;
const BUILD_ASSETS = [];
const PRECACHE = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/firebase-messaging-sw.js', ...BUILD_ASSETS];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('parts-cartographer-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Only public app assets belong in this cache. Authenticated API responses never do.
  if (req.mode !== 'navigate' && !url.pathname.startsWith('/assets/') && !PRECACHE.includes(url.pathname)) return;

  // navigations: network-first, offline → cached shell (never cache /sw.js itself)
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/index.html', copy));
          return res;
        })
        .catch(() => caches.match('/index.html').then((r) => r || caches.match('/')))
    );
    return;
  }

  // assets: stale-while-revalidate
  e.respondWith(
    // These allowlisted assets are public and identical across origins. Module
    // requests can carry Origin while precache requests do not (Vary: Origin).
    caches.match(req, { ignoreVary: true }).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
