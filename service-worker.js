// Service worker v11 - self-unregisters + passes all to network
// Any existing SW will unregister itself on next activate
self.addEventListener('install', function(e) {
  self.skipWaiting();
});
self.addEventListener('activate', function(e) {
  e.waitUntil(
    Promise.all([
      caches.keys().then(function(k) {
        return Promise.all(k.map(function(n) { return caches.delete(n); }));
      }),
      self.registration.unregister()
    ]).then(function() {
      return self.clients.claim();
    })
  );
});
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request, { cache: 'no-store' }).catch(function() {
      return new Response('Offline', { status: 503 });
    })
  );
});
