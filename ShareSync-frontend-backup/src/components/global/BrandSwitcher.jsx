import React from "react";
import { Sparkles, Palette } from "lucide-react";
import useBrandTheme from "../../hooks/useBrandTheme";
import { nextBrand } from "../../utils/brand";
import { BRAND_V2 as FLAG_BRAND_V2 } from "../../config/flags";
import { track, trackBrandSwitched as _trackBrandSwitched } from "../../utils/telemetry";

/**
 * Small toggle button/menu to flip brand theme.
 * - Persists to localStorage via useBrandTheme
 * - Emits telemetry: "brand_switched"
 *
 * Usage:
 *   <BrandSwitcher className="ml-2" />
 */
export default function BrandSwitcher({ className = "" }) {
  const { enabled, brand, setBrand } = useBrandTheme();

  if (!enabled || !FLAG_BRAND_V2) return null;

  const onToggle = () => {
    const next = nextBrand(brand);
    setBrand(next);
    // telemetry (safe if helper missing)
    try {
      const fn = _trackBrandSwitched || ((props) => track?.("brand_switched", props));
      fn?.({ to: next });
    } catch {}
  };

  const isV2 = brand === "v2";

  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        "relative inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs",
        "hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
        className,
      ].join(" ")}
      title={isV2 ? "Switch to Classic look" : "Switch to Brand V2"}
      aria-pressed={isV2 ? "true" : "false"}
    >
      {isV2 ? (
        <>
          <Sparkles className="w-4 h-4 text-indigo-600" />
          Brand V2
        </>
      ) : (
        <>
          <Palette className="w-4 h-4" />
          Classic
        </>
      )}
    </button>
  );
}
