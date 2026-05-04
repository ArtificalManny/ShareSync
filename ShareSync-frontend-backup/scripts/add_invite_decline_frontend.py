from pathlib import Path

api_path = Path("src/api/invites.js")
item_path = Path("src/components/notifications/NotificationItem.jsx")

for path in [api_path, item_path]:
    if not path.exists():
        raise SystemExit(f"Missing file: {path}")

api = api_path.read_text()

if "export async function declineInvite" not in api:
    old = """export async function acceptInvite(token) {
  if (!token) throw new Error('Missing invite token.');
  const res = await client.post('/invites/accept', { token });
  return res.data?.data || res.data;
}

export default { sendInvite, listInvites, revokeInvite, acceptInvite };"""

    new = """export async function acceptInvite(token) {
  if (!token) throw new Error('Missing invite token.');
  const res = await client.post('/invites/accept', { token });
  return res.data?.data || res.data;
}

/**
 * Decline an invite using its token.
 * @param {string} token
 */
export async function declineInvite(token) {
  if (!token) throw new Error('Missing invite token.');
  const res = await client.post('/invites/decline', { token });
  return res.data?.data || res.data;
}

export default { sendInvite, listInvites, revokeInvite, acceptInvite, declineInvite };"""

    if old not in api:
        raise SystemExit("Could not find acceptInvite/default export block in src/api/invites.js.")

    api = api.replace(old, new, 1)
    api_path.write_text(api)

item = r'''// src/components/notifications/NotificationItem.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION ITEM — Renders a single notification with real invite accept/decline
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useMemo, useState } from "react";
import { Check, X, Trash2 } from "lucide-react";
import { acceptInvite, declineInvite } from "../../api/invites";
import { toast } from "../ui/toast";

function getNotificationId(notification) {
  return notification?._id || notification?.id;
}

function getInviteToken(notification) {
  const data = notification?.data || {};
  const meta = notification?.meta || {};

  const directToken =
    data.inviteToken ||
    data.token ||
    meta.inviteToken ||
    meta.token;

  if (directToken) return directToken;

  const actions = Array.isArray(notification?.actions) ? notification.actions : [];
  const inviteAction = actions.find((action) => {
    const url = String(action?.url || "");
    return url.includes("/invite/");
  });

  const url = String(inviteAction?.url || "");
  if (!url.includes("/invite/")) return "";

  return url.split("/invite/")[1]?.split("?")[0]?.split("#")[0] || "";
}

function getProjectIdFromResponse(res) {
  return (
    res?.projectId ||
    res?.data?.projectId ||
    res?.project?._id ||
    res?.project?.id ||
    res?.data?.project?._id ||
    res?.data?.project?.id ||
    ""
  );
}

export default function NotificationItem({
  item,
  notification,
  onToggleRead,
  onMarkRead,
  onRemove,
  onClick,
}) {
  const n = notification || item || {};
  const notificationId = getNotificationId(n);
  const read = Boolean(n.read || n.isRead);

  const [responding, setResponding] = useState(false);
  const [responded, setResponded] = useState(null); // "accepted" | "declined"

  const inviteToken = useMemo(() => getInviteToken(n), [n]);

  const isInvite =
    String(n.type || "").toLowerCase().includes("invite") ||
    String(n.type || "").toLowerCase().includes("member.invited") ||
    Boolean(inviteToken);

  const markRead = () => {
    if (!notificationId) return;
    onMarkRead?.(notificationId);
    onToggleRead?.(notificationId);
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(n);
      return;
    }

    markRead();
  };

  const handleAccept = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (responding || responded) return;

    if (!inviteToken) {
      toast({ title: "No invite token found", variant: "error" });
      return;
    }

    setResponding(true);

    try {
      const res = await acceptInvite(inviteToken);
      const projectId = getProjectIdFromResponse(res);

      setResponded("accepted");
      markRead();

      window.dispatchEvent(
        new CustomEvent("project:members-updated", {
          detail: { projectId },
        })
      );

      toast({
        title: "Invite accepted",
        description: "You've joined the project.",
        variant: "success",
      });

      if (projectId) {
        setTimeout(() => {
          window.location.href = `/projects/${projectId}`;
        }, 500);
      }
    } catch (err) {
      toast({
        title: "Failed to accept invite",
        description: err?.response?.data?.message || err?.message || "Please try again.",
        variant: "error",
      });
    } finally {
      setResponding(false);
    }
  };

  const handleDecline = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (responding || responded) return;

    if (!inviteToken) {
      toast({ title: "No invite token found", variant: "error" });
      return;
    }

    setResponding(true);

    try {
      await declineInvite(inviteToken);

      setResponded("declined");
      markRead();

      toast({
        title: "Invite declined",
        description: "The project invite was declined.",
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Failed to decline invite",
        description: err?.response?.data?.message || err?.message || "Please try again.",
        variant: "error",
      });
    } finally {
      setResponding(false);
    }
  };

  const handleRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!notificationId) return;
    onRemove?.(notificationId);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className={[
        "w-full text-left px-4 py-3 flex gap-3 rounded-xl transition-colors border border-transparent",
        read
          ? "hover:bg-slate-50 dark:hover:bg-white/5"
          : "bg-violet-50/70 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20",
      ].join(" ")}
      title={isInvite ? "Project invitation" : "Notification"}
    >
      <div
        className={[
          "mt-1 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
          isInvite ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-500",
        ].join(" ")}
      >
        {isInvite ? "👥" : "🔔"}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div
              className={[
                "text-sm truncate",
                read
                  ? "text-slate-600 dark:text-zinc-400"
                  : "text-slate-800 dark:text-zinc-200 font-semibold",
              ].join(" ")}
            >
              {n.title || "Notification"}
            </div>

            {n.body ? (
              <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2">
                {n.body}
              </div>
            ) : null}

            {n?._displayTime ? (
              <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">
                {n._displayTime}
              </div>
            ) : null}
          </div>

          {onRemove && (
            <button
              type="button"
              onClick={handleRemove}
              className="p-1 text-slate-300 hover:text-rose-500 rounded transition-colors"
              title="Remove notification"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {isInvite && !responded && (
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={handleAccept}
              disabled={responding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                bg-violet-600 hover:bg-violet-700 text-white
                disabled:opacity-50 transition-colors shadow-sm"
            >
              <Check className="w-3 h-3" />
              {responding ? "Working..." : "Accept"}
            </button>

            <button
              type="button"
              onClick={handleDecline}
              disabled={responding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-white/60
                hover:bg-slate-200 dark:hover:bg-white/[0.10]
                disabled:opacity-50 transition-colors"
            >
              <X className="w-3 h-3" />
              Decline
            </button>
          </div>
        )}

        {responded === "accepted" && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <Check className="w-3 h-3" />
            Joined project
          </div>
        )}

        {responded === "declined" && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400 dark:text-white/40 font-medium">
            <X className="w-3 h-3" />
            Invite declined
          </div>
        )}
      </div>
    </div>
  );
}
'''

item_path.write_text(item)

print("Added frontend declineInvite API helper and real invite notification buttons.")
