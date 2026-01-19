// Service worker for PWA
const CACHE_NAME = 'greed-v1.0.1';

self.addEventListener('install', (event) => {
  // Skip waiting to activate new service worker immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Clean up old caches
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('greed-') && name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => {
      // Take control of all clients
      return clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Network-first strategy
  event.respondWith(fetch(event.request));
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
