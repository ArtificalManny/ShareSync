import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * TraceOutline
 * Wrap arbitrary content and render an animated "runner dot" tracing its border.
 *
 * Props:
 *  - color: CSS color string (defaults to var(--accent))
 *  - stroke: border thickness in px (defaults 2)
 *  - radius: border radius in px (defaults 12)
 *  - speedMs: duration of one lap (defaults 2400)
 *  - inset: how far inside the wrapper the trace sits (defaults 1)
 *  - paused: boolean to pause animation
 *  - className: extra classes on the wrapper
 *
 * Usage:
 *  <TraceOutline><button className="btn btn--primary press-shrink">Start</button></TraceOutline>
 */
export default function TraceOutline({
  children,
  color = "var(--accent)",
  stroke = 2,
  radius = 12,
  speedMs = 2400,
  inset = 1,
  paused = false,
  className = "",
  style,
  ...rest
}) {
  const ref = useRef(null);
  const [box, setBox] = useState({ w: 0, h: 0, len: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const w = Math.max(0, Math.round(r.width));
      const h = Math.max(0, Math.round(r.height));
      // Rounded-rect perimeter approximation (true rounded perimeter = 2πr for 4 corners + edges)
      const corner = Math.max(0, Math.min(radius, Math.min(w, h) / 2));
      const straight = 2 * (w + h - 4 * corner);
      const round = 2 * Math.PI * corner;
      const len = straight + round;
      setBox({ w, h, len });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [radius]);

  // We render an absolutely-positioned SVG on top with pointer-events none.
  const pad = inset + stroke / 2;
  const rectW = Math.max(0, box.w - pad * 2);
  const rectH = Math.max(0, box.h - pad * 2);

  return (
    <span
      ref={ref}
      className={["trace-wrapper relative inline-block", className].filter(Boolean).join(" ")}
      style={style}
      {...rest}
    >
      {children}

      {/* overlay */}
      <svg
        className="pointer-events-none absolute inset-0"
        width="100%"
        height="100%"
        aria-hidden="true"
        focusable="false"
      >
        <g transform={`translate(${pad}, ${pad})`}>
          <rect
            x="0"
            y="0"
            width={rectW}
            height={rectH}
            rx={radius}
            ry={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            // Make the stroke a single "dot" using dasharray: [dotLength, gapLength]
            // The gap uses the measured perimeter so only one dot shows.
            strokeDasharray={`${Math.max(1, stroke * 2)}, ${Math.max(1, box.len)}`}
            style={{
              // One full lap every speedMs
              animation: paused ? "none" : `trace-dash ${Math.max(800, speedMs)}ms linear infinite`,
              // The total length controls apparent speed; align with our measured value
              // The keyframe animates dashoffset from 0 -> len, we pass len via CSS var to keep it cheap.
              // (We also set a fallback so SSR doesn't flash)
              "--trace-len": `${Math.max(1, box.len)}px`,
              filter: "drop-shadow(0 0 6px color-mix(in srgb, currentColor 55%, transparent))",
              opacity: 0.95,
            }}
          />
        </g>
      </svg>
    </span>
  );
}