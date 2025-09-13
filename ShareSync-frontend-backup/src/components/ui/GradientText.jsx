import React from "react";

/**
 * GradientText
 * Wraps text in a gradient via background-clip, with a solid-color fallback.
 *
 * Props:
 *  - as: tag name to render (default "span")
 *  - variant: "blue" | "purple" | "emerald" (default "blue")
 *  - fallbackColor: CSS color when gradient-clip is unavailable (default: currentColor)
 *  - className: extra classes
 */
export default function GradientText({
  as: Tag = "span",
  variant = "blue",
  fallbackColor = "currentColor",
  className = "",
  style,
  children,
}) {
  const variantClass =
    variant === "purple"
      ? "text-grad-purple"
      : variant === "emerald"
      ? "text-grad-emerald"
      : "text-grad-blue";
  return (
    <Tag
      className={[variantClass, className].join(" ")}
      style={{ WebkitTextFillColor: "transparent", color: fallbackColor, ...style }}
    >
      {children}
    </Tag>
  );
}
