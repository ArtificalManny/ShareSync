import React, { useEffect, useRef, useState } from "react";

/**
 * ToastHost
 * - Listens for `window.dispatchEvent(new CustomEvent('sharesync:toast', { detail }))`
 * - detail: { title, description?, variant?: 'success'|'warning'|'error'|'info', id?, ttl? }
 * - Success toasts get subtle “marching” accent (motion-gated via motion.css).
 *
 * Usage:
 *   <ToastHost />
 *   import { toast } from './components/ui/toast'
 *   toast({ title: 'Saved', variant: 'success' })
 */

const TONES = {
  success: {
    bg: "rgb(16 185 129 / 0.10)",
    fg: "rgb(16 185 129)",
  },
  warning: {
    bg: "rgb(217 119 6 / 0.10)",
    fg: "rgb(217 119 6)",
  },
  error: {
    bg: "rgb(244 63 94 / 0.10)",
    fg: "rgb(244 63 94)",
  },
  info: {
    bg: "rgb(var(--accent, 99 102 241) / 0.10)",
    fg: "rgb(var(--accent, 99 102 241))",
  },
};

export const ToastHost = () => {
  const [items, setItems] = useState([]);
  const idRef = useRef(0);

  useEffect(() => {
    const onToast = (e) => {
      const d = e?.detail || {};
      const id = d.id ?? (++idRef.current);
      const variant = d.variant || "info";
      const ttl = Math.max(1800, Math.min(6000, d.ttl ?? 3200));
      setItems((prev) => [...prev, { id, ...d, variant, ttl }]);
      const t = setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== id));
      }, ttl);
      return () => clearTimeout(t);
    };
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
              borderColor: "rgb(var(--border, 226 232 240))",
              ["--march-speed"]: "2600ms",
            }}
          >
            <div className="text-sm font-semibold">{t.title}</div>
            {t.description ? <div className="mt-0.5 text-xs opacity-90">{t.description}</div> : null}
          </div>
        );
      })}
    </div>
  );
};

export function toast({ title, description, variant = "info", ttl } = {}) {
  window.dispatchEvent(
    new CustomEvent("sharesync:toast", {
      detail: { title, description, variant, ttl },
    })
  );
}

export default ToastHost;
