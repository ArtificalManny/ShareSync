import React from "react";

/**
 * AnimatedRing
 * Wraps children with a soft pulsing halo.
 *
 * Props:
 *  - size: css length for the halo diameter (e.g. "44px"). Default: tokens --ring-size
 *  - thickness: css length for the ring outline. Default: tokens --ring-thickness
 *  - color: CSS color for the halo (uses currentColor / --accent if omitted)
 *  - animated: boolean (default true). If false, halo is static (no animation).
 *  - className: extra classes for the wrapper
 *
 * Usage:
 *  <AnimatedRing size="48px" color="rgb(79 70 229)">
 *    <img ... />   // avatar / icon / chip
 *  </AnimatedRing>
 *
 * Notes:
 *  - Animations respect prefers-reduced-motion via CSS (motion.css).
 */
export default function AnimatedRing({
  size,
  thickness,
  color,
  animated = true,
  className = "",
  children,
  style,
}) {
  const cssVars = {
    ...(size ? { ["--ring-size"]: size } : null),
    ...(thickness ? { ["--ring-thickness"]: thickness } : null),
    ...(color ? { ["--accent"]: colorToRgbTuple(color) } : null),
    ...style,
  };

  // We reuse the .avatar-ring utility from motion.css for the pulsing halos
  // and add a non-animated fallback if animated === false.
  return (
    <span
      className={[
        "avatar-ring",
        animated ? "" : "avatar-ring--static",
        className,
      ].join(" ")}
      style={cssVars}
    >
      {children}
      {/* When animated === false, we render a light static outline */}
      {!animated && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            width: "var(--ring-size)",
            height: "var(--ring-size)",
            borderRadius: "9999px",
            boxShadow: "0 0 0 var(--ring-thickness) rgb(var(--accent) / .25)",
            pointerEvents: "none",
          }}
        />
      )}
    </span>
  );
}

/** Accepts CSS color strings. If it's already `r g b` or `r,g,b`, pass through. */
function colorToRgbTuple(input) {
  if (!input) return null;
  // If user passed "r g b" or "r, g, b"
  if (/^\s*\d+\s*[, ]\s*\d+\s*[, ]\s*\d+\s*$/.test(input)) {
    return input.replaceAll(",", " ");
  }
  // If user passed rgb() / rgba()
  const m = String(input).match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (m) return `${m[1]} ${m[2]} ${m[3]}`;
  // Fallback: use current accent (let CSS var handle it)
  return null;
}
