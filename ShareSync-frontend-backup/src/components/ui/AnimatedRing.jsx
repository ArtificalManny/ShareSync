import React, { useEffect, useState } from "react";

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
 * Notes:
 *  - Also auto-disables animation if user prefers reduced motion.
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
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(!!mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  const shouldAnimate = animated && !reduced;

  const cssVars = {
    ...(size ? { ["--ring-size"]: size } : null),
    ...(thickness ? { ["--ring-thickness"]: thickness } : null),
    ...(color ? { ["--accent"]: colorToRgbTuple(color) } : null),
    ...style,
  };

  return (
    <span
      className={[
        "avatar-ring",
        shouldAnimate ? "" : "avatar-ring--static",
        className,
      ].join(" ")}
      style={cssVars}
    >
      {children}
      {!shouldAnimate && (
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
  // "r g b" or "r, g, b"
  if (/^\s*\d+\s*[, ]\s*\d+\s*[, ]\s*\d+\s*$/.test(input)) {
    return input.replaceAll(",", " ");
  }
  // rgb()/rgba()
  const m = String(input).match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (m) return `${m[1]} ${m[2]} ${m[3]}`;
  return null; // fallback: current --accent
}
