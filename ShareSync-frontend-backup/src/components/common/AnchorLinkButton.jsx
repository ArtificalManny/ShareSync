// /src/components/common/AnchorLinkButton.jsx
import React, { useState } from "react";
import { Link as LinkIcon, Check } from "lucide-react";
import { copyAnchorUrl } from "../../utils/anchor";

/**
 * AnchorLinkButton
 * - Copies a deep link to #id (relative to current page unless baseUrl provided)
 * - Minimal UI: subtle until hover-focus; accessible label; inline success feedback
 *
 * Props:
 *  - anchorId: string (required)  → element id to link to
 *  - baseUrl?: string             → override base; e.g., public status page URL
 *  - className?: string           → extra classes for the wrapper
 *  - size?: "sm" | "md"           → icon/button sizing (default "sm")
 *  - label?: string               → aria-label override
 *  - onCopied?: (url) => void
 */
export default function AnchorLinkButton({
  anchorId,
  baseUrl,
  className = "",
  size = "sm",
  label = "Copy link to this",
  onCopied,
}) {
  const [copied, setCopied] = useState(false);

  const handleClick = async (e) => {
    e.preventDefault();
    try {
      const url = await copyAnchorUrl(anchorId, { baseUrl });
      setCopied(true);
      onCopied?.(url);
      // Reset feedback after a beat
      window.clearTimeout((handleClick)._t);
      (handleClick)._t = window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // Let it fail silently; you can wire a toast here if you have one.
    }
  };

  const dims = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  const pad  = size === "md" ? "p-1.5" : "p-1";

  return (
    <span className={`inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        className={`${pad} rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
        aria-label={label}
        title={copied ? "Copied!" : "Copy link"}
      >
        {copied ? (
          <Check className={`${dims} text-emerald-600`} aria-hidden="true" />
        ) : (
          <LinkIcon className={dims} aria-hidden="true" />
        )}
      </button>
      {/* Screen-reader only live region for feedback */}
      <span className="sr-only" aria-live="polite">
        {copied ? "Link copied to clipboard" : ""}
      </span>
    </span>
  );
}
