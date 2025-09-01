// /src/components/project/ProjectSettingsModal.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { X, Settings, Loader2, Globe, Shield, Copy, Check, Link as LinkIcon } from "lucide-react";

let patchProjectApi = null;
let enablePublicApi = null;
try {
  // Optional imports — if your helpers exist we’ll use them
  // export patchProject(id, body)
  // export enablePublicStatus(projectId) -> { token }
  // eslint-disable-next-line import/no-unresolved
  // @ts-ignore
  const mod = await import("../../api/projects");
  patchProjectApi = mod?.patchProject || null;
  enablePublicApi = mod?.enablePublicStatus || null;
} catch {
  /* use fetch fallbacks */
}

// Utility: builds /status/:token (same as buildPublicStatusUrl, but inline-safe)
const statusPath = (token) => (token ? `/status/${encodeURIComponent(token)}` : "");

export default function ProjectSettingsModal({
  open,
  onClose,
  project,             // { _id, name, description?, visibility?: 'private'|'public', publicToken? }
  onSaved,             // (updatedProject) => void (optimistic UI in parent)
}) {
  const [name, setName] = useState(project?.name || "");
  const [description, setDescription] = useState(project?.description || "");
  const [visibility, setVisibility] = useState(project?.visibility || "private");
  const [publicEnabled, setPublicEnabled] = useState(!!project?.publicToken || project?.visibility === "public");
  const [publicToken, setPublicToken] = useState(project?.publicToken || "");
  const [submitting, setSubmitting] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [error, setError] = useState("");

  const containerRef = useRef(null);
  const firstFieldRef = useRef(null);

  // Reset values each time it opens or project changes
  useEffect(() => {
    if (!open) return;
    setName(project?.name || "");
    setDescription(project?.description || "");
    setVisibility(project?.visibility || "private");
    setPublicEnabled(!!project?.publicToken || project?.visibility === "public");
    setPublicToken(project?.publicToken || "");
    setError("");
    setSubmitting(false);
    setLinkCopied(false);
    setTimeout(() => firstFieldRef.current?.focus(), 20);
  }, [open, project]);

  // Close on ESC
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
      const nodes = Array.from(el.querySelectorAll(selectors)).filter(
        (n) => !n.hasAttribute("disabled")
      );
      if (!nodes.length) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
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

  const publicUrl = useMemo(() => {
    if (!publicToken) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return origin ? `${origin}${statusPath(publicToken)}` : statusPath(publicToken);
  }, [publicToken]);

  const copyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    } catch {
      setLinkCopied(false);
    }
  };

  const ensurePublicToken = useCallback(async () => {
    // If already have token, nothing to do
    if (publicToken) return publicToken;

    // Try helper, otherwise fallback
    try {
      if (enablePublicApi && project?._id) {
        const res = await enablePublicApi(project._id);
        if (res?.token) {
          setPublicToken(res.token);
          return res.token;
        }
      } else if (project?._id) {
        // Fallback route: POST -> /api/public/projects/:id/enable
        const res = await fetch(`/api/public/projects/${project._id}/enable`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Failed to enable public status.");
        const json = await res.json();
        if (json?.token) {
          setPublicToken(json.token);
          return json.token;
        }
      }
    } catch (e) {
      setError(e?.message || "Failed to enable public status.");
      throw e;
    }
    // If backend isn’t ready, generate a temporary client-side token (dev only)
    const devToken = `dev_${project?._id || "project"}_${Date.now().toString(36)}`;
    setPublicToken(devToken);
    return devToken;
  }, [enablePublicApi, project, publicToken]);

  const save = useCallback(async () => {
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }
    setSubmitting(true);
    setError("");

    // Prepare payload
    const body = {
      name: name.trim(),
      description: description || "",
      visibility: visibility === "public" ? "public" : "private",
    };

    try {
      // If public is enabled and no token exists, ensure one (best-effort)
      if (publicEnabled && !publicToken) {
        await ensurePublicToken();
      }
      // Try helper first
      let updated = null;
      if (patchProjectApi && project?._id) {
        updated = await patchProjectApi(project._id, body);
      } else if (project?._id) {
        // Fallback PATCH
        const res = await fetch(`/api/projects/${project._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const msg = await safeErrorMessage(res);
          throw new Error(msg || "Failed to save project.");
        }
        updated = await res.json();
      } else {
        // No id? Just synthesize object for optimistic UI
        updated = { ...(project || {}), ...body };
      }

      // Also reflect public token locally if enabled
      if (publicEnabled && publicToken) {
        updated = { ...(updated || {}), publicToken };
      }
      if (!publicEnabled) {
        // If toggled off, hide token in FE (leave server to actually disable later)
        updated = { ...(updated || {}), publicToken: "" };
      }

      onSaved?.(updated);
      onClose?.();
    } catch (e) {
      setError(e?.message || "Failed to save project.");
    } finally {
      setSubmitting(false);
    }
  }, [
    name,
    description,
    visibility,
    project,
    onSaved,
    onClose,
    ensurePublicToken,
    publicEnabled,
    publicToken,
  ]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={containerRef}
        className="fixed z-50 inset-x-4 top-20 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 w-[min(720px,calc(100%-2rem))] rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Project settings"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Project Settings
            </h3>
          </div>
          <button
            className="text-sm rounded-lg px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-5">
          {error ? (
            <div className="rounded-lg border border-rose-200/70 bg-rose-50 text-rose-800 text-sm px-3 py-2">
              {error}
            </div>
          ) : null}

          {/* Name */}
          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
              Project name <span className="text-rose-600">*</span>
            </label>
            <input
              ref={firstFieldRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Infra Revamp Q4"
              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 px-3 py-2"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="One or two sentences about goals, scope, or milestones."
              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 px-3 py-2"
            />
          </div>

          {/* Visibility */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setVisibility("private")}
              className={`rounded-xl border px-3 py-3 text-left hover:bg-white/70 dark:hover:bg-slate-800 ${
                visibility === "private"
                  ? "border-slate-800 ring-2 ring-indigo-500"
                  : "border-slate-300 dark:border-slate-700"
              }`}
              aria-pressed={visibility === "private"}
            >
              <div className="inline-flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-semibold">Private</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Only project members can view and contribute.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setVisibility("public")}
              className={`rounded-xl border px-3 py-3 text-left hover:bg-white/70 dark:hover:bg-slate-800 ${
                visibility === "public"
                  ? "border-slate-800 ring-2 ring-indigo-500"
                  : "border-slate-300 dark:border-slate-700"
              }`}
              aria-pressed={visibility === "public"}
            >
              <div className="inline-flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span className="text-sm font-semibold">Public</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Read-only status snapshots can be shared externally.
              </p>
            </button>
          </div>

          {/* Public status toggle */}
          <div className="rounded-xl border border-slate-300 dark:border-slate-700 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <label className="inline-flex items-center gap-2 text-sm font-semibold">
                  <LinkIcon className="w-4 h-4 text-indigo-600" />
                  Public status page
                </label>
                <p className="text-xs text-slate-500">
                  Generate a tokenized, read-only status page for stakeholders.
                </p>
              </div>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-indigo-600"
                  checked={publicEnabled}
                  onChange={(e) => setPublicEnabled(e.target.checked)}
                />
                <span className="text-xs text-slate-600">Enable</span>
              </label>
            </div>

            {publicEnabled ? (
              <div className="mt-3 space-y-2">
                <div className="flex items-stretch gap-2">
                  <input
                    readOnly
                    value={publicUrl || "Will be created on Save…"}
                    className="flex-1 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 px-3 py-2"
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <button
                    type="button"
                    onClick={copyLink}
                    disabled={!publicUrl}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                    title={publicUrl ? "Copy link" : "No link yet"}
                  >
                    {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {linkCopied ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  The link is tokenized; anyone with the URL can view the status page.
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            className="rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Settings className="w-4 h-4" />
                Save changes
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
