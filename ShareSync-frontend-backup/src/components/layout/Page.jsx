// src/components/layout/Page.jsx
import React from "react";

export default function Page({ className = "", children, ...props }) {
  return (
    <main id="main" role="main" tabIndex={-1} {...props}>
      {/* Skip link — invisible until Tab, no flash */}
      <a
        href="#main"
        className="fixed -left-96 top-0 z-50 p-2 bg-surface border border-border text-sm font-medium rounded-b-md shadow-lg transition-all duration-200 focus:left-0 focus:opacity-100 opacity-0 pointer-events-none"
        style={{ left: "-9999px" }}
        onFocus={(e) => {
          e.target.style.left = "0";
          e.target.style.opacity = "1";
          e.target.style.pointerEvents = "auto";
        }}
        onBlur={(e) => {
          e.target.style.left = "-9999px";
          e.target.style.opacity = "0";
          e.target.style.pointerEvents = "none";
        }}
      >
        Skip to main content
      </a>

      <div className={["max-w-6xl mx-auto px-6 sm:px-8 lg:px-10 py-6", className].join(" ")}>
        {children}
      </div>
    </main>
  );
}