// src/components/LayoutSkin.jsx
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
    el.classList.add("layout-stage");
    el.setAttribute("data-brand", "v2");
    el.setAttribute("data-accent", accent);
    // keep whatever dark-mode system you have; we only set brand+accent here
  }, [accent]);

  return children;
}
