// Purnakosh offline cache. The app's data is in IndexedDB; this keeps the app itself loadable offline.
// On install it saves every file of the build (precache.json, written by scripts/deploy-web.sh), so the app opens
// offline even right after the first visit. Pages: network first, saved copy when offline. Build files: saved copy
// first. Google APIs, the market feed and other sites are never cached (they always go to the network).
const BUILD = '7ce122c7c7d188383454a5610597f7f9'; // replaced per deploy, so a new build installs a new worker and drops the old files
const CACHE = 'nepse-watch-' + BUILD;
const BASE = self.registration.scope; // the site's root, e.g. https://…github.io/purnakosh-web/

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    const files = await fetch(BASE + 'precache.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])).catch(() => []);
    await c.addAll([BASE, ...files.map((f) => BASE + f)]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.endsWith('.apk')) return;
  if (req.mode === 'navigate') {
    // Every route is the same single-page app, so offline any path gets the saved start page.
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(BASE, copy)); return res; })
      .catch(() => caches.match(BASE)));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  })));
});
