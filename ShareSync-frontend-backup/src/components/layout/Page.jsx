// src/components/layout/Page.jsx
import React from "react";

export default function Page({ className = "", children, ...props }) {
  return (
    <main id="main" role="main" tabIndex={-1} {...props}>
      <div
        className={[
          "w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-6 overflow-x-hidden",
          className,
        ].join(" ")}
      >
        {children}
      </div>
    </main>
  );
}
