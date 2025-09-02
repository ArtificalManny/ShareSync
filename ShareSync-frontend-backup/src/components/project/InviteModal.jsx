// /src/components/project/InviteModal.jsx
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import client from "../../api/client";

export default function InviteModal({
  open,
  onClose,
  projectId,
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member"); // 'member' | 'viewer'
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    if (!open) {
      setEmail("");
      setRole("member");
      setSubmitting(false);
      setErr("");
      setOk("");
    }
  }, [open]);

  if (!open) return null;

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setOk("");
    const cleaned = String(email || "").trim().toLowerCase();
    if (!cleaned || !projectId) {
      setErr("Please enter an email.");
      return;
    }
    setSubmitting(true);
    try {
      await client.post(`/projects/${projectId}/invites`, { email: cleaned, role });
      setOk("Invite sent.");
      // Don’t close immediately; give visual confirmation
      setTimeout(() => onClose?.(), 800);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to send invite.";
      setErr(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30 dark:bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed z-50 inset-x-4 top-20 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 w-[min(520px,calc(100%-2rem))] rounded-2xl border border-border bg-surface shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Invite teammate"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-text">Invite teammate</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-surface"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-muted" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1">Email</label>
            <input
              type="email"
              inputMode="email"
              placeholder="teammate@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="member">Member – can edit</option>
              <option value="viewer">Viewer – read-only</option>
            </select>
          </div>

          {err && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm px-3 py-2">
              {err}
            </div>
          )}
          {ok && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm px-3 py-2">
              {ok}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-3 py-2 text-sm"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "Sending…" : "Send invite"}
            </button>
          </div>
        </form>

        <div className="px-4 pb-4 text-[11px] text-muted">
          Invites expire in 30 days. Members can edit; viewers are read-only.
        </div>
      </div>
    </>
  );
}