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
}) {
  const { isMobile, isTablet } = useMediaQuery();
  const showMobileUI = isMobile || isTablet;
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

  if (!showMobileUI) {
    // Desktop layout — just render children, desktop sidebar is handled by App.jsx
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Mobile header */}
      <MobileHeader
        onMenuPress={handleMenuPress}
        onSearchPress={handleSearch}
        onNotificationPress={onNotificationPress}
        unreadCount={unreadCount}
      />

      {/* Page content — add bottom padding for nav bar */}
      <main className="flex-1 pb-20">
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
