import React, { useEffect, useRef } from "react";

/**
 * ConfirmDialog
 *
 * Props:
 *  - open: boolean
 *  - title: string
 *  - message?: string | ReactNode
 *  - confirmText?: string (default: "Confirm")
 *  - cancelText?: string (default: "Cancel")
 *  - danger?: boolean (styles confirm as destructive)
 *  - busy?: boolean (disable buttons and show spinner)
 *  - onConfirm: () => void
 *  - onCancel: () => void
 */
export default function ConfirmDialog({
  open,
  title,
  message = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  const firstBtnRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => firstBtnRef.current?.focus(), 20);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30 dark:bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        className="fixed z-50 inset-x-4 top-28 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 w-[min(520px,calc(100%-2rem))] rounded-2xl border border-border bg-surface shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-text">{title}</h3>
        </div>

        <div className="p-4 text-sm text-muted">
          {typeof message === "string" ? <p>{message}</p> : message}
        </div>

        <div className="px-4 py-3 border-t border-border flex items-center justify-end gap-2">
          <button
            ref={firstBtnRef}
            className="rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={[
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white",
              danger
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-indigo-600 hover:bg-indigo-700",
              busy ? "opacity-60 cursor-wait" : "",
            ].join(" ")}
          >
            {busy && <span className="w-4 h-4 animate-spin border-2 border-white/80 border-t-transparent rounded-full" />}
            {confirmText}
          </button>
        </div>
      </div>
    </>
  );
}
