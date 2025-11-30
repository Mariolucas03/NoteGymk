// Basic service worker placeholder for PWA caching.
// For production use Workbox or CRA built-in service worker registration.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
self.addEventListener('fetch', () => { });
