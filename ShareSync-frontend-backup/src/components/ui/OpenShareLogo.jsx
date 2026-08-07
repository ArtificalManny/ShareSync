import React, { useId } from "react";

/**
 * OpenShare logo
 *
 * Visual idea:
 * - Open circle = openness / accessible collaboration
 * - Two flowing arcs = people and work moving together
 * - Two nodes = connection / sharing
 * - Open gaps = projects are never visually "closed off"
 */
export default function OpenShareLogo({
  className = "w-8 h-8 text-slate-900 dark:text-slate-100",
  title = "OpenShare Logo",
  monochrome = false,
  animated = false,
  variant = "mark",
  markClassName = "w-10 h-10 shrink-0",
  wordmarkClassName = "text-2xl",
}) {
  const rawId = useId().replace(/:/g, "");

  const purpleGradientId = `openshare-purple-${rawId}`;
  const blueGradientId = `openshare-blue-${rawId}`;

  const purpleStroke = monochrome
    ? "currentColor"
    : `url(#${purpleGradientId})`;

  const blueStroke = monochrome
    ? "currentColor"
    : `url(#${blueGradientId})`;

  const purpleDot = monochrome ? "currentColor" : "#7C3AED";
  const cyanDot = monochrome ? "currentColor" : "#22D3EE";

  const mark = (
    <svg
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      className={variant === "lockup" ? markClassName : className}
      fill="none"
      role={variant === "lockup" ? undefined : "img"}
      aria-label={variant === "lockup" ? undefined : title}
      aria-hidden={variant === "lockup" ? "true" : undefined}
    >
      {variant !== "lockup" && <title>{title}</title>}

      {!monochrome && (
        <defs>
          {/* Left / lower arc */}
          <linearGradient
            id={purpleGradientId}
            x1="9"
            y1="9"
            x2="25"
            y2="34"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="48%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#C084FC" />
          </linearGradient>

          {/* Upper / right arc */}
          <linearGradient
            id={blueGradientId}
            x1="18"
            y1="5"
            x2="33"
            y2="29"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="52%" stopColor="#0EA5E9" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
      )}

      <g>
        {animated && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 20 20"
            to="360 20 20"
            dur="18s"
            repeatCount="indefinite"
          />
        )}

        {/*
          Purple arc

          Starts near the upper-left node and travels around
          the left + bottom side of the mark.
        */}
        <path
          d="M13.8 10.4
             A13.4 13.4 0 0 0 24.6 32.1"
          stroke={purpleStroke}
          strokeWidth="5.1"
          strokeLinecap="round"
        />

        {/*
          Blue arc

          Starts across the top and travels around
          the right side toward the cyan node.
        */}
        <path
          d="M18.5 7.2
             A13.4 13.4 0 0 1 30.3 25.3"
          stroke={blueStroke}
          strokeWidth="5.1"
          strokeLinecap="round"
        />

        {/* Purple connection node */}
        <circle
          cx="13.3"
          cy="8.6"
          r="2.65"
          fill={purpleDot}
        />

        {/* Cyan connection node */}
        <circle
          cx="29.2"
          cy="27.8"
          r="2.65"
          fill={cyanDot}
        />
      </g>
    </svg>
  );

  if (variant !== "lockup") {
    return mark;
  }

  return (
    <span
      className={`inline-flex items-center gap-2.5 ${className}`}
      role="img"
      aria-label="OpenShare"
    >
      {mark}

      <span
        aria-hidden="true"
        className={`inline-flex items-baseline font-semibold tracking-[-0.045em] leading-none ${wordmarkClassName}`}
      >
        <span className="text-slate-950 dark:text-white">
          Open
        </span>
        <span className="bg-gradient-to-r from-violet-600 via-indigo-500 to-blue-500 bg-clip-text text-transparent">
          Share
        </span>
      </span>
    </span>
  );
}
