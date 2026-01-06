// src/components/LayoutSkin.jsx - NUCLEAR FIX
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function pickAccent(pathname) {
  if (pathname.startsWith("/discover")) return "cnbc";
  if (pathname.startsWith("/projects")) return "meta";
  return "pandora";
}

export default function LayoutSkin({ children }) {
  const { pathname } = useLocation();
  const accent = pickAccent(pathname);

 useEffect(() => {
  const el = document.documentElement;
  el.setAttribute("data-brand", "v2");
  el.setAttribute("data-accent", accent);
  // ⭐ DISABLED ALL HEIGHT FIXES FOR TESTING
    // Set brand attributes
    el.setAttribute("data-brand", "v2");
    el.setAttribute("data-accent", accent);
    
    // ⭐ NUCLEAR FIX: Remove all height forcing
    const fixHeight = () => {
      // Remove problematic classes
      el.classList.remove('layout-stage'); // This class is the problem!
      
      // Force natural height
      el.style.cssText = 'height: auto !important; min-height: auto !important; max-height: none !important;';
      body.style.cssText = 'height: auto !important; min-height: 100vh !important; max-height: none !important;';
      
      console.log('🔥 LayoutSkin: Forced natural height');
    };
    
    // Apply immediately
    fixHeight();
    
    // Re-apply after a delay (in case something else tries to override)
    const timeout = setTimeout(fixHeight, 100);
    
    // Watch for changes and re-apply
    const observer = new MutationObserver(() => {
      const htmlHeight = el.offsetHeight;
      const bodyHeight = body.offsetHeight;
      
      // If height gets forced back to 2000+, fix it again
      if (htmlHeight > 1500 || bodyHeight > 1500) {
        console.log('⚠️ Height was forced back, re-applying fix');
        fixHeight();
      }
    });
    
    observer.observe(el, { attributes: true, attributeFilter: ['style', 'class'] });
    observer.observe(body, { attributes: true, attributeFilter: ['style', 'class'] });
    
    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [accent]);

  return children;
}