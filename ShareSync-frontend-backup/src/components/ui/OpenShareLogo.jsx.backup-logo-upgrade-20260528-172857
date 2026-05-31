import React from 'react';

/**
 * OpenShare logo
 *
 * Design goals:
 * - Memorable at 16px
 * - Works in monochrome
 * - One dominant idea: open orbit + shared flow
 * - Feels premium, calm, and precise
 */
export default function OpenShareLogo({
  className = "w-8 h-8 text-slate-900 dark:text-slate-100",
  title = "OpenShare Logo",
  monochrome = false,
}) {
  const accent = monochrome ? "currentColor" : "#7C3AED";

  return (
    <svg
      viewBox="0 0 36 36"
      width="1em"
      height="1em"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <title>{title}</title>

      {/*
        Single-element orbit mark.
        Broken arc (~280°) = "open" in OpenShare.
        One color. One concept. One stroke.
        Reads as a stylized O at a glance.
      */}
      <path
        d="M26.2 8.5
           A 13 13 0 1 1 14.6 5.4"
        stroke={accent}
        strokeWidth="3.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
