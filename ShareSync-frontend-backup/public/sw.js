/* Simple service worker for SPA assets + basic offline
   - Cache-first for static assets
   - Network-first for API calls
   - App shell fallback for navigations
*/
const VERSION = "ss-sw-v1";
const APP_SHELL = [ "/", "/index.html" ];
const STATIC_CACHE = `${VERSION}-static`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k.startsWith("ss-sw-") && k !== STATIC_CACHE) ? caches.delete(k) : null))
    )
  );
  self.clients.claim();
});

function isAPI(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith("/api/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Don’t handle non-GET
  if (request.method !== "GET") return;

  if (isAPI(request)) {
    // Network-first for API
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(async () => {
          // SPA navigation fallback
          const url = new URL(request.url);
          if (request.mode === "navigate" || (request.headers.get("accept") || "").includes("text/html")) {
            const shell = await caches.match("/index.html");
            return shell || new Response("Offline", { status: 503 });
          }
          return new Response("Offline", { status: 503 });
        });
    })
  );
});

// Optional: let the app trigger immediate activation
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
