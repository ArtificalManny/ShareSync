// src/hooks/useMediaQuery.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 5.5: Viewport breakpoint hook
// Returns { isMobile, isTablet, isDesktop } with live updates via matchMedia.
// Breakpoints: mobile < 768px, tablet 768-1024px, desktop > 1024px
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from 'react';

function useMatchMedia(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const handler = (e) => setMatches(e.matches);

    // Modern browsers use addEventListener
    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
    // Fallback for older browsers
    mql.addListener(handler);
    return () => mql.removeListener(handler);
  }, [query]);

  return matches;
}

export function useMediaQuery() {
  const isMobileQuery = useMatchMedia('(max-width: 767px)');
  const isTabletQuery = useMatchMedia('(min-width: 768px) and (max-width: 1023px)');
  const isDesktopQuery = useMatchMedia('(min-width: 1024px)');

  const result = useMemo(() => ({
    isMobile: isMobileQuery,
    isTablet: isTabletQuery,
    isDesktop: isDesktopQuery,
    // Convenience helpers
    isMobileOrTablet: isMobileQuery || isTabletQuery,
    isTabletOrDesktop: isTabletQuery || isDesktopQuery,
    // Raw breakpoint name
    breakpoint: isMobileQuery ? 'mobile' : isTabletQuery ? 'tablet' : 'desktop',
  }), [isMobileQuery, isTabletQuery, isDesktopQuery]);

  return result;
}

/**
 * Single query hook — pass any media query string
 * Usage: const isWide = useMediaQueryRaw('(min-width: 1280px)');
 */
export function useMediaQueryRaw(query) {
  return useMatchMedia(query);
}

export default useMediaQuery;
