// src/components/layout/Page.jsx
import React from "react";
export default function Page({ className = "", children, ...props }) {
  return (
    <main id="main" role="main" tabIndex={-1} {...props}>
      <div className={["max-w-6xl mx-auto px-6 sm:px-8 lg:px-10 py-6", className].join(" ")}>
        {children}
      </div>
    </main>
  );
}
