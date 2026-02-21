// src/layouts/AppLayout.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// AUTHENTICATED APP LAYOUT
// 
// This layout wraps all authenticated pages and provides:
// - The MainLayout with light backgrounds
// - Integration with existing Sidebar and Navbar components
// - Proper context providers integration
//
// NO BACKEND CHANGES - This is purely a layout wrapper.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { Suspense } from "react";
import { Outlet } from "react-router-dom";
import MainLayout from "./MainLayout";

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
      </div>
    </div>
  );
}

// Skeleton for navbar while loading
function NavbarSkeleton() {
  return (
    <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
      <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse" />
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 bg-slate-100 rounded-full animate-pulse" />
        <div className="h-8 w-8 bg-slate-100 rounded-full animate-pulse" />
        <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

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
  ContentCard 
} from "./MainLayout";
