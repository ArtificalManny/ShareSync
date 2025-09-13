import React, { useEffect, useState, useRef } from "react";

/**
 * Toaster
 * - Listens for `window.dispatchEvent(new CustomEvent('sharesync:toast', { detail }))`
 * - detail: { title, description?, variant?: 'success'|'warning'|'error'|'info', id?, ttl? }
 * - Success toasts get "win-glow" + "marching" accent.
 */
const TONES = {
  success: { bg: "var(--tint-success)", fg: "var(--success)" },
  warning: { bg: "var(--tint-warning)", fg: "var(--warning)" },
  error:   { bg: "var(--tint-danger)",  fg: "var(--danger)"  },
  info:    { bg: "var(--accent-50)",    fg: "var(--accent)"  },
};

export default function Toaster() {
  const [items, setItems] = useState([]);
  const idRef = useRef(0);

  useEffect(() => {
    function onToast(e) {
      const d = e?.detail || {};
      const id = d.id ?? (++idRef.current);
      const variant = d.variant || "info";
      const ttl = Math.max(1800, Math.min(6000, d.ttl ?? 3200));
      setItems((prev) => [...prev, { id, ...d, variant, ttl }]);
      setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), ttl);
    }
    window.addEventListener("sharesync:toast", onToast);
    return () => window.removeEventListener("sharesync:toast", onToast);
  }, []);

  return (
    <div className="fixed z-[9999] bottom-4 right-4 flex flex-col gap-2 pointer-events-none">
      {items.map((t) => {
        const tone = TONES[t.variant] || TONES.info;
        const marching = t.variant === "success";
        return (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={[
              "pointer-events-auto rounded-xl border px-3 py-2 min-w-[240px] shadow",
              t.variant === "success" ? "win-glow" : "",
              marching ? "marching" : "",
            ].join(" ")}
            style={{
              background: tone.bg,
              color: tone.fg,
              borderColor: "var(--border)",
              // let .marching pick up the right hue
              ["--march-color"]: marching ? "var(--success)" : undefined,
              ["--march-speed"]: "2600ms",
              ["--march-stroke"]: "2px",
            }}
          >
            <div className="text-sm font-semibold">{t.title}</div>
            {t.description ? <div className="mt-0.5 text-xs opacity-90">{t.description}</div> : null}
          </div>
        );
      })}
    </div>
  );
}

export function toast({ title, description, variant = "info", ttl } = {}) {
  window.dispatchEvent(new CustomEvent("sharesync:toast", { detail: { title, description, variant, ttl } }));
}