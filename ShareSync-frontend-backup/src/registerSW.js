// src/registerSW.js
// Registers /public/sw.js and handles "new content available" upgrades.
// IMPORTANT: This file is safe to import anywhere, but it will ONLY register in PROD.

const SW_URL = "/sw.js";

function showReloadPrompt() {
  // If you have a toast system, use it. Fallback: confirm()
  if (window?.toast) {
    window.toast({
      title: "Update ready",
      description: "A new version is available.",
      action: {
        label: "Reload",
        onClick: () => window.location.reload(),
      },
    });
  } else if (confirm("A new version is available. Reload now?")) {
    window.location.reload();
  }
}

async function register() {
  // ✅ Never run SW in dev
  if (!import.meta.env.PROD) {
    console.log("[SW] Skipping service worker (dev mode)");
    return;
  }

  if (!("serviceWorker" in navigator)) return;
  if (window.location.protocol === "file:") return;

  try {
    // Best practice: register after full page load
    const reg = await navigator.serviceWorker.register(SW_URL, { scope: "/" });

    // Force check for updates
    reg.update();

    function trackInstalling(worker) {
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed") {
          // If there’s an existing controller, this is an update
          if (navigator.serviceWorker.controller) {
            showReloadPrompt();
          }
        }
      });
    }

    // Fresh install vs update
    if (reg.installing) trackInstalling(reg.installing);
    reg.addEventListener("updatefound", () => trackInstalling(reg.installing));

    // If already waiting, prompt immediately
    if (reg.waiting && navigator.serviceWorker.controller) {
      showReloadPrompt();
    }

    // Reload once when the new SW takes control (prevents chunk mismatch)
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    console.log("[SW] Service worker registered");
  } catch (e) {
    console.warn("[SW] Register failed:", e);
  }
}

// Auto-run on import (PROD only)
if (import.meta.env.PROD) {
  window.addEventListener("load", () => {
    register();
  });
}

export default register;
