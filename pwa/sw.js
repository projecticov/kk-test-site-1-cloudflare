/* Service worker: офлайн-режим и мгновенный запуск */
const VERSION = 'v1.21.0';
const CACHE = 'studenthub-' + VERSION;

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './pwa/icons/icon-192.png',
  './pwa/icons/icon-512.png',
  './pwa/icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.all(
        PRECACHE.map((url) => cache.add(url).catch(() => {}))
      ))
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

/* ── push: показываем уведомление от сервера ── */
self.addEventListener('push', (event) => {
  let data = { title: 'Student Hub', body: 'Дело на носу', url: './#/roadmap' };
  try { if (event.data) data = Object.assign(data, event.data.json()); } catch (e) {}
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: './pwa/icons/icon-192.png',
    badge: './pwa/icons/icon-192.png',
    data: { url: data.url || './#/roadmap' },
    vibrate: [40, 60, 40]
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || './#/roadmap';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) { c.navigate(url); return c.focus(); }
      }
      return self.clients.openWindow(url);
    })
  );
});
