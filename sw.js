// Service worker - force unregister and clear all caches
self.addEventListener('install', function() {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    Promise.all([
      // Delete ALL caches
      caches.keys().then(function(keys) {
        return Promise.all(keys.map(function(k) { return caches.delete(k); }));
      }),
      // Claim all clients immediately
      self.clients.claim()
    ])
  );
});

// Pass ALL requests through to network - no caching
self.addEventListener('fetch', function(e) {
  e.respondWith(fetch(e.request, { cache: 'no-store' }));
});
