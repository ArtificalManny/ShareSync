from pathlib import Path
from datetime import datetime
import shutil

TARGET = Path("src/components/project/pulse/card/LiveActivityCard.jsx")

NEW_CONTENT = r'''import React, { useMemo, useState } from "react";
import { Activity, CheckCircle2, Clock, Rocket } from "lucide-react";

function normalizeAvatarSrc(value) {
  if (!value || typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }

  return `/${trimmed.replace(/^\/+/, "")}`;
}

function getActorObject(activity) {
  if (!activity || typeof activity !== "object") return null;

  return (
    activity.actor ||
    activity.user ||
    activity.member ||
    activity.author ||
    activity.createdBy ||
    activity.updatedBy ||
    activity.completedBy ||
    activity.assignee ||
    null
  );
}

function getActorName(activity) {
  const actor = getActorObject(activity);

  const fullName = actor
    ? [actor.firstName, actor.lastName].filter(Boolean).join(" ").trim()
    : "";

  return (
    activity?.actorName ||
    activity?.userName ||
    activity?.username ||
    activity?.name ||
    actor?.name ||
    actor?.fullName ||
    actor?.displayName ||
    fullName ||
    actor?.username ||
    actor?.email ||
    "Project member"
  );
}

function getActorAvatar(activity) {
  const actor = getActorObject(activity);

  return normalizeAvatarSrc(
    activity?.avatarUrl ||
      activity?.profilePicture ||
      activity?.avatar ||
      activity?.photoUrl ||
      actor?.avatarUrl ||
      actor?.profilePicture ||
      actor?.avatar ||
      actor?.photoUrl ||
      actor?.imageUrl ||
      actor?.profile?.avatarUrl ||
      actor?.profile?.photoUrl ||
      null
  );
}

function getInitials(name) {
  const parts = String(name || "Project member")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "PM";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getActivityType(activity) {
  return String(activity?.type || activity?.status || "").toLowerCase();
}

function getActionLabel(activity) {
  const rawAction = String(activity?.action || "").trim();
  if (rawAction) return rawAction;

  const type = getActivityType(activity);

  if (type.includes("complete") || type.includes("done")) return "completed";
  if (type.includes("ship")) return "shipped";
  if (type.includes("create")) return "created";
  if (type.includes("start") || type.includes("progress")) return "started";
  if (type.includes("block")) return "blocked";

  return "updated";
}

function cleanTargetFromSentence(sentence, actorName) {
  const text = String(sentence || "").trim();
  if (!text) return "";

  const actor = String(actorName || "").trim();

  let cleaned = text
    .replace(/^Someone moved\s+/i, "")
    .replace(/^Someone\s+/i, "")
    .replace(/^Project member\s+/i, "");

  if (actor) {
    cleaned = cleaned.replace(new RegExp(`^${actor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i"), "");
  }

  cleaned = cleaned
    .replace(/^(moved|updated|completed|created|shipped|started|blocked)\s+/i, "")
    .replace(/^Someone\s+(moved|updated|completed|created|shipped|started|blocked)\s+/i, "")
    .trim();

  return cleaned;
}

function getActivityTarget(activity, actorName) {
  const explicitTarget =
    activity?.target ||
    activity?.taskTitle ||
    activity?.taskName ||
    activity?.projectTitle ||
    activity?.projectName ||
    activity?.itemTitle ||
    activity?.name ||
    "";

  if (explicitTarget) {
    return String(explicitTarget).trim();
  }

  const sentence = activity?.text || activity?.message || activity?.title || "";
  const cleaned = cleanTargetFromSentence(sentence, actorName);

  return cleaned || "an item";
}

function getStatusLabel(activity) {
  const type = getActivityType(activity);
  const action = getActionLabel(activity).toLowerCase();

  if (type.includes("complete") || action.includes("complete")) return "Completed";
  if (type.includes("ship") || action.includes("ship")) return "Shipped";
  if (type.includes("block") || action.includes("block")) return "Blocked";
  if (type.includes("progress") || action.includes("start")) return "In progress";

  return "Updated";
}

function formatTimeAgo(value) {
  if (!value) return "Now";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Now";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return "Now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1d ago";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function ActivityAvatar({ activity, actorName }) {
  const [failed, setFailed] = useState(false);
  const avatar = getActorAvatar(activity);

  if (avatar && !failed) {
    return (
      <img
        src={avatar}
        alt={`${actorName} avatar`}
        onError={() => setFailed(true)}
        className="h-9 w-9 rounded-full object-cover ring-2 ring-white dark:ring-[#111113] shadow-sm"
      />
    );
  }

  return (
    <div className="h-9 w-9 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-200 ring-2 ring-white dark:ring-[#111113] flex items-center justify-center text-[11px] font-black">
      {getInitials(actorName)}
    </div>
  );
}

function ActivityItem({ activity, index }) {
  const actorName = getActorName(activity);
  const action = getActionLabel(activity);
  const target = getActivityTarget(activity, actorName);
  const status = getStatusLabel(activity);
  const timestamp =
    activity?.createdAt ||
    activity?.updatedAt ||
    activity?.timestamp ||
    activity?.time ||
    activity?.date;

  const isCompleted = status.toLowerCase() === "completed";

  return (
    <li
      key={activity?._id || activity?.id || `${actorName}-${target}-${index}`}
      className="group rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-white/90 dark:bg-white/[0.035] px-4 py-3 shadow-sm dark:shadow-none hover:border-violet-200 dark:hover:border-violet-500/30 transition-all"
    >
      <div className="flex items-start gap-3">
        <ActivityAvatar activity={activity} actorName={actorName} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                isCompleted
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                  : "bg-violet-50 text-violet-700 border border-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20"
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <Activity className="h-3 w-3" />
              )}
              {status}
            </span>

            <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-zinc-500 whitespace-nowrap">
              <Clock className="h-3 w-3" />
              {formatTimeAgo(timestamp)}
            </span>
          </div>

          <p className="mt-2 text-sm leading-5 text-slate-700 dark:text-zinc-200">
            <span className="font-black text-slate-900 dark:text-white">
              {actorName}
            </span>{" "}
            <span className="text-slate-500 dark:text-zinc-400">
              {action}
            </span>{" "}
            <span className="font-semibold text-slate-800 dark:text-zinc-100">
              {target}
            </span>
          </p>
        </div>
      </div>
    </li>
  );
}

export default function LiveActivityCard({ activities, overview, loading }) {
  const items =
    activities?.items ||
    activities ||
    overview?.activity?.items ||
    overview?.recentActivity ||
    [];

  const list = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  return (
    <section className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm dark:shadow-none">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
              Live Activity
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500">
              Real-time execution signals from this project
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {loading ? "Loading…" : "Now"}
        </span>
      </header>

      {list.length > 0 ? (
        <ul className="space-y-2.5">
          {list.slice(0, 5).map((activity, index) => (
            <ActivityItem
              key={activity?._id || activity?.id || index}
              activity={activity}
              index={index}
            />
          ))}
        </ul>
      ) : (
        <div className="text-center py-8">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 mx-auto mb-3 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-1">
            No activity yet
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            Ship your first update to see the feed come alive.
          </p>
        </div>
      )}
    </section>
  );
}
'''

def fail(message):
    raise SystemExit(f"[fix_live_activity_card_actor_display] ERROR: {message}")

def main():
    print("[fix_live_activity_card_actor_display] starting")

    if not TARGET.exists():
        fail(f"missing file: {TARGET}")

    old_text = TARGET.read_text()

    required_old_tokens = [
        "export default function LiveActivityCard",
        "activities",
        "overview",
        "loading",
    ]

    for token in required_old_tokens:
        if token not in old_text:
            fail(f"expected token not found in existing file: {token}")

    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = TARGET.with_suffix(TARGET.suffix + f".bak.before-live-activity-actor-display-{stamp}")
    shutil.copy2(TARGET, backup)

    TARGET.write_text(NEW_CONTENT)

    new_text = TARGET.read_text()

    required_new_tokens = [
        "function getActorName",
        "function getActorAvatar",
        "function ActivityAvatar",
        "function ActivityItem",
        "profilePicture",
        "avatarUrl",
        "Project member",
    ]

    for token in required_new_tokens:
        if token not in new_text:
            fail(f"verification failed, missing token: {token}")

    print(f"[fix_live_activity_card_actor_display] backup created: {backup}")
    print("[fix_live_activity_card_actor_display] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "getActorName|getActorAvatar|ActivityAvatar|ActivityItem|profilePicture|avatarUrl|Project member" src/components/project/pulse/card/LiveActivityCard.jsx -C 6')
    print("  git diff -- src/components/project/pulse/card/LiveActivityCard.jsx")

if __name__ == "__main__":
    main()
