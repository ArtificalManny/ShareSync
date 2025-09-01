// /src/components/project/InviteModal.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { X, MailPlus, Copy, Check, Loader2 } from "lucide-react";
// If you later add an API helper, we'll try it first:
let inviteApi = null;
try {
  // Optional helper: export inviteProjectMembers(projectId, { emails }) from ../../api/projects
  // eslint-disable-next-line import/no-unresolved
  // @ts-ignore
  inviteApi = (await import("../../api/projects")).inviteProjectMembers;
} catch {
  /* helper not present — we’ll use a fetch fallback */
}

/**
 * InviteModal
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - projectId: string (required for default API call)
 * - onInvite?: (emails: string[]) => Promise<{ link?: string }|void>
 * - afterInvite?: (result) => void
 *
 * Server contract (suggested):
 * POST /api/projects/:id/invites  body: { emails: string[] }
 * -> { inviteLink: string, created: number }
 */
export default function InviteModal({
  open,
  onClose,
  projectId,
  onInvite,
  afterInvite,
}) {
  const [input, setInput] = useState("");
  const [emails, setEmails] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const closeBtnRef = useRef(null);

  const emailRegex =
    // RFC 5322-lite; good enough for client
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

  const normalized = useMemo(
    () =>
      input
        .split(/[,\s]+/g)
        .map((t) => t.trim())
        .filter(Boolean),
    [input]
  );

  const addNormalizedIfValid = useCallback(() => {
    if (!normalized.length) return;
    const toAdd = [];
    for (const e of normalized) {
      if (!emailRegex.test(e)) {
        setError(`Invalid email: ${e}`);
        return;
      }
      toAdd.push(e.toLowerCase());
    }
    // de-dupe across existing
    const existing = new Set(emails);
    const merged = [...emails];
    for (const e of toAdd) {
      if (!existing.has(e)) {
        merged.push(e);
        existing.add(e);
      }
    }
    setEmails(merged);
    setInput("");
    setError("");
  }, [normalized, emails]);

  const removeEmail = (e) => {
    setEmails((arr) => arr.filter((x) => x !== e));
  };

  // Reset on open
  useEffect(() => {
    if (!open) return;
    setInput("");
    setEmails([]);
    setError("");
    setInviteLink("");
    setCopied(false);
    setTimeout(() => inputRef.current?.focus(), 10);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Focus trap
  useEffect(() => {
    if (!open) return;
    const el = containerRef.current;
    if (!el) return;
    const selectors =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (e) => {
      if (e.key !== "Tab") return;
      const focusables = Array.from(el.querySelectorAll(selectors)).filter(
        (n) => !n.hasAttribute("disabled")
      );
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addNormalizedIfValid();
    }
    if (e.key === "Backspace" && !input && emails.length) {
      // backspace to pop last
      setEmails((arr) => arr.slice(0, -1));
    }
  };

  const doInvite = useCallback(async () => {
    if (submitting) return;
    if (input.trim()) {
      // include any pending text split into emails
      const next = input
        .split(/[,\s]+/g)
        .map((t) => t.trim())
        .filter(Boolean);
      setInput("");
      for (const e of next) {
        if (!emailRegex.test(e)) {
          setError(`Invalid email: ${e}`);
          return;
        }
      }
      const s = new Set(emails.map((e) => e.toLowerCase()));
      next.forEach((e) => s.add(e.toLowerCase()));
      const arr = Array.from(s);
      if (!arr.length) {
        setError("Please enter at least one email.");
        inputRef.current?.focus();
        return;
      }
      setEmails(arr);
    } else if (!emails.length) {
      setError("Please enter at least one email.");
      inputRef.current?.focus();
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const emailList = emails;

      let result = null;
      if (typeof onInvite === "function") {
        result = (await onInvite(emailList)) ?? null;
      } else if (inviteApi && projectId) {
        result = (await inviteApi(projectId, { emails: emailList })) ?? null;
      } else if (projectId) {
        // Fallback POST (stub)
        const res = await fetch(`/api/projects/${projectId}/invites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emails: emailList }),
        });
        if (!res.ok) {
          const msg = await safeErrorMessage(res);
          throw new Error(msg || "Failed to send invites.");
        }
        result = await res.json();
      } else {
        throw new Error("Missing projectId for invite.");
      }

      // Expect { inviteLink?: string }
      const link = result?.inviteLink || result?.link || "";
      setInviteLink(link);
      afterInvite?.(result || { inviteLink: link, emails: emailList });
    } catch (e) {
      setError(e?.message || "Failed to send invites.");
    } finally {
      setSubmitting(false);
    }
  }, [submitting, input, emails, onInvite, projectId, afterInvite]);

  const copy = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Modal */}
      <div
        ref={containerRef}
        className="fixed z-50 inset-x-4 top-24 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 w-[min(640px,calc(100%-2rem))] rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Invite to project"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <MailPlus className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Invite teammates
            </h3>
          </div>
          <button
            ref={closeBtnRef}
            className="text-sm rounded-lg px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onClose}
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {error ? (
            <div className="rounded-lg border border-rose-200/70 bg-rose-50 text-rose-800 text-sm px-3 py-2">
              {error}
            </div>
          ) : null}

          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
              Email addresses
            </label>
            <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 p-2">
              {/* chips */}
              {emails.length ? (
                <div className="flex flex-wrap gap-2 mb-2">
                  {emails.map((e) => (
                    <span
                      key={e}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/60"
                    >
                      {e}
                      <button
                        className="ml-1 rounded hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40"
                        onClick={() => removeEmail(e)}
                        aria-label={`Remove ${e}`}
                        title="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="name@example.com, teammate@company.com"
                className="w-full text-sm rounded-md border border-transparent focus:border-indigo-300 px-2 py-2 bg-transparent outline-none"
                aria-label="Invite by email"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Press <kbd className="px-1 border rounded">Enter</kbd> or <kbd className="px-1 border rounded">,</kbd> to add each email.
              </p>
            </div>
          </div>

          {inviteLink ? (
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                Invite link
              </label>
              <div className="flex items-stretch gap-2">
                <input
                  readOnly
                  value={inviteLink}
                  className="flex-1 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 px-3 py-2"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  onClick={copy}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Share this link with teammates if you don’t want to email them right now.
              </p>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            className="rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onClose}
          >
            Close
          </button>
          <button
            onClick={doInvite}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <MailPlus className="w-4 h-4" />
                Send invites
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

async function safeErrorMessage(res) {
  try {
    const json = await res.json();
    return json?.error || json?.message || "";
  } catch {
    return "";
  }
}
