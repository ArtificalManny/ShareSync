// src/layouts/PublicLayout.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC LAYOUT - For non-authenticated pages
// 
// Light, clean layout for public-facing pages that aren't auth pages.
// Uses the Gallery Walk light theme.
//
// NO BACKEND CHANGES.
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 50%, #F1F5F9 Available)'
      }}
    >
      {/* Subtle violet glow */}
      <div 
        className="fixed -top-[20%] -left-[15%] w-[50vw] h-[50vw] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%)',
          filter: 'blur(40px)'
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}
