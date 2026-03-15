// src/components/notifications/NotificationItem.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION ITEM — Renders a single notification with invite accept/reject
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { acceptInvite } from "../../api/invites";
import { toast } from "../ui/toast";

export default function NotificationItem({ item, onToggleRead }) {
  const n = item || {};
  const read = Boolean(n.read);
  const [responding, setResponding] = useState(false);
  const [responded, setResponded] = useState(null); // 'accepted' | 'rejected'

  const isInvite =
    String(n.type || "").includes("invite") ||
    String(n.type || "").includes("member.invited") ||
    Boolean(n.meta?.inviteToken);

  const handleAccept = async (e) => {
    e.stopPropagation();
    if (responding || responded) return;
    const token = n.meta?.inviteToken || n.meta?.token;
    if (!token) {
      toast({ title: "No invite token found", variant: "error" });
      return;
    }
    setResponding(true);
    try {
      await acceptInvite(token);
      setResponded("accepted");
      toast({ title: "Invite accepted! You've joined the project.", variant: "success" });
      onToggleRead?.(n.id);
    } catch (err) {
      toast({ title: err?.message || "Failed to accept invite", variant: "error" });
    } finally {
      setResponding(false);
    }
  };

  const handleReject = (e) => {
    e.stopPropagation();
    setResponded("rejected");
    onToggleRead?.(n.id);
    toast({ title: "Invite declined", variant: "default" });
  };

  return (
    <button
      type="button"
      onClick={() => onToggleRead?.(n.id)}
      className={[
        "w-full text-left px-4 py-3 flex gap-3 transition-colors border-t border-slate-100 dark:border-white/5",
        read ? "hover:bg-black/5 dark:hover:bg-white/5" : "bg-violet-50/50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20",
      ].join(" ")}
      title="Click to toggle read"
    >
      <div
        className={[
          "mt-1 w-2 h-2 rounded-full flex-shrink-0",
          !read ? "bg-violet-500" : "bg-slate-200 dark:bg-white/10",
        ].join(" ")}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className={`text-sm truncate ${read ? 'text-slate-600 dark:text-zinc-400' : 'text-slate-800 dark:text-zinc-200 font-medium'}`}>
            {n.title || "Notification"}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-zinc-500 shrink-0">
            {n._displayTime || ""}
          </div>
        </div>

        {n.body ? (
          <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2">
            {n.body}
          </div>
        ) : null}

        {n?.type && String(n.type).includes("follow") && n?.meta?.projectName ? (
          <div className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
            Project: <span className="text-slate-600 dark:text-zinc-300">{n.meta.projectName}</span>
          </div>
        ) : null}

        {/* ✅ Invite accept/reject buttons */}
        {isInvite && !responded && (
          <div className="flex items-center gap-2 mt-2.5">
            <button
              onClick={handleAccept}
              disabled={responding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                bg-violet-600 hover:bg-violet-700 text-white
                disabled:opacity-50 transition-colors shadow-sm"
            >
              <Check className="w-3 h-3" />
              {responding ? "Joining..." : "Accept"}
            </button>
            <button
              onClick={handleReject}
              disabled={responding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-white/50
                hover:bg-slate-200 dark:hover:bg-white/[0.10]
                disabled:opacity-50 transition-colors"
            >
              <X className="w-3 h-3" />
              Decline
            </button>
          </div>
        )}

        {responded === "accepted" && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <Check className="w-3 h-3" />
            Joined project
          </div>
        )}

        {responded === "rejected" && (
          <div className="text-xs text-slate-400 dark:text-white/30 mt-2">
            Invite declined
          </div>
        )}
      </div>
    </button>
  );
}
