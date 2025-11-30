// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./theme.css";
import "./styles/gradients.css";
import "./styles/motion.css";
import "./registerSW.js";

if (import.meta.env.MODE !== "production") {
  import("./utils/perfLog.js");
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
// 4. RENDER APP
// ====================================================================
document.addEventListener("DOMContentLoaded", () => {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
  }
});

// Final safety net
setTimeout(fixSkipLinkAndErrors, 0);
setTimeout(fixSkipLinkAndErrors, 100);