import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  X,
  Settings,
  Loader2,
  Globe,
  Shield,
  Copy,
  Check,
  Link as LinkIcon,
  ImagePlus,
  RefreshCcw,
} from "lucide-react";
import ProjectIconPicker from "./ProjectIconPicker";
import Switch from "../ui/Switch";
import ConfirmDialog from "../ui/ConfirmDialog";
import { copyToClipboard } from "../../utils/clipboard";
import TraceOutline from "../ui/TraceOutline";
import { buildPublicStatusUrl } from "../../api/public";
import { track, trackProjectDiscoverToggle } from "../../utils/telemetry";
import { DISCOVERABILITY } from "../../config/flags";
import { toast } from "../ui/Toaster";

// --- Feature flag ---
const ENABLE_PUBLIC_STATUS = (() => {
  const v = import.meta?.env?.VITE_FEATURE_PUBLIC_STATUS ?? "";
  return /^(1|true|on|yes)$/i.test(String(v));
})();

let patchProjectApi = null;
let enablePublicApi = null;
let disablePublicApi = null;
let regeneratePublicApi = null;
let patchProjectIconApi = null;
try {
  // Optional dynamic imports — use if available
  // eslint-disable-next-line import/no-unresolved
  // @ts-ignore
  const mod = await import("../../api/projects");
  patchProjectApi = mod?.patchProject || null;
  patchProjectIconApi = mod?.patchProjectIcon || null;
} catch {}
try {
  // eslint-disable-next-line import/no-unresolved
  // @ts-ignore
  const pub = await import("../../api/public");
  enablePublicApi = pub?.enablePublic || null;
  disablePublicApi = pub?.disablePublic || null;
  regeneratePublicApi = pub?.regeneratePublicToken || null;
} catch {}

export default function ProjectSettingsModal({
  open,
  onClose,
  project, // { _id, name/title, description?, visibility?, publicToken?, icon? }
  onSaved, // (updatedProject) => void
}) {
  const [name, setName] = useState(project?.name || project?.title || "");
  const [description, setDescription] = useState(project?.description || "");
  const [visibility, setVisibility] = useState(project?.visibility || "private");
  const [publicEnabled, setPublicEnabled] = useState(
    !!project?.publicToken || project?.visibility === "public"
  );
  const [publicToken, setPublicToken] = useState(project?.publicToken || "");
  const [icon, setIcon] = useState(project?.icon || null);
  const [discoverable, setDiscoverable] = useState(Boolean(project?.discoverable));

  const [submitting, setSubmitting] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const [error, setError] = useState("");

  // Confirmation modals
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [confirmRegenOpen, setConfirmRegenOpen] = useState(false);

  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  const containerRef = useRef(null);
  const firstFieldRef = useRef(null);
  const prevFocusRef = useRef(null);

  // Reset values on open / project change, initial focus, and focus restoration
  useEffect(() => {
    if (!open) {
      // restore focus to the invoker
      setTimeout(() => prevFocusRef.current?.focus?.(), 0);
      return;
    }
    prevFocusRef.current = document.activeElement;
    setName(project?.name || project?.title || "");
    setDescription(project?.description || "");
    setVisibility(project?.visibility || "private");
    setPublicEnabled(!!project?.publicToken || project?.visibility === "public");
    setPublicToken(project?.publicToken || "");
    setIcon(project?.icon || null);
    setDiscoverable(Boolean(project?.discoverable));
    setError("");
    setSubmitting(false);
    setLinkCopied(false);
    setConfirmDisableOpen(false);
    setConfirmRegenOpen(false);
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

  // Basic focus trap
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
    const path = buildPublicStatusUrl(publicToken);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return origin ? `${origin}${path}` : path;
  }, [publicToken]);

  const copyLink = async () => {
    if (!publicUrl) return;
    const ok = await copyToClipboard(publicUrl);
    setLinkCopied(!!ok);
    setTimeout(() => setLinkCopied(false), 1500);
  };

  const ensurePublicToken = useCallback(async () => {
    if (publicToken) return publicToken;
    try {
      if (enablePublicApi && project?._id) {
        const res = await enablePublicApi(project._id);
        const t = res?.token || res?.publicToken || "";
        if (t) {
          setPublicToken(t);
          try {
            track("public_status_changed", { projectId: project._id, action: "enabled", source: "settings" });
          } catch {}
          toast({ title: "Public status enabled", description: "Share the link from here anytime.", variant: "success" });
          return t;
        }
      } else if (project?._id) {
        const res = await fetch(`/api/public/projects/${project._id}/enable`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Failed to enable public status.");
        const json = await res.json();
        const t = json?.token || json?.publicToken || "";
        if (t) {
          setPublicToken(t);
          try {
            track("public_status_changed", { projectId: project._id, action: "enabled", source: "settings" });
          } catch {}
          toast({ title: "Public status enabled", description: "Share the link from here anytime.", variant: "success" });
          return t;
        }
      }
    } catch (e) {
      setError(e?.message || "Failed to enable public status.");
      throw e;
    }
    // Dev fallback
    const devToken = `dev_${project?._id || "project"}_${Date.now().toString(36)}`;
    setPublicToken(devToken);
    toast({ title: "Public status enabled (dev)", variant: "success" });
    return devToken;
  }, [enablePublicApi, project, publicToken]);

  const save = useCallback(async () => {
    const newName = name.trim();
    if (!newName) {
      setError("Project name is required.");
      return;
    }
    setSubmitting(true);
    setError("");

    const body = {
      name: newName,
      description: description || "",
      visibility: visibility === "public" ? "public" : "private",
      ...(DISCOVERABILITY ? { discoverable: Boolean(discoverable) } : {}),
    };

    try {
      if (ENABLE_PUBLIC_STATUS) {
        if (publicEnabled && !publicToken) {
          await ensurePublicToken();
        }
        // If toggled OFF explicitly, also disable public server-side (best-effort)
        if (!publicEnabled && publicToken && project?._id) {
          try {
            if (disablePublicApi) await disablePublicApi(project._id);
            else await fetch(`/api/public/projects/${project._id}/disable`, { method: "POST" });
            try {
              track("public_status_changed", { projectId: project._id, action: "disabled", source: "settings" });
            } catch {}
            toast({ title: "Public status disabled", variant: "warning" });
          } catch {
            /* non-fatal */
          }
          setPublicToken("");
        }
      }

      let updated = null;
      if (patchProjectApi && project?._id) {
        updated = await patchProjectApi(project._id, body);
      } else if (project?._id) {
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
        updated = { ...(project || {}), ...body };
      }

      // reflect public token & icon locally for optimistic UI
      if (ENABLE_PUBLIC_STATUS) {
        if (publicEnabled && publicToken) updated = { ...updated, publicToken };
        if (!publicEnabled) updated = { ...updated, publicToken: "" };
      }
      if (icon !== undefined) updated = { ...updated, icon };

      onSaved?.(updated);
      toast({ title: "Project settings saved", variant: "success" });
      onClose?.();
    } catch (e) {
      setError(e?.message || "Failed to save project.");
      toast({ title: "Save failed", description: String(e?.message || e), variant: "error" });
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
    icon,
  ]);

  // Immediate icon change
  const handleIconChange = async (sel /* {kind,value} or null */) => {
    try {
      if (patchProjectIconApi && project?._id) {
        const updated = await patchProjectIconApi(project._id, sel ?? null);
        setIcon(updated?.icon ?? sel ?? null);
        onSaved?.(updated);
      } else if (project?._id) {
        const res = await fetch(`/api/projects/${project._id}/icon`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sel ?? null),
        });
        if (!res.ok) {
          const msg = await safeErrorMessage(res);
          throw new Error(msg || "Failed to update icon.");
        }
        const updated = await res.json();
        setIcon(updated?.icon ?? sel ?? null);
        onSaved?.(updated);
      } else {
        setIcon(sel ?? null);
      }
      toast({
        title: sel ? "Project icon updated" : "Project icon removed",
        variant: sel ? "success" : "info",
      });
    } catch (e) {
      // eslint-disable-next-line no-alert
      toast.error('Failed to update icon', { description: e?.message || 'Please try again', duration: 3000 });
      toast({ title: "Icon update failed", description: String(e?.message || e), variant: "error" });
    } finally {
      setIconPickerOpen(false);
    }
  };

  // Disable public (confirmed)
  const confirmDisable = async () => {
    setConfirmDisableOpen(false);
    if (!project?._id) return;
    try {
      if (disablePublicApi) await disablePublicApi(project._id);
      else await fetch(`/api/public/projects/${project._id}/disable`, { method: "POST" });
      setPublicEnabled(false);
      setPublicToken("");
      onSaved?.({ ...(project || {}), visibility: "private", publicToken: "" });
      try {
        track("public_status_changed", { projectId: project._id, action: "disabled", source: "settings" });
      } catch {}
      toast({ title: "Public status disabled", variant: "warning" });
    } catch (e) {
      // eslint-disable-next-line no-alert
      toast.error('Failed to disable public status', { description: e?.message || 'Please try again', duration: 3000 });
      toast({ title: "Disable failed", description: String(e?.message || e), variant: "error" });
    }
  };

  // Regenerate link (confirmed)
  const confirmRegenOpenRef = useRef(false);
  const regenerate = async () => {
    if (!project?._id) return;
    setRegenLoading(true);
    try {
      let token = null;
      if (regeneratePublicApi) {
        const res = await regeneratePublicApi(project._id);
        token = res?.token || res?.publicToken || null;
      } else {
        const res = await fetch(`/api/public/projects/${project._id}/regenerate`, {
          method: "POST",
        });
        const json = await res.json();
        token = json?.token || json?.publicToken || null;
      }
      if (token) {
        setPublicToken(token);
        onSaved?.({ ...(project || {}), publicToken: token });
        try {
          track("public_status_changed", { projectId: project._id, action: "regenerated", source: "settings" });
        } catch {}
        toast({ title: "Public link regenerated", description: "Old link is now invalid.", variant: "success" });
      }
    } catch (e) {
      // eslint-disable-next-line no-alert
      toast.error('Failed to regenerate link', { description: e?.message || 'Please try again', duration: 3000 });
      toast({ title: "Regenerate failed", description: String(e?.message || e), variant: "error" });
    } finally {
      setRegenLoading(false);
      setConfirmRegenOpen(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <TraceOutline radius={18} speedMs={3200}>
        <div
          ref={containerRef}
          className="fixed z-50 inset-x-4 top-20 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 w-[min(720px,calc(Available-2rem))] rounded-2xl border border-border bg-surface shadow-[var(--shadow)] accent-bar shine"
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-settings-title"
          aria-describedby="project-settings-desc"
        >
          <span className="accent-bar__left" aria-hidden="true" />

          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="inline-flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" />
              <h3 id="project-settings-title" className="text-sm font-semibold text-text">
                Project Settings
              </h3>
            </div>
            <button
              className="btn btn--ghost press-shrink"
              onClick={onClose}
              aria-label="Close settings"
            >
              <X className="w-5 h-5 text-muted" />
            </button>
          </div>

          <p id="project-settings-desc" className="sr-only">
            Change project name, description, visibility, and public status link. Press Escape to close.
          </p>

          {/* Body */}
          <div className="p-4 space-y-5">
            {error ? (
              <div className="rounded-lg border border-rose-200/70 bg-rose-50 text-rose-800 text-sm px-3 py-2">
                {error}
              </div>
            ) : null}

            {/* Name */}
            <div>
              <label htmlFor="ps-name" className="block text-xs text-muted mb-1">
                Project name <span className="text-rose-600">*</span>
              </label>
              <input
                id="ps-name"
                ref={firstFieldRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Infra Revamp Q4"
                className="w-full text-sm rounded-lg border border-border bg-surface px-3 py-2"
                required
                aria-required="true"
                aria-invalid={(!name || !name.trim()) ? "true" : "false"}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-muted mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="One or two sentences about goals, scope, or milestones."
                className="w-full text-sm rounded-lg border border-border bg-surface px-3 py-2"
              />
            </div>

            {/* 🔷 Project Icon */}
            <div className="rounded-xl border border-border p-3">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <ImagePlus className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-semibold text-text">Project Icon</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIconPickerOpen(true)}
                  className="btn btn--outline press-shrink"
                >
                  {icon ? "Change" : "Add"} icon
                </button>
              </div>
              <div className="mt-2 text-sm">
                {icon ? (
                  <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-surface border border-border">
                    {icon.kind === "emoji" ? (
                      <span className="text-xl" role="img" aria-label="icon">
                        {icon.value}
                      </span>
                    ) : (
                      <span className="text-indigo-600">
                        {icon.value === "rocket" && (
                          <svg viewBox="0 0 24 24" className="w-5 h-5">
                            <path
                              d="M12 2c3 0 6 2 8 4l-6 6-2-2-6 6-2-2 6-6-2-2 6-6z"
                              fill="currentColor"
                            />
                          </svg>
                        )}
                        {icon.value === "bolt" && (
                          <svg viewBox="0 0 24 24" className="w-5 h-5">
                            <path d="M13 2L3 14h7l-1 8 11-12h-7l0-8z" fill="currentColor" />
                          </svg>
                        )}
                        {icon.value === "target" && (
                          <svg viewBox="0 0 24 24" className="w-5 h-5">
                            <circle
                              cx="12"
                              cy="12"
                              r="9"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                            />
                            <circle
                              cx="12"
                              cy="12"
                              r="5"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                            />
                            <circle cx="12" cy="12" r="2" fill="currentColor" />
                          </svg>
                        )}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleIconChange(null)}
                      className="btn btn--outline press-shrink"
                      title="Remove icon"
                    >
                      Remove
                    </button>
                  </span>
                ) : (
                  <span className="text-muted">No icon set.</span>
                )}
              </div>
            </div>

            {/* Visibility choice */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility("private")}
                className={`rounded-xl border px-3 py-3 text-left hover-raise ${
                  visibility === "private" ? "win-glow border-slate-800" : "border-border"
                }`}
                aria-pressed={visibility === "private"}
              >
                <div className="inline-flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-semibold">Private</span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  Only project members can view and contribute.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setVisibility("public")}
                className={`rounded-xl border px-3 py-3 text-left hover-raise ${
                  visibility === "public" ? "win-glow border-slate-800" : "border-border"
                }`}
                aria-pressed={visibility === "public"}
              >
                <div className="inline-flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-semibold">Public</span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  Read-only status snapshots can be shared externally.
                </p>
              </button>
            </div>

            {/* ✅ Discoverability (flag-gated) */}
{DISCOVERABILITY && (
  <div className="rounded-xl border border-border p-3">
    <div className="flex items-center justify-between">
      <div>
        <label className="inline-flex items-center gap-2 text-sm font-semibold">
          Allow this project to be discoverable
        </label>
        <p className="text-xs text-muted">
          Lets teammates find this project when searching the workspace.
        </p>
      </div>
      <Switch
        checked={discoverable}
        onChange={(next) => {
          setDiscoverable(next);
          try {
            trackProjectDiscoverToggle({
              projectId: project?._id,
              on: Boolean(next),
              source: 'settings_toggle',
            });
          } catch {}
        }}
        ariaLabel="Allow this project to be discoverable"
      />
    </div>
  </div>
)}

            {/* Public status controls (flag gated) */}
            {ENABLE_PUBLIC_STATUS && (
              <div className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label className="inline-flex items-center gap-2 text-sm font-semibold">
                      <LinkIcon className="w-4 h-4 text-indigo-600" />
                      Public status page
                    </label>
                    <p className="text-xs text-muted">
                      Generate a tokenized, read-only status page for stakeholders.
                    </p>
                  </div>

                  <Switch
                    checked={publicEnabled}
                    onChange={async (next) => {
                      if (!next && publicToken) {
                        setConfirmDisableOpen(true);
                      } else {
                        setPublicEnabled(next);
                        if (next && !publicToken) {
                          try {
                            await ensurePublicToken();
                          } catch {
                            setPublicEnabled(false);
                          }
                        }
                      }
                    }}
                    ariaLabel="Enable public status"
                  />
                </div>

                {publicEnabled ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-stretch gap-2">
                      <input
                        readOnly
                        value={publicUrl || "Will be created on Save…"}
                        className="flex-1 text-sm rounded-lg border border-border bg-surface px-3 py-2"
                        onFocus={(e) => e.currentTarget.select()}
                        aria-label="Public status URL"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={copyLink}
                        disabled={!publicUrl}
                        className="btn btn--primary press-shrink disabled:opacity-50"
                        title={publicUrl ? "Copy link" : "No link yet"}
                      >
                        {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {linkCopied ? "Copied" : "Copy"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmRegenOpen(true)}
                        disabled={!publicToken || regenLoading}
                        className="btn btn--outline press-shrink disabled:opacity-50"
                        title="Regenerate link (invalidates the old one)"
                      >
                        {regenLoading ? (
                          <RefreshCcw className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCcw className="w-4 h-4" />
                        )}
                        Regenerate
                      </button>
                    </div>

                    <p className="text-[11px] text-muted">
                      The link is tokenized; anyone with the URL can view the status page.
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border flex items-center justify-end gap-2">
            <button className="btn btn--ghost press-shrink" onClick={onClose}>
              Cancel
            </button>
            <button
              onClick={save}
              disabled={submitting}
              className="btn btn--primary press-shrink marching disabled:opacity-60"
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
      </TraceOutline>

      {/* Icon Picker modal */}
      <ProjectIconPicker
        open={iconPickerOpen}
        onClose={() => setIconPickerOpen(false)}
        onSelect={handleIconChange}
      />

      {/* Confirm: Disable public */}
      <ConfirmDialog
        open={confirmDisableOpen}
        title="Disable public status?"
        description="This will revoke access to the public status page immediately."
        confirmLabel="Disable"
        confirmTone="danger"
        onCancel={() => setConfirmDisableOpen(false)}
        onConfirm={confirmDisable}
      />

      {/* Confirm: Regenerate link */}
      <ConfirmDialog
        open={confirmRegenOpen}
        title="Regenerate public link?"
        description="The current public link will stop working. A new tokenized URL will be created."
        confirmLabel="Regenerate"
        confirmTone="warning"
        onCancel={() => setConfirmRegenOpen(false)}
        onConfirm={regenerate}
      />
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
