import React from "react";

/**
 * GradientIcon
 * Applies a gradient to icons that inherit currentColor (e.g., lucide-react).
 *
 * Props:
 *  - icon: React component (from lucide-react or your own SVG component)
 *  - size: number | string (px)  default 16
 *  - variant: "blue" | "purple" | "emerald" (default "blue")
 *  - className: extra classes
 *  - strokeWidth: number for lucide icons (default 2)
 *  - ...rest: forwarded to the icon component
 */
export default function GradientIcon({
  icon: Icon,
  size = 16,
  variant = "blue",
  className = "",
  strokeWidth = 2,
  ...rest
}) {
  if (!Icon) return null;
  const variantClass =
    variant === "purple"
      ? "stroke-grad-purple"
      : variant === "emerald"
      ? "stroke-grad-emerald"
      : "stroke-grad-blue";
  const px = typeof size === "number" ? `${size}px` : size;
  return (
    <span
      className={[variantClass, className].join(" ")}
      style={{ display: "inline-flex", lineHeight: 0 }}
      aria-hidden="true"
    >
      <Icon width={px} height={px} strokeWidth={strokeWidth} />
    </span>
  );
}
