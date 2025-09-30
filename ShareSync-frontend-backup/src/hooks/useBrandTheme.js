import { useEffect, useMemo, useState } from "react";
import { BRAND_KEY, BRAND_DATA_ATTR, BRAND_CLASSIC, BRAND_V2, normalizeBrand } from "../utils/brand";
import { BRAND_V2 as FLAG_BRAND_V2 } from "../config/flags"; // feature flag

/**
 * useBrandTheme
 * Manages current brand (classic|v2) with localStorage persistence.
 *
 * Options:
 * - enabled?: boolean (default true if FLAG_BRAND_V2)
 * - applyToDocument?: boolean — also set attribute on <html> (default: false)
 * - defaultBrand?: "classic" | "v2"
 */
export default function useBrandTheme(opts = {}) {
  const {
    enabled = FLAG_BRAND_V2,
    applyToDocument = false,
    defaultBrand = BRAND_CLASSIC,
  } = opts;

  // default to v2 if flag is enabled and no user choice yet
  const initial = (() => {
    try {
      const saved = localStorage.getItem(BRAND_KEY);
      if (saved) return normalizeBrand(saved, defaultBrand);
    } catch {}
    return enabled ? BRAND_V2 : defaultBrand;
  })();

  const [brand, setBrandState] = useState(initial);

  // persist + reflect
  useEffect(() => {
    try {
      localStorage.setItem(BRAND_KEY, brand);
    } catch {}
    if (applyToDocument && typeof document !== "undefined") {
      document.documentElement.setAttribute(BRAND_DATA_ATTR, brand);
    }
  }, [brand, applyToDocument]);

  const setBrand = (v) => setBrandState(normalizeBrand(v));

  // Provide attributes to spread on a container
  const containerAttrs = useMemo(() => ({ [BRAND_DATA_ATTR]: brand }), [brand]);

  return {
    enabled,
    brand,          // "classic" | "v2"
    setBrand,       // setter
    containerAttrs, // e.g. <div {...containerAttrs} />
  };
}
