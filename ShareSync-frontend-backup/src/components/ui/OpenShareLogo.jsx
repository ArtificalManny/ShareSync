import React, { useId } from 'react';

/**
 * OpenShare logo
 *
 * Visual idea:
 * - Open orbit = openness / shared workspace
 * - Signal wave = collaboration moving through the system
 * - Live dot = active momentum / public network
 */
export default function OpenShareLogo({
  className = "w-8 h-8 text-slate-900 dark:text-slate-100",
  title = "OpenShare Logo",
  monochrome = false,
  animated = false,
}) {
  const rawId = useId().replace(/:/g, '');
  const orbitGradientId = `openshare-orbit-${rawId}`;
  const signalGradientId = `openshare-signal-${rawId}`;
  const plateGradientId = `openshare-plate-${rawId}`;
  const glowId = `openshare-glow-${rawId}`;

  const orbitStroke = monochrome ? "currentColor" : `url(#${orbitGradientId})`;
  const signalStroke = monochrome ? "currentColor" : `url(#${signalGradientId})`;
  const dotFill = monochrome ? "currentColor" : "#2DD4BF";

  return (
    <svg
      viewBox="0 0 40 40"
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

      {!monochrome && (
        <defs>
          <radialGradient id={plateGradientId} cx="35%" cy="25%" r="75%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
            <stop offset="36%" stopColor="#F5F3FF" stopOpacity="0.92" />
            <stop offset="72%" stopColor="#ECFEFF" stopOpacity="0.74" />
            <stop offset="100%" stopColor="#EEF2FF" stopOpacity="0.48" />
          </radialGradient>

          <linearGradient id={orbitGradientId} x1="7" y1="6" x2="34" y2="34">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="42%" stopColor="#7C3AED" />
            <stop offset="74%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#2DD4BF" />
          </linearGradient>

          <linearGradient id={signalGradientId} x1="11" y1="22" x2="29" y2="18">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="54%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#2DD4BF" />
          </linearGradient>

          <filter id={glowId} x="-45%" y="-45%" width="190%" height="190%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="
                0 0 0 0 0.486
                0 0 0 0 0.227
                0 0 0 0 0.929
                0 0 0 .42 0
              "
              result="coloredBlur"
            />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}

      <g>
        {animated && !monochrome && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 20 20"
            to="360 20 20"
            dur="18s"
            repeatCount="indefinite"
          />
        )}

        {!monochrome && (
          <circle
            cx="20"
            cy="20"
            r="17.4"
            fill={`url(#${plateGradientId})`}
            opacity="0.78"
          />
        )}

        <path
          d="M29.4 8.6 A15 15 0 1 1 13.1 7.5"
          stroke={orbitStroke}
          strokeWidth="4.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={monochrome ? undefined : `url(#${glowId})`}
        />

        <path
          d="M12.1 21.2 C15.2 16.8 18.2 16.8 20.2 20 C22.2 23.2 25.2 23.2 28.2 18.8"
          stroke={signalStroke}
          strokeWidth="2.35"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={monochrome ? "0.92" : "1"}
        />

        <circle
          cx="29.45"
          cy="8.65"
          r="2.55"
          fill={dotFill}
          filter={monochrome ? undefined : `url(#${glowId})`}
        />

        {!monochrome && (
          <circle cx="29.45" cy="8.65" r="5.25" fill="#2DD4BF" opacity="0.18" />
        )}
      </g>
    </svg>
  );
}
