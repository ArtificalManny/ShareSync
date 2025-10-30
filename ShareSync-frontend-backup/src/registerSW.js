// src/registerSW.js
// Registers /public/sw.js and handles "new content available" upgrades.

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
  if (!("serviceWorker" in navigator)) return;
  if (window.location.protocol === "file:") return; // safety for local previews

  try {
    const reg = await navigator.serviceWorker.register(SW_URL, { scope: "/" });

    // If a new worker is installing, listen for it
    function trackInstalling(worker) {
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed") {
          // If there’s an existing controller, we have an update
          if (navigator.serviceWorker.controller) {
            showReloadPrompt();
          }
        }
      });
    }

    // Fresh install vs update
    if (reg.installing) trackInstalling(reg.installing);
    reg.addEventListener("updatefound", () => trackInstalling(reg.installing));

    // Optional: listen for controllerchange and refresh once
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    // Ping SW to check for updates on load
    if (reg.waiting && navigator.serviceWorker.controller) showReloadPrompt();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[SW] Register failed:", e);
  }
}

// Auto-run on import
register();

// Named export in case you want to call manually elsewhere
export default register;
