// src/utils/clearOldMobileShellCache.js
// One-time cleanup for old mobile shell/service-worker/browser caches.
// Remove later after mobile users have naturally refreshed.

const CLEAN_VERSION = "nav-labels-3";
const CLEAN_KEY = `openshare:mobile-shell-cache-cleaned:${CLEAN_VERSION}`;

async function clearOldMobileShellCache() {
  if (typeof window === "undefined") return;

  const isMobile =
    window.matchMedia?.("(max-width: 900px)")?.matches ||
    window.innerWidth <= 900;

  if (!isMobile) return;
  if (window.sessionStorage.getItem(CLEAN_KEY)) return;

  window.sessionStorage.setItem(CLEAN_KEY, "1");

  let changed = false;

  try {
    if ("serviceWorker" in navigator && navigator.serviceWorker.getRegistrations) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length) changed = true;
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
  } catch {
    // Non-fatal.
  }

  try {
    if ("caches" in window && window.caches.keys) {
      const cacheNames = await window.caches.keys();
      if (cacheNames.length) changed = true;
      await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
    }
  } catch {
    // Non-fatal.
  }

  if (changed) {
    window.setTimeout(() => {
      window.location.reload();
    }, 250);
  }
}

clearOldMobileShellCache();
