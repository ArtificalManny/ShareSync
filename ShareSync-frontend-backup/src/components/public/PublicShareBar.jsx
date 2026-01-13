import React from "react";
import { Link as LinkIcon, Share2 } from "lucide-react";
import { track } from "../../utils/telemetry";

/**
 * PublicShareBar
 * Small share row for public pages (copy link, share to X/LinkedIn).
 *
 * Props:
 * - url?: string                 // fallback: window.location.href
 * - title?: string               // used in share text
 * - compact?: boolean
 * - onCopied?: () => void
 */
export default function PublicShareBar({ url, title = "Check this out on OpenShare", compact = false, onCopied }) {
  const [copied, setCopied] = React.useState(false);
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      onCopied && onCopied();
      track("public_link_copied", { url: shareUrl });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  const open = (href, name) => {
    try { window.open(href, "_blank", "noopener,noreferrer"); } catch {}
    track("public_share_clicked", { network: name });
  };

  const encoded = encodeURIComponent(`${title} — ${shareUrl}`);

  return (
    <div className={`flex items-center ${compact ? "gap-2" : "gap-3"} flex-wrap`}>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs"
        style={{ borderColor: "rgba(255,255,255,.14)", background: "linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02))" }}
        title="Copy link"
      >
        <LinkIcon size={14} />
        {copied ? "Copied!" : "Copy link"}
      </button>

      <button
        type="button"
        onClick={() => open(`https://twitter.com/intent/tweet?text=${encoded}`, "x")}
        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs"
        style={{ borderColor: "rgba(124,58,237,.45)", background: "linear-gradient(90deg, rgba(124,58,237,.22), rgba(34,211,238,.22))" }}
        title="Share on X"
      >
        <Share2 size={14} />
        Share on X
      </button>

      <button
        type="button"
        onClick={() => open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "linkedin")}
        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs"
        style={{ borderColor: "rgba(59,130,246,.45)", background: "linear-gradient(90deg, rgba(59,130,246,.22), rgba(34,197,94,.18))" }}
        title="Share on LinkedIn"
      >
        <Share2 size={14} />
        Share on LinkedIn
      </button>
    </div>
  );
}
