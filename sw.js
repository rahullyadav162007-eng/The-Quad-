// The Quad — sw.js
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCME7faKnjj1sYZUTjP0kwp3TqA3CMvhY8",
  authDomain: "the-quad-601ae.firebaseapp.com",
  projectId: "the-quad-601ae",
  storageBucket: "the-quad-601ae.firebasestorage.app",
  messagingSenderId: "1022200086147",
  appId: "1:1022200086147:web:4430359469b6c6265125b6",
  measurementId: "G-ZR0PWDND9T"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message:', payload);
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'The Quad 👻', {
    body: body || 'You have a new notification',
    icon: '/The-Quad-/icon-192.png',
    vibrate: [100, 50, 100],
    tag: 'thequad',
    renotify: true,
    data: { url: 'https://thequad-oss.github.io/The-Quad-/' }
  });
});

// Cache handling
const CACHE_NAME = 'thequad-v2';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.hostname.includes('supabase') || u.hostname.includes('unpkg') || u.hostname.includes('fonts') || u.hostname.includes('gstatic') || u.hostname.includes('googleapis')) return;
  e.respondWith(fetch(e.request).then(r => { if (r && r.ok) { const c = r.clone(); caches.open(CACHE_NAME).then(ca => ca.put(e.request, c)); } return r; }).catch(() => caches.match(e.request)));
});

// Notification click
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) ? e.notification.data.url : 'https://thequad-oss.github.io/The-Quad-/';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if (c.url === url && 'focus' in c) return c.focus(); }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});
