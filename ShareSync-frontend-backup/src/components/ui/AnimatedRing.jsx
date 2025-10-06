import React from "react";
import { cn } from "../ui/cn";

/**
 * AnimatedRing – single pulse halo
 * Props:
 *  - size: css size (e.g. "48px")
 *  - thickness: border size (e.g. "2px")
 *  - className: extra classes
 *  - animated: boolean (when true, plays once)
 */
export default function AnimatedRing({
  size = "44px",
  thickness = "2px",
  className = "",
  animated = true,
}) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 rounded-full", animated ? "pulse-once" : "", className)}
      style={{
        boxShadow: `0 0 0 ${thickness} rgba(99,102,241,.35)`,
        width: size,
        height: size,
        left: `calc(50% - ${size}/2)`,
        top:  `calc(50% - ${size}/2)`,
      }}
    />
  );
}
