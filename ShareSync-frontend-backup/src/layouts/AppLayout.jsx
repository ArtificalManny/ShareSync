// src/layouts/AppLayout.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// SHARESYNC APP LAYOUT v5.0 - "The Gallery Walk" Unified Light Theme
// ═══════════════════════════════════════════════════════════════════════════════
//
// This is the main layout wrapper for authenticated app pages.
// It provides the consistent "Light Gallery" aesthetic throughout.
//
// NO BACKEND CHANGES - This is purely a structural/visual wrapper.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function AppLayout({ user }) {
  return (
    <div className="app-layout min-h-screen bg-slate-50">
      {/* ═══════════════════════════════════════════════════════════════════════
          ATMOSPHERIC BACKGROUND - Subtle violet/teal echoes
          These create the "Light Gallery" ambiance
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Base gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 50%, #F1F5F9 100%)'
          }}
        />
        
        {/* Violet glow - top left */}
        <div 
          className="absolute -top-[20%] -left-[15%] w-[50vw] h-[50vw] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)',
            filter: 'blur(60px)'
          }}
        />
        
        {/* Teal glow - bottom right */}
        <div 
          className="absolute -bottom-[20%] -right-[15%] w-[45vw] h-[45vw] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(45, 212, 191, 0.03) 0%, transparent 70%)',
            filter: 'blur(60px)'
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          LAYOUT STRUCTURE - No dark borders!
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar - The Gallery Wall */}
        <Sidebar user={user} />

        {/* Main content area - clean, no borders */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top navigation */}
          <Navbar user={user} />

          {/* Page content - flows naturally */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
