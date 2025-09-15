import React from "react";

/**
 * GradientText
 * Wraps text in a gradient via background-clip, with a solid-color fallback.
 *
 * Props:
 *  - as: tag name to render (default "span")
 *  - variant: "indigo" | "blue" | "purple" | "emerald" | "pink" (default "indigo")
 *  - fallbackColor: CSS color when gradient-clip is unavailable (default: currentColor)
 *  - className: extra classes
 */
export default function GradientText({
  as: Tag = "span",
  variant = "indigo",
  fallbackColor = "currentColor",
  className = "",
  style,
  children,
}) {
  const v = (variant || "indigo").toLowerCase();
  const variantClass =
    v === "purple"
      ? "text-grad-purple"
      : v === "emerald"
      ? "text-grad-emerald"
      : "text-grad-blue"; // treat "indigo" and "blue" the same

  // Pink fallback (we don't have a dedicated class in gradients.css)
  const pinkStyle =
    v === "pink"
      ? {
          backgroundImage:
            "linear-gradient(135deg, rgb(236 72 153), rgb(244 114 182))",
        }
      : null;

  return (
    <Tag
      className={[variantClass, className].join(" ")}
      style={{
        WebkitTextFillColor: "transparent",
        color: fallbackColor,
        ...(pinkStyle || {}),
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}