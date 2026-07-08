// src/components/layout/ResponsiveLayout.jsx
import React, { useCallback } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import MobileBottomNav from './MobileBottomNav';
import MobileHeader from './MobileHeader';
import MobileFloatingMessages from './MobileFloatingMessages';

export default function ResponsiveLayout({
  children,
  unreadCount = 0,
  onSearchPress,
  onNotificationPress,
  onCreatePress,
  enabled = true,
  forceMobile = false,
}) {
  const { isMobile } = useMediaQuery();
  const showMobileUI = forceMobile || isMobile;

  const handleSearch = useCallback(() => {
    onSearchPress?.();
    try {
      window.dispatchEvent(new CustomEvent('shortcut-action', {
        detail: { action: 'COMMAND_PALETTE_OPEN' },
      }));
    } catch {}
  }, [onSearchPress]);

  if (!enabled || !showMobileUI) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[100] flex h-[100dvh] w-full max-w-full flex-col overflow-x-hidden bg-slate-50 dark:bg-[#0f1014]">
      <MobileHeader
        onSearchPress={handleSearch}
        onNotificationPress={onNotificationPress}
        unreadCount={unreadCount}
      />

      <main className="flex-1 w-full max-w-full min-w-0 overflow-x-hidden overflow-y-auto overscroll-y-contain pb-[calc(5rem+env(safe-area-inset-bottom,0px))]">
        {children}
      </main>

      <MobileFloatingMessages />

      <MobileBottomNav onCreatePress={onCreatePress} />
    </div>
  );
}
