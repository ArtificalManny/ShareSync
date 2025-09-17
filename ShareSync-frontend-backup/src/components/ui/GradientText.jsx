import React from "react";

/**
 * GradientText
 * Wraps text in a gradient via background-clip, with a solid-color fallback.
 *
 * Props:
 *  - as: tag name to render (default "span")
 *  - variant:
 *      "indigo" | "blue" | "purple" | "emerald" | "pink"
 *      "pandora" | "cnbc" | "ig"
 *    (default "indigo")
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
  const v = String(variant || "indigo").toLowerCase();

  // Map variants to gradient utility classes (from gradients.css)
  const variantClass =
    v === "purple"
      ? "text-grad-purple"
      : v === "emerald"
      ? "text-grad-emerald"
      : v === "pandora"
      ? "text-grad-pandora"
      : v === "cnbc"
      ? "text-grad-cnbc"
      : v === "ig"
      ? "text-grad-ig"
      : "text-grad-blue"; // treat "indigo" and "blue" the same

  // Pink (adhoc; we don't ship a dedicated token/class)
  const pinkStyle =
    v === "pink"
      ? {
          backgroundImage:
            "linear-gradient(135deg, rgb(236 72 153), rgb(244 114 182))",
        }
      : null;

  return (
    <Tag
      className={["font-display", variantClass, className].join(" ")}
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
