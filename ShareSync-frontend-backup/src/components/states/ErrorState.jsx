// src/components/states/ErrorState.jsx
import React, { useState } from "react";
import Button from "../ui/Button.jsx";

/**
 * ErrorState
 * - Consistent error panel with optional retry and details toggle.
 *
 * Props:
 *  - message?: string
 *  - details?: string | Error | ReactNode
 *  - onRetry?: () => void
 *  - retryLabel?: string
 *  - className?: string
 *  - icon?: ReactNode
 */
export default function ErrorState({
  message = "Something went wrong.",
  details = null,
  onRetry,
  retryLabel = "Retry",
  className = "",
  icon = null,
}) {
  const [open, setOpen] = useState(false);

  const hasDetails =
    details !== null &&
    details !== undefined &&
    (typeof details === "string" || React.isValidElement(details) || details?.message);

  const renderDetails = () => {
    if (!hasDetails || !open) return null;
    const text =
      typeof details === "string"
        ? details
        : React.isValidElement(details)
        ? details
        : String(details?.message || "");

    return (
      <div className="mt-2 rounded-lg bg-rose-100/60 dark:bg-rose-900/20 text-rose-800 dark:text-rose-200 p-2 text-xs overflow-auto">
        {React.isValidElement(text) ? text : <pre className="whitespace-pre-wrap">{text}</pre>}
      </div>
    );
  };

  return (
    <div
      role="alert"
      className={[
        "rounded-2xl border border-rose-200 dark:border-rose-800",
        "bg-rose-50 dark:bg-rose-900/30",
        "p-4 text-sm text-rose-800 dark:text-rose-200",
        className,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <span className="shrink-0" aria-hidden>
            {icon ?? (
              <svg className="w-4 h-4 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11 7h2v6h-2V7zm0 8h2v2h-2v-2z" />
                <path d="M1 21h22L12 2 1 21z" />
              </svg>
            )}
          </span>
          <div className="min-w-0">
            <div className="font-medium">{message}</div>
            {hasDetails && (
              <button
                type="button"
                className="mt-1 text-xs underline underline-offset-2 hover:opacity-80"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open ? "true" : "false"}
              >
                {open ? "Hide details" : "Show details"}
              </button>
            )}
            {renderDetails()}
          </div>
        </div>

        {typeof onRetry === "function" && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onRetry}
            className="shrink-0"
            title={retryLabel}
          >
            {retryLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
