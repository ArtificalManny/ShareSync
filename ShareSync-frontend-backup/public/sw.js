// ShareSync Service Worker - DEV SAFE (network-only on localhost)
const CACHE_NAME = 'sharesync-v2';

// Treat localhost dev as "NO CACHE" to avoid stale Vite bundles
const IS_LOCALHOST =
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1';

// Only cache truly static files (mainly for production)
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
];

// Install
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil((async () => {
    // ✅ In dev, purge old caches immediately
    if (IS_LOCALHOST) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      console.log('[SW] DEV mode: caches cleared');
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
  if (!event.request.url.startsWith(self.location.origin)) return;

  // ✅ DEV: Always go to network (no caching of /src/* or Vite dev assets)
  if (IS_LOCALHOST) {
    event.respondWith(
      fetch(event.request).catch((error) => {
        console.error('[SW] Fetch failed:', event.request.url, error);
        
        // For navigation requests (page loads), try offline.html
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html').then((response) => {
            if (response) return response;
            // If offline.html also fails, return a basic error page
            return new Response(
              '<html><body><h1>Offline</h1><p>Cannot reach server</p></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          });
        }
        
        // For non-navigation requests (API, assets), return proper error response
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

console.log('[SW] Service worker loaded');
