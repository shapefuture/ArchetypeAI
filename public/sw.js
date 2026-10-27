/* Parts Cartographer service worker — stamped post-build from dist/index.html hash */
const BUILD = '__BUILD_ID__';
const CACHE = `parts-cartographer-${BUILD}`;
const BUILD_ASSETS = [];
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/firebase-messaging-sw.js'];
const PRECACHE = [...SHELL, ...BUILD_ASSETS];

// A script or stylesheet URL answered with HTML is the SPA fallback for a file
// that no longer exists (an old build's chunk). It must never be cached.
function cacheable(url, res) {
  if (!res || res.status !== 200 || res.type !== 'basic') return false;
  const type = res.headers.get('content-type') || '';
  return !(/\.(js|css)$/.test(url.pathname) && type.includes('text/html'));
}

self.addEventListener('install', (e) => {
  // The shell must install; build assets are cached one by one, so a single
  // failed download cannot leave the app without offline support.
  const precacheAsset = (cache, asset) => fetch(asset).then((res) => {
    if (cacheable(new URL(asset, self.location.origin), res)) return cache.put(asset, res);
    return undefined;
  });
  e.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL).then(() => Promise.allSettled(BUILD_ASSETS.map((asset) => precacheAsset(cache, asset)))))
      .then(() => self.skipWaiting())
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
          // Only the app shell may become the offline page: a navigation to the
          // manifest, an icon or an error page must not replace it.
          const isShell = cacheable(url, res) && (res.headers.get('content-type') || '').includes('text/html');
          if (isShell) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put('/index.html', copy));
          }
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
          if (cacheable(url, res)) {
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
