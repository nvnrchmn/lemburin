/* Lemburin service worker — installability + jaringan-first dengan cache.
   Versi naikkan saat rilis baru agar cache lama dibersihkan. */
const VERSION = 'lemburin-v2';

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(VERSION).then(cache => cache.add('/index.html').catch(() => {})));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(VERSION);
      try {
        const net = await fetch(req);
        if (net && net.ok) cache.put(req, net.clone());
        return net;
      } catch (err) {
        const hit = await cache.match(req, { ignoreSearch: false });
        if (hit) return hit;
        // Navigasi offline ke halaman yang belum pernah dikunjungi → shell app.
        if (req.mode === 'navigate') {
          const shell = await cache.match('/index.html');
          if (shell) return shell;
        }
        throw err;
      }
    })(),
  );
});
