import React, { useEffect, useState, useMemo } from "react";

/**
 * AnimatedRing
 * Wraps children with a soft pulsing halo + optional gradient stroke ring.
 *
 * Props:
 *  - size: css length for the halo diameter (e.g. "44px"). Default: tokens --ring-size
 *  - thickness: css length for the ring outline. Default: tokens --ring-thickness
 *  - color: CSS color for the halo glow (uses current --accent if omitted)
 *  - variant: optional gradient ring variant: "pandora" | "cnbc" | "ig"
 *             Reads from gradient tokens (--grad-*-a/b/c/d).
 *  - animated: boolean (default true). If false, halo is static (no animation).
 *  - className, style: passthrough
 */
export default function AnimatedRing({
  size,
  thickness,
  color,
  variant,           // "pandora" | "cnbc" | "ig"
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

  /** CSS variables to drive motion.css avatar ring + optional stroke ring */
  const cssVars = {
    ...(size ? { ["--ring-size"]: size } : null),
    ...(thickness ? { ["--ring-thickness"]: thickness } : null),
    ...(color ? { ["--accent"]: colorToRgbTuple(color) } : null),
    ...style,
  };

  // Border-image conic gradient definition for the stroke ring
  const gradientBorderImage = useMemo(() => {
    if (!variant) return null;

    const conic = buildConicGradient(variant);
    return {
      border: "var(--ring-thickness) solid transparent",
      borderImage: `${conic} 1`,
      borderRadius: "9999px",
      pointerEvents: "none",
      position: "absolute",
      width: "var(--ring-size)",
      height: "var(--ring-size)",
      inset: 0,
      margin: "auto",
    };
  }, [variant]);

  return (
    <span
      className={[
        "avatar-ring",
        shouldAnimate ? "" : "avatar-ring--static",
        className,
      ].join(" ")}
      style={cssVars}
    >
      {/* Gradient stroke ring (optional) */}
      {variant && <span aria-hidden="true" style={gradientBorderImage} />}

      {children}

      {/* Static fallback halo if animations disabled */}
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

/**
 * Build a conic-gradient string from tokenized gradient stops.
 * Uses CSS Color 4 syntax `rgb(var(--token) / alpha)` so it respects light/dark
 * overrides set in tokens.css and theme.css.
 */
function buildConicGradient(variant) {
  switch (variant) {
    case "pandora":
      return `conic-gradient(
        from 0deg,
        rgb(var(--grad-pandora-a)),
        rgb(var(--grad-pandora-b)),
        rgb(var(--grad-pandora-a))
      )`;
    case "cnbc":
      return `conic-gradient(
        from 0deg,
        rgb(var(--grad-cnbc-a)),
        rgb(var(--grad-cnbc-b)),
        rgb(var(--grad-cnbc-a))
      )`;
    case "ig":
      return `conic-gradient(
        from 0deg,
        rgb(var(--grad-ig-a)),
        rgb(var(--grad-ig-b)),
        rgb(var(--grad-ig-c)),
        rgb(var(--grad-ig-d)),
        rgb(var(--grad-ig-a))
      )`;
    default:
      // fallback to current accent for a subtle ring
      return `conic-gradient(from 0deg, rgb(var(--accent) / .85), rgb(var(--accent) / .35), rgb(var(--accent) / .85))`;
  }
}
