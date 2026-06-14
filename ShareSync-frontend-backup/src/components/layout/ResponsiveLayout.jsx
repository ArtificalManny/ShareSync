// src/components/layout/ResponsiveLayout.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 5.5: Layout wrapper — desktop sidebar on lg+, mobile bottom-nav on sm
// Single component controls the entire layout switch. Wraps page routes.
//
// NOTE: This is an OPTIONAL wrapper. You can integrate incrementally by mounting
// MobileBottomNav, MobileHeader, and MobileDrawer individually instead.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import MobileBottomNav from './MobileBottomNav';
import MobileHeader from './MobileHeader';
import MobileDrawer from './MobileDrawer';

export default function ResponsiveLayout({
  children,
  userName = 'User',
  userStatus = 'online',
  unreadCount = 0,
  onLogout,
  onSearchPress,
  onNotificationPress,
  onCreatePress,
  enabled = true,
  forceMobile = false,
}) {
  const { isMobile, isTablet } = useMediaQuery();
  const showMobileUI = forceMobile || isMobile; // Tablet stays desktop unless explicitly forced.
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleMenuPress = useCallback(() => {
    setDrawerOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const handleSearch = useCallback(() => {
    onSearchPress?.();
    // Fallback: fire command palette
    try {
      window.dispatchEvent(new CustomEvent('shortcut-action', {
        detail: { action: 'COMMAND_PALETTE_OPEN' },
      }));
    } catch { /* non-fatal */ }
  }, [onSearchPress]);

  if (!enabled || !showMobileUI) {
    // Desktop layout — just render children, desktop sidebar is handled by App.jsx
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col h-[100dvh] w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-[#0f1014]">
      {/* Mobile header */}
      <MobileHeader
        onMenuPress={handleMenuPress}
        onSearchPress={handleSearch}
        onNotificationPress={onNotificationPress}
        unreadCount={unreadCount}
      />

      {/* Page content — add bottom padding for nav bar */}
      <main className="flex-1 w-full max-w-full min-w-0 overflow-x-hidden overflow-y-auto overscroll-y-contain pb-[calc(5rem+env(safe-area-inset-bottom,0px))]">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <MobileBottomNav onCreatePress={onCreatePress} />

      {/* Mobile drawer */}
      <MobileDrawer
        isOpen={drawerOpen}
        onClose={handleDrawerClose}
        userName={userName}
        userStatus={userStatus}
        onLogout={onLogout}
      />
    </div>
  );
}
