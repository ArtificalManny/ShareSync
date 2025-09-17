import React from "react";

/**
 * Typography primitives built on your token scale.
 * Uses CSS vars from tokens.css so the type system stays consistent
 * regardless of Tailwind breakpoints.
 *
 * Exports: H1, H2, H3, H4, H5, H6, Lead, Body, Muted, Eyebrow
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function HeadingBase({
  as: Tag = "h2",
  sizeVar = "--fs-xl",
  weightVar = "--fw-semibold",
  className = "",
  children,
  ...rest
}) {
  return (
    <Tag
      className={cx("font-display tracking-tight", className)}
      style={{
        fontSize: `var(${sizeVar})`,
        lineHeight: "var(--lh-tight)",
        fontWeight: `var(${weightVar})`,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function H1(props) {
  return <HeadingBase as="h1" sizeVar="--fs-3xl" weightVar="--fw-bold" {...props} />;
}
export function H2(props) {
  return <HeadingBase as="h2" sizeVar="--fs-2xl" weightVar="--fw-semibold" {...props} />;
}
export function H3(props) {
  return <HeadingBase as="h3" sizeVar="--fs-xl" weightVar="--fw-semibold" {...props} />;
}
export function H4(props) {
  return <HeadingBase as="h4" sizeVar="--fs-lg" weightVar="--fw-medium" {...props} />;
}
export function H5(props) {
  return <HeadingBase as="h5" sizeVar="--fs-md" weightVar="--fw-medium" {...props} />;
}
export function H6(props) {
  return <HeadingBase as="h6" sizeVar="--fs-sm" weightVar="--fw-medium" {...props} />;
}

export function Lead({ as: Tag = "p", className = "", children, ...rest }) {
  return (
    <Tag
      className={cx("text-text", className)}
      style={{
        fontFamily: "var(--font-body)",
        fontSize: "var(--fs-lg)",
        lineHeight: "var(--lh-normal)",
        fontWeight: "var(--fw-medium)",
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function Body({ as: Tag = "p", className = "", children, size = "md", ...rest }) {
  const sizeVar = size === "sm" ? "--fs-sm" : size === "lg" ? "--fs-lg" : "--fs-md";
  return (
    <Tag
      className={cx("text-text", className)}
      style={{
        fontFamily: "var(--font-body)",
        fontSize: `var(${sizeVar})`,
        lineHeight: "var(--lh-normal)",
        fontWeight: "var(--fw-regular)",
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function Muted({ as: Tag = "p", className = "", children, size = "sm", ...rest }) {
  const sizeVar = size === "xs" ? "--fs-xs" : size === "md" ? "--fs-md" : "--fs-sm";
  return (
    <Tag
      className={cx("text-muted", className)}
      style={{
        fontFamily: "var(--font-body)",
        fontSize: `var(${sizeVar})`,
        lineHeight: "var(--lh-normal)",
        fontWeight: "var(--fw-regular)",
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function Eyebrow({ as: Tag = "div", className = "", children, ...rest }) {
  return (
    <Tag
      className={cx("uppercase tracking-wide", className)}
      style={{
        fontFamily: "var(--font-display)",
        fontSize: "var(--fs-xs)",
        lineHeight: "var(--lh-snug)",
        fontWeight: "var(--fw-semibold)",
        letterSpacing: "0.06em",
        color: "rgb(var(--muted))",
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export default {
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Lead,
  Body,
  Muted,
  Eyebrow,
};
