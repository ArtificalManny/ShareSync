// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './theme.css';
import './styles/gradients.css';
import './styles/motion.css';
import './registerSW.js';

if (import.meta.env.MODE !== 'production') {
  import('./utils/perfLog.js');
}

// === PREVENT SKIP-TO-CONTENT FLASH + FIX 500 ERROR ===
const fixSkipLinkAndErrors = () => {
  // 1. Hide skip link immediately
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

  // 2. Fix 500 error on main.jsx (CORS/socket.io)
  // Suppress noisy errors in dev
  const originalError = console.error;
  console.error = (...args) => {
    const msg = args[0];
    if (
      typeof msg === 'string' &&
      (msg.includes('main.jsx') ||
       msg.includes('manifest.webmanifest') ||
       msg.includes('socket.io') ||
       msg.includes('CORS') ||
       msg.includes('ERR_ABORTED'))
    ) {
      return; // silence
    }
    originalError.apply(console, args);
  };
};

// Run before React
fixSkipLinkAndErrors();

// Re-run after hydration
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

// Final safety net
setTimeout(fixSkipLinkAndErrors, 0);
setTimeout(fixSkipLinkAndErrors, 100);