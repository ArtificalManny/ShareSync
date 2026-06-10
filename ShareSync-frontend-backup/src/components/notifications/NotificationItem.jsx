// src/components/notifications/NotificationItem.jsx
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

  if (directToken) return String(directToken).trim();

  const actions = Array.isArray(notification?.actions) ? notification.actions : [];
  const inviteAction = actions.find((action) => {
    const url = String(action?.url || "");
    return url.includes("/invite/");
  });

  const rawUrl = String(inviteAction?.url || "");
  if (!rawUrl.includes("/invite/")) return "";

  try {
    const parsed = new URL(rawUrl, window.location.origin);

    // Handles /invite/accept?token=abc123
    const queryToken = parsed.searchParams.get("token");
    if (queryToken) return queryToken.trim();

    // Handles /invite/abc123
    const parts = parsed.pathname.split("/").filter(Boolean);
    const inviteIndex = parts.indexOf("invite");
    const pathToken = inviteIndex >= 0 ? parts[inviteIndex + 1] : "";

    if (pathToken && pathToken !== "accept") {
      return decodeURIComponent(pathToken).trim();
    }
  } catch {
    // Fallback for weird relative URLs
    const queryMatch = rawUrl.match(/[?&]token=([^&#]+)/);
    if (queryMatch?.[1]) return decodeURIComponent(queryMatch[1]).trim();

    const pathPart = rawUrl.split("/invite/")[1]?.split("?")[0]?.split("#")[0] || "";
    if (pathPart && pathPart !== "accept") return decodeURIComponent(pathPart).trim();
  }

  return "";
}

function getProjectIdFromNotification(notification) {
  const data = notification?.data || {};
  const meta = notification?.meta || {};

  return (
    data.projectId ||
    data.project?._id ||
    data.project?.id ||
    meta.projectId ||
    meta.project?._id ||
    meta.project?.id ||
    ""
  );
}

function getProjectIdFromResponse(res, notification) {
  return (
    res?.projectId ||
    res?.data?.projectId ||
    res?.project?._id ||
    res?.project?.id ||
    res?.data?.project?._id ||
    res?.data?.project?.id ||
    getProjectIdFromNotification(notification)
  );
}

function getErrorMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Something went wrong. Please try again."
  );
}

function isAlreadyAcceptedMessage(message) {
  const msg = String(message || "").toLowerCase();
  return msg.includes("accepted") && msg.includes("cannot be accepted");
}

function isAlreadyDeclinedMessage(message) {
  const msg = String(message || "").toLowerCase();
  return msg.includes("declined") && msg.includes("cannot be declined");
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

  const removeNotificationSoon = () => {
    if (!notificationId || !onRemove) return;

    window.setTimeout(() => {
      try {
        onRemove(notificationId);
      } catch {
        // Non-critical. The local terminal state still prevents duplicate actions.
      }
    }, 350);
  };

  const finishAccepted = (res) => {
    const projectId = getProjectIdFromResponse(res, n);

    setResponded("accepted");
    markRead();
    removeNotificationSoon();

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
      window.setTimeout(() => {
        window.location.href = `/projects/${projectId}`;
      }, 600);
    }
  };

  const finishDeclined = () => {
    setResponded("declined");
    markRead();
    removeNotificationSoon();

    toast({
      title: "Invite declined",
      description: "The project invite was declined.",
      variant: "default",
    });
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
      finishAccepted(res);
    } catch (err) {
      const msg = getErrorMessage(err);

      if (isAlreadyAcceptedMessage(msg)) {
        finishAccepted(null);
        return;
      }

      toast({
        title: "Failed to accept invite",
        description: msg,
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
      finishDeclined();
    } catch (err) {
      const msg = getErrorMessage(err);

      if (isAlreadyDeclinedMessage(msg)) {
        finishDeclined();
        return;
      }

      if (isAlreadyAcceptedMessage(msg)) {
        finishAccepted(null);
        return;
      }

      toast({
        title: "Failed to decline invite",
        description: msg,
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
