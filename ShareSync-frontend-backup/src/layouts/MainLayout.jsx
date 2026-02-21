// src/layouts/MainLayout.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// THE GALLERY - Main App Layout (Light Mode)
// 
// This is the primary layout wrapper for all authenticated app pages.
// It provides:
// - Light background with subtle violet/teal atmospheric glows
// - Sidebar slot (left)
// - Main content area (right)
// - Top navigation slot
//
// NO BACKEND CHANGES - This is purely a visual wrapper.
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { Outlet } from "react-router-dom";

export default function MainLayout({ 
  sidebar = null, 
  navbar = null,
  children 
}) {
  return (
    <div className="main-layout min-h-screen bg-slate-50">
      {/* ═══════════════════════════════════════════════════════════════════════
          ATMOSPHERIC GLOWS - Subtle violet/teal to echo auth pages
          These are purely decorative and don't affect functionality
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Base gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 50%, #F1F5F9 100%)'
          }}
        />
        
        {/* Violet glow - top left (subtle) */}
        <div 
          className="absolute -top-[20%] -left-[15%] w-[50vw] h-[50vw] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%)',
            filter: 'blur(40px)'
          }}
        />
        
        {/* Teal glow - bottom right (very subtle) */}
        <div 
          className="absolute -bottom-[20%] -right-[15%] w-[45vw] h-[45vw] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(45, 212, 191, 0.04) 0%, transparent 70%)',
            filter: 'blur(40px)'
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          LAYOUT STRUCTURE
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar slot */}
        {sidebar && (
          <aside className="flex-shrink-0">
            {sidebar}
          </aside>
        )}

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top navigation slot */}
          {navbar && (
            <header className="flex-shrink-0">
              {navbar}
            </header>
          )}

          {/* Page content */}
          <main className="flex-1 overflow-auto">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYOUT SECTION COMPONENTS
// Helper components for consistent section styling within the layout
// ═══════════════════════════════════════════════════════════════════════════════

export function PageContainer({ children, className = "" }) {
  return (
    <div className={`max-w-[1600px] mx-auto px-6 py-8 lg:px-10 lg:py-10 ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({ 
  title, 
  subtitle, 
  actions,
  className = "" 
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 ${className}`}>
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}

export function PageSection({ 
  title, 
  description,
  actions,
  children,
  className = "" 
}) {
  return (
    <section className={`mb-8 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-slate-700">{title}</h2>
            )}
            {description && (
              <p className="mt-0.5 text-sm text-slate-500">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

export function ContentCard({ children, className = "", ...props }) {
  return (
    <div 
      className={`
        bg-white rounded-xl border border-slate-200
        shadow-sm shadow-violet-500/[0.02]
        hover:shadow-md hover:shadow-violet-500/[0.04]
        hover:border-violet-200/50
        transition-all duration-200
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
