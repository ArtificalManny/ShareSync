import React, { useId } from 'react';

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
  const id = useId();
  const gradientId = `${id}-openshare-flow`;
  const accent = monochrome ? "currentColor" : `url(#${gradientId})`;

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

      <defs>
        <linearGradient
          id={gradientId}
          x1="9"
          y1="26"
          x2="27"
          y2="8"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="55%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>

      {/* Open orbit: signals openness, system, continuity */}
      <path
        d="M24.2 4.4A14 14 0 1 1 6 26.5"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Shared flow: one continuous motion inside the orbit */}
      <path
        d="
          M23.1 10.2
          C20.7 8.4 16 8.1 12.8 9.4
          C9.8 10.7 9.5 13.8 12.3 15
          C13.4 15.4 14.8 15.8 16.4 16.1
          C18.7 16.5 20.4 16.9 21.5 17.7
          C24 19.4 23.8 22.7 21.1 24.5
          C18.2 26.4 13.6 26.2 10.8 24.2
        "
        stroke={accent}
        strokeWidth="4.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
