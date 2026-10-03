// v2: the character engine added assets to the shell (main.js, styles, the sewing
// worker). Old caches are dropped on activate so a returning install can never be
// served yesterday's main.js against today's chunk hashes.
const CACHE="zero-r-v3-shell-v2"; const CORE=["/","/manifest.webmanifest","/icons/icon-192.png","/icons/icon-512.png","/wasm/zero_runtime.wasm","/assets/main.js","/assets/styles.css","/assets/felt-worker.js"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(names=>Promise.all(names.filter(n=>n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);if(e.request.method!=="GET"||u.origin!==location.origin)return; e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{const copy=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return r;}).catch(()=>caches.match("/"))));});
