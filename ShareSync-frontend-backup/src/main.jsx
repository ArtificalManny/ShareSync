// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ReactQueryProvider from "./context/ReactQueryProvider";
import "./index.css";
import "./theme.css";
import "./styles/gradients.css";
import "./styles/motion.css";
// Service worker disabled during active production development to prevent stale cached builds.
// // Service worker disabled during active production development to prevent stale cached builds.
// import "./registerSW.js";

import posthog from "posthog-js"; // ✅ PHASE 2: The Neural Network
import { forceMovesStartButtonVisibility } from "./utils/forceMovesStartButtonVisibility";

// OPENSHARE_LEGACY_CACHE_CLEANUP_V1
// Remove old service workers/caches from earlier production builds.
// This prevents soft-refresh from loading stale app bundles.
if (typeof window !== "undefined") {
  (async () => {
    try {
      if ("serviceWorker" in navigator && navigator.serviceWorker.getRegistrations) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }

      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch (error) {
      console.warn("OpenShare cache cleanup skipped:", error);
    }
  })();
}


forceMovesStartButtonVisibility();

if (import.meta.env.MODE !== "production") {
  import("./utils/perfLog.js");
}

// ====================================================================
// 0. INITIALIZE TELEMETRY & SESSION REPLAY (POSTHOG)
// ====================================================================
// posthog-safe-init-v1
const posthogKey = String(import.meta.env.VITE_POSTHOG_KEY || "").trim();
const posthogEnabled =
  posthogKey.length > 10 &&
  !posthogKey.toUpperCase().startsWith("YOUR_");

if (typeof window !== "undefined" && posthogEnabled) {
  posthog.init(posthogKey, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com",
    autocapture: true,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: ".ph-no-capture",
    },
    capture_pageview: false,
    loaded: (ph) => {
      if (import.meta.env.DEV) {
        console.log("[Telemetry] Local dev detected. PostHog tracking paused.");
        ph.opt_out_capturing();
      }
    },
  });
} else if (import.meta.env.DEV) {
  console.log("[Telemetry] PostHog disabled: no valid project key configured.");
}

// ====================================================================
// 1. TRACE ANYONE WHO TRIES TO DELETE AUTH DATA
// ====================================================================
const originalRemoveItem = localStorage.removeItem.bind(localStorage);
localStorage.removeItem = function(key) {
  if (key === 'ss.jwt' || key === 'ss.user') {
    console.trace(`[STORAGE] localStorage.removeItem('${key}') called! Full stack trace:`);
  }
  return originalRemoveItem(key);
};

// ====================================================================
// 2. PRELOAD AUTH STATE — fixes soft/hard refresh auth loss forever
// ====================================================================
const preloadAuthState = () => {
  const token = localStorage.getItem("ss.jwt");
  const userStr = localStorage.getItem("ss.user");

  window.__INITIAL_AUTH_STATE__ = {
    token: token || null,
    user: userStr ? JSON.parse(userStr) : null,
    hasToken: !!token,
  };

  console.log("[AUTH PRELOAD] Auth state injected into window", {
    hasToken: !!token,
    user: !!window.__INITIAL_AUTH_STATE__.user,
    timestamp: new Date().toISOString(),
  });
};

// Run FIRST — before anything else
preloadAuthState();

// ====================================================================
// 3. FIX SKIP-TO-CONTENT FLASH + SUPPRESS NOISE IN DEV
// ====================================================================
const fixSkipLinkAndErrors = () => {
  const skipLink = document.querySelector('a[href="#main"]');
  if (skipLink) {
    skipLink.style.cssText = `
      position: fixed !important;
      left: -9999px !important;
      top: auto !important;
      width: 1px !important;
      height: 1px !important;
      overflow: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    `;
  }

  const originalError = console.error;
  console.error = (...args) => {
    const msg = args[0];
    if (
      typeof msg === "string" &&
      (msg.includes("main.jsx") ||
        msg.includes("manifest.webmanifest") ||
        msg.includes("socket.io") ||
        msg.includes("CORS") ||
        msg.includes("ERR_ABORTED"))
    ) {
      return;
    }
    originalError.apply(console, args);
  };
};

// Run immediately
fixSkipLinkAndErrors();

// ====================================================================
// 4. UNIVERSAL RENDER FUNCTION — works on soft/hard refresh/HMR
// ====================================================================
function renderApp() {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    console.error("[MAIN] Root element not found!");
    return;
  }

  // Check if already rendered (prevents double-render on HMR)
  if (rootElement._reactRootContainer || rootElement.children.length > 0) {
    console.log("[MAIN] App already rendered, skipping");
    return;
  }

  console.log("[MAIN] Rendering React app...");
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <ReactQueryProvider>
      <App />
    </ReactQueryProvider>
  );
  
  // Mark as rendered
  rootElement._reactRootContainer = true;
  
  // Run skip-link fix after render
  setTimeout(fixSkipLinkAndErrors, 0);
  setTimeout(fixSkipLinkAndErrors, 100);
}

// ====================================================================
// 5. DETECT RENDER TIMING — handle all cases
// ====================================================================
if (document.readyState === 'loading') {
  // DOM not ready yet (rare in dev, common in production)
  console.log("[MAIN] DOM loading, waiting for DOMContentLoaded...");
  document.addEventListener("DOMContentLoaded", renderApp);
} else {
  // DOM already ready (soft refresh, HMR, etc)
  console.log("[MAIN] DOM already loaded, rendering immediately");
  renderApp();
}

// ====================================================================
// 6. VITE HMR SUPPORT — re-render on hot updates in dev
// ====================================================================
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log("[HMR] Hot update detected, re-rendering...");
    renderApp();
  });
}
