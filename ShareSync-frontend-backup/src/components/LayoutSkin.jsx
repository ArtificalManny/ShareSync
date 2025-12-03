// src/components/LayoutSkin.jsx - FIXED: No height forcing
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function pickAccent(pathname) {
  if (pathname.startsWith("/discover")) return "cnbc";
  if (pathname.startsWith("/projects")) return "meta";
  // default
  return "pandora";
}

export default function LayoutSkin({ children }) {
  const { pathname } = useLocation();
  const accent = pickAccent(pathname);

  useEffect(() => {
    const el = document.documentElement;
    
    // ⭐ ADD LAYOUT-STAGE CLASS
    el.classList.add("layout-stage");
    
    // ⭐ FIX: Force height to auto AFTER adding class
    el.style.setProperty('height', 'auto', 'important');
    el.style.setProperty('min-height', 'auto', 'important');
    
    // Set brand attributes
    el.setAttribute("data-brand", "v2");
    el.setAttribute("data-accent", accent);
    
    // ⭐ ALSO FIX BODY
    document.body.style.setProperty('height', 'auto', 'important');
    document.body.style.setProperty('min-height', '100vh', 'important');
    
    console.log('✅ LayoutSkin applied - height forced to auto');
  }, [accent]);

  return children;
}