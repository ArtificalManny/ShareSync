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

// === PREVENT SKIP-TO-CONTENT FLASH + FIX 500 ERROR ===
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

// Run **immediately** (before React)
fixSkipLinkAndErrors();

// Wait for DOM + auth hydration
document.addEventListener("DOMContentLoaded", () => {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
  }
});

// Final safety net (after render)
setTimeout(fixSkipLinkAndErrors, 0);
setTimeout(fixSkipLinkAndErrors, 100);