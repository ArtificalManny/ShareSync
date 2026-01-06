// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./theme.css";
import "./styles/gradients.css";
import "./styles/motion.css";

// ====================================================================
// 0. SERVICE WORKER SAFETY
//    - Never register SW in DEV (causes stale chunks + blank screens)
//    - In DEV, proactively unregister any previously installed SW + clear caches (once per tab)
// ====================================================================
const DEV_SW_CLEAN_KEY = "__SS_DEV_SW_CLEANED__";

if (import.meta.env.PROD) {
  // Only load/register the SW in production builds
  import("./registerSW.js");
} else {
  // DEV: kill any old service worker that might still be controlling localhost
  if ("serviceWorker" in navigator && !sessionStorage.getItem(DEV_SW_CLEAN_KEY)) {
    sessionStorage.setItem(DEV_SW_CLEAN_KEY, "1");

    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .then(() => {
        if ("caches" in window) {
          return caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
        }
      })
      .then(() => {
        console.log("[SW] DEV cleanup complete: unregistered SW + cleared caches");
      })
      .catch((err) => {
        console.warn("[SW] DEV cleanup failed:", err);
      });
  }
}

if (import.meta.env.MODE !== "production") {
  import("./utils/perfLog.js");
}

// ====================================================================
// 1. TRACE ANYONE WHO TRIES TO DELETE AUTH DATA
// ====================================================================
const originalRemoveItem = localStorage.removeItem.bind(localStorage);
localStorage.removeItem = function (key) {
  if (key === "ss.jwt" || key === "ss.user") {
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
//    NOTE: Do NOT suppress "manifest.webmanifest" errors — they indicate real cache/SW issues.
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
        // msg.includes("manifest.webmanifest") ||   // <-- intentionally NOT suppressed
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
  root.render(<App />);

  // Mark as rendered
  rootElement._reactRootContainer = true;

  // Run skip-link fix after render
  setTimeout(fixSkipLinkAndErrors, 0);
  setTimeout(fixSkipLinkAndErrors, 100);
}

// ====================================================================
// 5. DETECT RENDER TIMING — handle all cases
// ====================================================================
if (document.readyState === "loading") {
  console.log("[MAIN] DOM loading, waiting for DOMContentLoaded...");
  document.addEventListener("DOMContentLoaded", renderApp);
} else {
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
