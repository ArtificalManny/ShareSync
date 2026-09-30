import React, { useEffect, useRef, useState } from "react";

/**
 * network-status-banner-v1
 *
 * Browser connectivity state only.
 *
 * Deliberately separate from Socket.IO state:
 * - browser offline = device/network connectivity
 * - socket disconnected = realtime transport state
 *
 * A socket can disconnect while the browser is still online.
 */
export default function NetworkStatusBanner() {
  const initialOnline =
    typeof navigator === "undefined"
      ? true
      : navigator.onLine !== false;

  const [isOnline, setIsOnline] = useState(initialOnline);
  const [showRecovered, setShowRecovered] = useState(false);

  const wasOfflineRef = useRef(!initialOnline);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const clearHideTimer = () => {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };

    const handleOffline = () => {
      clearHideTimer();

      wasOfflineRef.current = true;
      setIsOnline(false);
      setShowRecovered(false);
    };

    const handleOnline = () => {
      setIsOnline(true);

      if (!wasOfflineRef.current) {
        return;
      }

      wasOfflineRef.current = false;
      setShowRecovered(true);

      clearHideTimer();

      hideTimerRef.current = window.setTimeout(() => {
        setShowRecovered(false);
        hideTimerRef.current = null;
      }, 2600);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      clearHideTimer();

      window.removeEventListener(
        "offline",
        handleOffline
      );

      window.removeEventListener(
        "online",
        handleOnline
      );
    };
  }, []);

  if (isOnline && !showRecovered) {
    return null;
  }

  const recovered =
    isOnline && showRecovered;

  return (
    <div
      className="pointer-events-none fixed left-1/2 z-[10050] w-[min(calc(100vw-24px),420px)] -translate-x-1/2"
      style={{
        top: "calc(env(safe-area-inset-top, 0px) + 12px)",
      }}
      data-network-status={
        recovered ? "online" : "offline"
      }
    >
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={[
          "flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-xl",
          recovered
            ? "border-emerald-200/80 bg-white/95 text-emerald-800 dark:border-emerald-500/25 dark:bg-slate-950/95 dark:text-emerald-300"
            : "border-amber-200/80 bg-white/95 text-amber-900 dark:border-amber-500/25 dark:bg-slate-950/95 dark:text-amber-300",
        ].join(" ")}
      >
        <span
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            recovered
              ? "bg-emerald-50 dark:bg-emerald-500/10"
              : "bg-amber-50 dark:bg-amber-500/10",
          ].join(" ")}
          aria-hidden="true"
        >
          {recovered ? (
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="m5 12 4 4L19 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
            >
              <path
                d="M3 3l18 18"
                strokeLinecap="round"
              />
              <path
                d="M8.5 8.1A10.6 10.6 0 0 1 12 7.5c3 0 5.7 1.2 7.6 3.1M5.2 10.6A10.7 10.7 0 0 1 7 9.2M8.5 14a5.2 5.2 0 0 1 3.5-1.4c1.1 0 2.2.4 3 .9M10.7 17.3a1.9 1.9 0 0 1 2.6 0"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>

        <div className="min-w-0">
          <div className="text-sm font-bold">
            {recovered
              ? "Back online"
              : "You're offline"}
          </div>

          <div className="mt-0.5 text-xs leading-5 opacity-80">
            {recovered
              ? "Connection restored."
              : "Some updates may be unavailable until you reconnect."}
          </div>
        </div>
      </div>
    </div>
  );
}
