// public/sw.js
// Legacy service worker kill switch.
// OpenShare no longer uses offline app-shell caching during active production iteration.
// This file clears old caches, unregisters itself, and lets the browser fetch fresh Vite bundles.

self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .catch(() => undefined)
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));

        const clients = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });

        await self.registration.unregister();

        for (const client of clients) {
          client.postMessage({
            type: "OPENSHARE_LEGACY_SW_DISABLED",
          });
        }
      } catch {
        // Never block app loading because cache cleanup failed.
      }
    })()
  );
});

self.addEventListener("fetch", () => {
  // Intentionally do nothing. Network handles all requests.
});
