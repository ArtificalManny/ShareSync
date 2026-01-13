// Central helpers/constants for brand theming.

// ⭐ NEW OPENSHARE IDENTITY
export const BRAND_NAME = "OpenShare";
export const DOMAIN_NAME = "openshare.ca";
export const TAGLINE = "The only project tracker that prevents burnout before it happens.";

// EXISTING TECHNICAL CONSTANTS
export const BRAND_KEY = "ss.brand";               // localStorage key
export const BRAND_DATA_ATTR = "data-brand";       // attribute we set on a container or <html>
export const BRAND_CLASSIC = "classic";
export const BRAND_V2 = "v2";

export const BRANDS = [BRAND_CLASSIC, BRAND_V2];

export function isValidBrand(v) {
  return BRANDS.includes(String(v || "").toLowerCase());
}

export function normalizeBrand(v, fallback = BRAND_CLASSIC) {
  const s = String(v || "").toLowerCase();
  return isValidBrand(s) ? s : fallback;
}

// Simple toggle helper (classic ↔ v2)
export function nextBrand(curr) {
  return normalizeBrand(curr) === BRAND_V2 ? BRAND_CLASSIC : BRAND_V2;
}
