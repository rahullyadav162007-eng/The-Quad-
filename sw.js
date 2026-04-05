// The Quad — sw.js  (Pure Web Push / VAPID — no Firebase needed)

const CACHE_NAME = 'thequad-v2';
const APP_URL    = 'https://thequad-oss.github.io/The-Quad-/';

// ── Install & Activate ────────────────────────────────────────
self.addEventListener('install',  e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Fetch (bypass for external APIs) ─────────────────────────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (
    u.hostname.includes('supabase')   ||
    u.hostname.includes('unpkg')      ||
    u.hostname.includes('fonts')      ||
    u.hostname.includes('gstatic')    ||
    u.hostname.includes('googleapis')
  ) return;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        if (r && r.ok) {
          const c = r.clone();
          caches.open(CACHE_NAME).then(ca => ca.put(e.request, c));
        }
        return r;
      })
      .catch(() => caches.match(e.request))
  );
});

// ── Push — fires when edge function sends a notification ──────
self.addEventListener('push', e => {
  let title = 'The Quad 👻';
  let body  = 'You have a new notification';

  try {
    const data = e.data?.json();
    if (data?.title) title = data.title;
    if (data?.body)  body  = data.body;
  } catch (_) {
    if (e.data?.text()) body = e.data.text();
  }

  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:     '/The-Quad-/icon-192.png',
      vibrate:  [200, 100, 200, 100, 200],
      silent:   false,
      badge:    '/The-Quad-/icon-192.png',
      tag:      'thequad',
      renotify: true,
      data:     { url: APP_URL }
    })
  );
});

// ── Notification click ────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || APP_URL;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url === url && 'focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
