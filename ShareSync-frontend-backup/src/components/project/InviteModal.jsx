import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { sendInvite, listInvites, revokeInvite } from "../../api/invite";
import { track } from "../../utils/telemetry";
import { toast } from "../ui/Toaster.jsx";

export default function InviteModal({ open, onClose, projectId }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member"); // 'member' | 'viewer'
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [pending, setPending] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const canSubmit = !!projectId && String(email || "").trim().length > 3;

  // A11y: focus management
  const containerRef = useRef(null);
  const firstFieldRef = useRef(null);
  const prevFocusRef = useRef(null);

  const loadInvites = async () => {
    if (!projectId) return;
    setLoadingList(true);
    setErr("");
    try {
      const rows = await listInvites(projectId);
      setPending(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.debug("[InviteModal] listInvites error", e);
    } finally {
      setLoadingList(false);
    }
  };

  // Reset + load on open; handle focus + ESC; focus trap; restore focus on close
  useEffect(() => {
    if (!open) {
      setEmail("");
      setRole("member");
      setSubmitting(false);
      setErr("");
      setOk("");
      setPending([]);
      // restore focus
      setTimeout(() => prevFocusRef.current?.focus?.(), 0);
      return;
    }

    prevFocusRef.current = document.activeElement;
    loadInvites();

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener("keydown", onKey);

    // Defer initial focus
    const tf = setTimeout(() => firstFieldRef.current?.focus(), 10);

    // Focus trap
    const el = containerRef.current;
    const selectors =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const onTrap = (e) => {
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
    el?.addEventListener("keydown", onTrap);

    return () => {
      clearTimeout(tf);
      window.removeEventListener("keydown", onKey);
      el?.removeEventListener("keydown", onTrap);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId]);

  if (!open) return null;

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setOk("");
    const cleaned = String(email || "").trim().toLowerCase();
    if (!projectId || !cleaned) {
      setErr("Please enter an email.");
      return;
    }
    setSubmitting(true);
    try {
      await sendInvite(projectId, { email: cleaned, role });
      setOk("Invite sent.");
      setEmail("");

      // 🔔 Toast + Telemetry
      toast({ title: "Invite sent", description: cleaned, variant: "success" });
      try { track("invite_sent", { projectId, email: cleaned, role }); } catch {}

      await loadInvites();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to send invite.";
      setErr(String(msg));
      toast({ title: "Invite failed", description: String(msg), variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const onRevoke = async (token) => {
    if (!projectId || !token) return;
    try {
      await revokeInvite(projectId, token);
      toast({ title: "Invite revoked", variant: "success" });
      await loadInvites();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to revoke invite.";
      setErr(String(msg));
      toast({ title: "Revoke failed", description: String(msg), variant: "error" });
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
        ref={containerRef}
        className="fixed z-50 inset-x-4 top-20 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 w-[min(560px,calc(100%-2rem))] rounded-2xl border border-border bg-surface shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-modal-title"
        aria-describedby="invite-modal-desc"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 id="invite-modal-title" className="text-sm font-semibold text-text">Invite teammates</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-surface"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-muted" />
          </button>
        </div>

        <p id="invite-modal-desc" className="sr-only">
          Invite teammates to this project by entering their email and selecting a role.
        </p>

        <form onSubmit={onSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs text-muted mb-1">Email</label>
              <input
                ref={firstFieldRef}
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
              Close
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-60"
              disabled={submitting || !canSubmit}
            >
              {submitting ? "Sending…" : "Send invite"}
            </button>
          </div>
        </form>

        <div className="px-4 pb-4">
          <h4 className="text-xs font-semibold text-muted mb-2">Pending invites</h4>
          <div className="rounded-xl border border-border divide-y divide-border" aria-live="polite">
            {loadingList ? (
              <div className="p-3 text-sm text-muted">Loading…</div>
            ) : pending?.length ? (
              pending.map((i) => (
                <div key={`${i.token || i._id || i.email}`} className="flex items-center justify-between px-3 py-2">
                  <div className="text-sm">
                    <span className="font-medium">{i.email}</span>{" "}
                    <span className="text-muted">· {i.role}</span>{" "}
                    <span className="text-muted">· {i.status}</span>
                  </div>
                  {i.status === "pending" && (
                    <button
                      className="text-xs rounded-md px-2 py-1 border border-border hover:bg-surface"
                      onClick={() => onRevoke(i.token || i._id)}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="p-3 text-sm text-muted">No pending invites.</div>
            )}
          </div>
          <p className="mt-2 text-[11px] text-muted">
            Invites expire after a short period. Members can edit; viewers are read-only.
          </p>
        </div>
      </div>
    </>
  );
}