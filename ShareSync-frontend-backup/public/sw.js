// ShareSync Service Worker - FULLY DEV SAFE
const CACHE_NAME = 'sharesync-v2';

// Treat localhost dev as completely transparent (no SW interference)
const IS_LOCALHOST =
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1';

// Only cache truly static files (production only)
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
];

// Install
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil((async () => {
    // ✅ In dev, purge old caches and skip immediately
    if (IS_LOCALHOST) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      console.log('[SW] DEV mode: caches cleared, SW will be transparent');
      return;
    }

    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(urlsToCache);
    console.log('[SW] Cached app shell');
  })());

  self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((cacheName) => {
        if (cacheName !== CACHE_NAME) {
          console.log('[SW] Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        }
      })
    );

    await self.clients.claim();
  })());
});

// Fetch
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return; // Let browser handle it
  }

  // ✅✅✅ DEV MODE: COMPLETELY TRANSPARENT - DON'T INTERCEPT AT ALL
  if (IS_LOCALHOST) {
    // Don't call event.respondWith() - let the browser handle everything naturally
    // This makes the SW completely invisible in development
    return;
  }

  // PROD: cache-first for app shell, network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response;

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        return response;
      });
    }).catch((error) => {
      console.error('[SW] Fetch failed:', event.request.url, error);
      
      // For navigation requests, try offline.html
      if (event.request.mode === 'navigate') {
        return caches.match('/offline.html').then((response) => {
          if (response) return response;
          return new Response(
            '<html><body><h1>Offline</h1><p>Cannot reach server</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        });
      }
      
      // For non-navigation requests, return error response
      return new Response(
        JSON.stringify({ error: 'Network request failed' }),
        { 
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    })
  );
});

console.log('[SW] Service worker loaded (transparent in localhost)');
