/* Service worker: офлайн-режим и мгновенный запуск */
const VERSION = 'v1.1.0';
const CACHE = 'studenthub-' + VERSION;

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/styles.css',
  './shared/seed.js',
  './assets/js/icons.js',
  './assets/js/api.js',
  './assets/js/store.js',
  './assets/js/ui.js',
  './assets/js/ai.js',
  './assets/js/views-explore.js',
  './assets/js/views-community.js',
  './assets/js/views-roadmap.js',
  './assets/js/views-chats.js',
  './assets/js/views-profile.js',
  './assets/js/views-admin.js',
  './assets/js/views-install.js',
  './assets/js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // чужие домены не кэшируем

  // навигация: сеть → кэш → офлайн-страница
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // статика: кэш → сеть (с докэшированием)
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});

// обновление контента по сообщению из приложения
self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});
