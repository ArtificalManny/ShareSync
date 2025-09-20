import React, { useEffect, useRef } from "react";

/**
 * Modal
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - title?: string | ReactNode
 *  - children: ReactNode
 *  - initialFocusRef?: React.RefObject (focus on open)
 *  - className?: string (panel extra classes)
 */
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

  // Lock scroll & focus management
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

  // ESC to close
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
          // Close only when clicking the overlay (not the panel)
          if (e.target === overlayRef.current) onClose?.();
        }}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        className={`modal-panel focus:outline-none ${className}`}
        tabIndex={-1}
      >
        {title ? (
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="text-sm font-semibold">{title}</div>
            <button
              type="button"
              className="text-sm rounded-md px-2 py-1 hover:bg-surface"
              onClick={() => onClose?.()}
            >
              Close
            </button>
          </div>
        ) : null}

        <div className="p-4">{children}</div>
      </div>
    </>
  );
}
