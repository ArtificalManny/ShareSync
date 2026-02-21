// src/layouts/AppLayout.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// AUTHENTICATED APP LAYOUT v4.0 - "The Gallery Walk"
// ═══════════════════════════════════════════════════════════════════════════════
//
// This layout wraps all authenticated pages and provides:
// - The MainLayout with light backgrounds
// - Integration with existing Sidebar and Navbar components
// - Proper context providers integration
// - Light theme loading skeletons
//
// NO BACKEND CHANGES - This is purely a layout wrapper.
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { Suspense } from "react";
import { Outlet } from "react-router-dom";
import MainLayout from "./MainLayout";

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING SKELETONS - Light Theme
// ═══════════════════════════════════════════════════════════════════════════════

// Loading fallback for lazy-loaded content
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div 
          className="w-8 h-8 rounded-full border-2 border-violet-200 border-t-violet-500 animate-spin"
        />
        <span className="text-sm text-slate-500">Loading...</span>
      </div>
    </div>
  );
}

// Skeleton for sidebar while loading
function SidebarSkeleton() {
  return (
    <div className="w-64 h-screen bg-white border-r border-slate-200 p-4">
      <div className="space-y-4">
        {/* Logo skeleton */}
        <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
        
        {/* Nav items skeleton */}
        <div className="space-y-2 pt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
        
        {/* Bottom section skeleton */}
        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// Skeleton for navbar while loading
function NavbarSkeleton() {
  return (
    <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
      {/* Left: breadcrumb/title skeleton */}
      <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse" />
      
      {/* Right: actions skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 bg-slate-100 rounded-full animate-pulse" />
        <div className="h-8 w-8 bg-slate-100 rounded-full animate-pulse" />
        <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// APP LAYOUT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function AppLayout({ 
  sidebar: SidebarComponent,
  navbar: NavbarComponent,
  children 
}) {
  return (
    <MainLayout
      sidebar={
        SidebarComponent ? (
          <Suspense fallback={<SidebarSkeleton />}>
            <SidebarComponent />
          </Suspense>
        ) : null
      }
      navbar={
        NavbarComponent ? (
          <Suspense fallback={<NavbarSkeleton />}>
            <NavbarComponent />
          </Suspense>
        ) : null
      }
    >
      <Suspense fallback={<PageLoader />}>
        {children || <Outlet />}
      </Suspense>
    </MainLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE EXPORTS
// Re-export layout helpers from MainLayout for easier imports
// ═══════════════════════════════════════════════════════════════════════════════

export { 
  PageContainer, 
  PageHeader, 
  PageSection, 
  ContentCard,
  StatCard
} from "./MainLayout";

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT SKELETONS
// Reusable skeleton components for loading states
// ═══════════════════════════════════════════════════════════════════════════════

export function CardSkeleton({ className = "" }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-6 ${className}`}>
      <div className="space-y-4">
        <div className="h-4 bg-slate-100 rounded w-1/3 animate-pulse" />
        <div className="h-8 bg-slate-100 rounded w-1/2 animate-pulse" />
        <div className="h-4 bg-slate-100 rounded w-full animate-pulse" />
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 5, className = "" }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-slate-200">
          <div className="w-10 h-10 bg-slate-100 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-100 rounded w-1/4 animate-pulse" />
            <div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse" />
          </div>
          <div className="h-8 w-20 bg-slate-100 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4, className = "" }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-slate-200 bg-slate-50">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="flex-1 h-4 bg-slate-200 rounded animate-pulse" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 border-b border-slate-100 last:border-b-0">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div key={colIndex} className="flex-1 h-4 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}
