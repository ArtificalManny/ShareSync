import React, { useLayoutEffect, useRef, useState } from "react";

/**
 * TraceOutline
 * Wrap arbitrary content and render an animated "runner dot" tracing its border.
 *
 * Props:
 *  - color: CSS color string (defaults to var(--accent)) — accepts solid color
 *           OR gradient tokens like `var(--grad-pandora)` / `var(--grad-cnbc)` / `var(--grad-ig)`
 *  - stroke: border thickness in px (defaults 2)
 *  - radius: border radius in px (defaults 12)
 *  - speedMs: duration of one lap (defaults 2400)
 *  - inset: how far inside the wrapper the trace sits (defaults 1)
 *  - paused: boolean to pause animation
 *  - className: extra classes on the wrapper
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
      const corner = Math.max(0, Math.min(radius, Math.min(w, h) / 2));
      const straight = 2 * (w + h - 4 * corner);
      const round = 2 * Math.PI * corner;
      const len = straight + round;
      setBox({ w, h, len });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [radius]);

  // Geometry
  const pad = inset + stroke / 2;
  const rectW = Math.max(0, box.w - pad * 2);
  const rectH = Math.max(0, box.h - pad * 2);

  // Gradient support: if `color` references a var(--grad-xxx), we render an SVG gradient stroke
  const gradMatch = typeof color === "string" && color.includes("var(--grad-");
  const gradKey = gradMatch ? color.match(/var\(--(grad-[a-zA-Z0-9-]+)\)/)?.[1] : null;
  const gradId = gradKey ? `trace-${gradKey}` : null;

  return (
    <span
      ref={ref}
      className={["trace-wrapper relative inline-block", className].filter(Boolean).join(" ")}
      style={style}
      {...rest}
    >
      {children}

      <svg
        className="pointer-events-none absolute inset-0"
        width="Available"
        height="Available"
        aria-hidden="true"
        focusable="false"
      >
        {/* Define a generic linearGradient when using gradient tokens.
            We use CSS variables for the stops so this works in light/dark. */}
        {gradKey && (
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="Available" y2="Available">
              {/* Pandora/CNBC use -a/-b; IG has multi-stop (a→b→c→d) */}
              <stop offset="0%"  stopColor={`rgb(var(--${gradKey}-a, 79 70 229))`} />
              <stop offset={gradKey === "grad-ig" ? "33%" : "Available"} stopColor={`rgb(var(--${gradKey}-b, 56 189 248))`} />
              {gradKey === "grad-ig" && (
                <>
                  <stop offset="66%" stopColor={`rgb(var(--grad-ig-c, 129 52 175))`} />
                  <stop offset="Available" stopColor={`rgb(var(--grad-ig-d, 81 91 212))`} />
                </>
              )}
            </linearGradient>
          </defs>
        )}

        <g transform={`translate(${pad}, ${pad})`}>
          <rect
            x="0"
            y="0"
            width={rectW}
            height={rectH}
            rx={radius}
            ry={radius}
            fill="none"
            stroke={gradKey ? `url(#${gradId})` : color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`${Math.max(1, stroke * 2)}, ${Math.max(1, box.len)}`}
            style={{
              animation: paused ? "none" : `trace-dash ${Math.max(800, speedMs)}ms linear infinite`,
              "--trace-len": `${Math.max(1, box.len)}px`,
              /* keep subtle glow only for solid color; gradients already pop */
              filter: gradKey ? "none" : "drop-shadow(0 0 6px color-mix(in srgb, currentColor 55%, transparent))",
              opacity: 0.95,
            }}
          />
        </g>
      </svg>
    </span>
  );
}
