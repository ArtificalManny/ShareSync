// src/hooks/useBrandTheme.js
import { useEffect, useMemo, useState } from "react";
import {
  BRAND_KEY,
  BRAND_DATA_ATTR,
  BRAND_CLASSIC,
  BRAND_V2,
  normalizeBrand,
} from "../utils/brand";
import { BRAND_V2 as FLAG_BRAND_V2 } from "../config/flags"; // feature flag
import { trackBrandSwitched } from "../utils/telemetry"; // no-op safe in dev

/**
 * useBrandTheme
 * Manages current brand (classic|v2) with localStorage persistence
 * AND, when brand === "v2", exposes data attributes to enable the neon theme:
 *   data-theme="neon" data-accent="pandora|cnbc|meta"
 *
 * Options:
 * - enabled?: boolean (default FLAG_BRAND_V2)
 * - applyToDocument?: boolean — also set attributes on <html> (default: false)
 * - defaultBrand?: "classic" | "v2"
 * - defaultAccent?: "pandora" | "cnbc" | "meta"
 */
export default function useBrandTheme(opts = {}) {
  const {
    enabled = FLAG_BRAND_V2,
    applyToDocument = false,
    defaultBrand = BRAND_CLASSIC,
    defaultAccent = "pandora",
  } = opts;

  const THEME_KEY = "ss.ui.theme";
  const normalizeTheme = (v, fallback) => {
    const s = String(v || "").toLowerCase().trim();
    return ["classic", "neon", "proton"].includes(s) ? s : fallback;
  };


  // --- Accent (family) persistence -----------------------------------------
  const ACCENT_KEY = "ss.brand.accent";
  const normalizeAccent = (v, fallback = "pandora") => {
    const s = String(v || "").toLowerCase().trim();
    return ["pandora", "cnbc", "meta"].includes(s) ? s : fallback;
  };

  // default to v2 if flag is enabled and no user choice yet
  const initialBrand = (() => {
    try {
      const saved = localStorage.getItem(BRAND_KEY);
      if (saved) return normalizeBrand(saved, defaultBrand);
    } catch {}
    return enabled ? BRAND_V2 : defaultBrand;
  })();

  const initialAccent = (() => {
    try {
      const saved = localStorage.getItem(ACCENT_KEY);
      if (saved) return normalizeAccent(saved, defaultAccent);
    } catch {}
    return normalizeAccent(defaultAccent);
  })();

  const initialTheme = (() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved) return normalizeTheme(saved, null);
    } catch {}
    // derive default from brand if not explicitly set
    return enabled && defaultBrand === BRAND_V2 ? "neon" : "classic";
  })();

  const [brand, setBrandState] = useState(initialBrand);        // "classic" | "v2"
  const [accent, setAccentState] = useState(initialAccent);     // "pandora" | "cnbc" | "meta"
  const [theme, setThemeState] = useState(initialTheme);

  // persist + reflect brand
  useEffect(() => {
    try {
      localStorage.setItem(BRAND_KEY, brand);
    } catch {}
    if (applyToDocument && typeof document !== "undefined") {
      document.documentElement.setAttribute(BRAND_DATA_ATTR, brand);
    }
  }, [brand, applyToDocument]);

  // persist + reflect accent (only meaningful for v2/neon)
  useEffect(() => {
    try {
      localStorage.setItem(ACCENT_KEY, accent);
    } catch {}
    if (applyToDocument && typeof document !== "undefined") {
            document.documentElement.setAttribute("data-accent", accent);
            // If user picked a theme explicitly, honor it; otherwise derive from brand
            const derived = brand === BRAND_V2 ? "neon" : "classic";
            const current = document.documentElement.getAttribute("data-theme");
            if (!current || !["classic", "neon", "proton"].includes(current)) {
              document.documentElement.setAttribute("data-theme", derived);
            }
          }
  }, [accent, brand, applyToDocument]);

  // Optional telemetry (safe/no-op if not wired)
  useEffect(() => {
    try {
      trackBrandSwitched({ brand, accent, theme: brand === BRAND_V2 ? "neon" : "classic" });
    } catch {}
  }, [brand, accent]);

  const setBrand = (v) => setBrandState(normalizeBrand(v));
  const setAccent = (v) => setAccentState(normalizeAccent(v, initialAccent));
  const cycleAccent = () => {
    setAccentState((a) => (a === "pandora" ? "cnbc" : a === "cnbc" ? "meta" : "pandora"));
  };

  // Provide attributes to spread on a container (App.jsx already does this)
  const containerAttrs = useMemo(() => {
    const attrs = { [BRAND_DATA_ATTR]: brand, "data-theme": theme };
    if (brand === BRAND_V2) {
      attrs["data-accent"] = accent;
    }
    return attrs;
  }, [brand, accent, theme]);

  return {
    enabled,        // boolean
    brand,          // "classic" | "v2"
    setBrand,       // setter
    accent,         // "pandora" | "cnbc" | "meta"
    setAccent,      // setter
    cycleAccent,    // convenience: rotate accent families
    containerAttrs, // e.g. <div {...containerAttrs} />
  };
}
