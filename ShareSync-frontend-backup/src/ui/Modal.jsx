import React, { useEffect, useRef } from "react";

export default function Modal({
  open,
  onClose,
  title,
  children,
  initialFocusRef,
  className = "",
}) {
  const overlayRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const toFocus = initialFocusRef?.current || panelRef.current;
    setTimeout(() => toFocus?.focus?.(), 0);
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open, initialFocusRef]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        ref={overlayRef}
        className="modal-overlay"
        onClick={(e) => {
          if (e.target === overlayRef.current) onClose?.();
        }}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        className={`modal-panel focus:outline-none bg-white/95 backdrop-blur-xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.2),0_0_0_1px_rgba(0,0,0,0.05)] ring-1 ring-white/50 rounded-2xl ${className}`}
        tabIndex={-1}
      >
        {title ? (
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-800">{title}</div>
            <button
              type="button"
              className="text-xs font-medium rounded-lg px-2.5 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors active:scale-95"
              onClick={() => onClose?.()}
            >
              Close
            </button>
          </div>
        ) : null}

        <div className="p-5">{children}</div>
      </div>
    </>
  );
}
