#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path.cwd()
TARGET = ROOT / "src/pages/ProjectHome.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message):
    print(f"\n[enhance_project_live_activity_card] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def backup(path: Path):
    backup_path = path.with_name(f"{path.name}.bak-enhance-live-activity-{STAMP}")
    backup_path.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
    print(f"[enhance_project_live_activity_card] backup created: {backup_path}")


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        fail(f"Expected exactly 1 occurrence for {label}, found {count}. No changes were written.")
    print(f"[enhance_project_live_activity_card] replacing: {label}")
    return source.replace(old, new, 1)


ENHANCED_COMPONENT = r'''
function getLiveActivityMeta(activity) {
  const rawType = String(
    activity?.type ||
      activity?.eventType ||
      activity?.action ||
      activity?.kind ||
      ""
  ).toLowerCase();

  if (rawType.includes("completed") || rawType.includes("done")) {
    return {
      label: "Completed",
      Icon: CheckCircle2,
      dotClass: "bg-emerald-400",
      iconClass: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
      chipClass: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
    };
  }

  if (rawType.includes("ship") || rawType.includes("update")) {
    return {
      label: "Shipped",
      Icon: Rocket,
      dotClass: "bg-violet-400",
      iconClass: "bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20",
      chipClass: "bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20",
    };
  }

  if (rawType.includes("block") || rawType.includes("risk")) {
    return {
      label: "Blocked",
      Icon: AlertTriangle,
      dotClass: "bg-amber-400",
      iconClass: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
      chipClass: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
    };
  }

  if (rawType.includes("goal")) {
    return {
      label: "Goal",
      Icon: Target,
      dotClass: "bg-cyan-400",
      iconClass: "bg-cyan-50 text-cyan-600 border-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/20",
      chipClass: "bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/20",
    };
  }

  return {
    label: humanizeEnum(rawType) || "Activity",
    Icon: Activity,
    dotClass: "bg-teal-400",
    iconClass: "bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/20",
    chipClass: "bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/20",
  };
}

function getActivityActor(activity) {
  const candidates = [
    activity?.actorName,
    activity?.userName,
    activity?.createdByName,
    activity?.authorName,
    activity?.actor?.name,
    activity?.actor?.username,
    activity?.user?.name,
    activity?.user?.username,
    activity?.createdBy?.name,
    activity?.createdBy?.username,
  ];

  const found = candidates.find((value) => value && String(value).trim());
  return found ? String(found).trim() : "Someone";
}

function getActivityTarget(activity) {
  const candidates = [
    activity?.targetTitle,
    activity?.taskTitle,
    activity?.projectTitle,
    activity?.entityTitle,
    activity?.title,
    activity?.label,
    activity?.text,
    activity?.message,
    activity?.description,
  ];

  const found = candidates.find((value) => value && String(value).trim());
  return found ? String(found).trim() : "";
}

function formatLiveActivityTime(activity) {
  const raw =
    activity?.createdAt ||
    activity?.updatedAt ||
    activity?.timestamp ||
    activity?.time ||
    activity?.date;

  if (!raw) return "Just now";

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "Recent";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function ProjectLiveActivityCard({ activities = [] }) {
  const items = Array.isArray(activities) ? activities.slice(0, 5) : [];
  const hasItems = items.length > 0;

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#111113] dark:shadow-none">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_12%,rgba(45,212,191,0.12),transparent_30%),radial-gradient(circle_at_12%_0%,rgba(124,58,237,0.08),transparent_34%)]" />

      <header className="relative z-10 flex items-start justify-between gap-4 border-b border-slate-100/90 px-5 py-4 dark:border-white/[0.06]">
        <div className="flex items-start gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Activity className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-[#111113]" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              Live Activity
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Real-time execution signals from this project
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Now
        </span>
      </header>

      <div className="relative z-10 p-4">
        {hasItems ? (
          <div className="space-y-3">
            {items.map((item, index) => {
              const meta = getLiveActivityMeta(item);
              const Icon = meta.Icon;
              const actor = getActivityActor(item);
              const target = getActivityTarget(item);
              const timeLabel = formatLiveActivityTime(item);
              const key = item?._id || item?.id || `${actor}-${target}-${index}`;

              return (
                <article
                  key={key}
                  className="group relative rounded-2xl border border-slate-200/80 bg-white/90 p-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_16px_36px_rgba(124,58,237,0.08)] dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-violet-500/20"
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border ${meta.iconClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${meta.chipClass}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
                          {meta.label}
                        </span>

                        <span className="shrink-0 text-[11px] text-slate-400 dark:text-zinc-500">
                          {timeLabel}
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-snug text-slate-700 dark:text-zinc-300">
                        <span className="font-semibold text-slate-900 dark:text-zinc-100">
                          {actor}
                        </span>
                        {target ? (
                          <>
                            {" "}
                            moved{" "}
                            <span className="font-semibold text-slate-900 dark:text-zinc-100">
                              {target}
                            </span>
                          </>
                        ) : (
                          " updated the project"
                        )}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-8 text-center dark:border-white/[0.08] dark:bg-white/[0.03]">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
              No live activity yet
            </p>
            <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
              Ship a task, complete work, or update the project to start building a visible activity trail.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
'''


def main():
    print("[enhance_project_live_activity_card] starting")

    if not TARGET.exists():
        fail(f"Target file not found: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_before = [
        "function HistoricalModeBanner({",
        "function OverviewView({",
        "<LiveActivityCard activities={liveActivity} />",
        "const liveActivity = Array.isArray(overview?.liveActivity) ? overview.liveActivity : [];",
    ]

    for marker in required_before:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    if "function ProjectLiveActivityCard({" not in source:
        insert_marker = "\nfunction OverviewView({"
        source = replace_once(
            source,
            insert_marker,
            "\n" + ENHANCED_COMPONENT + "\nfunction OverviewView({",
            "insert ProjectLiveActivityCard before OverviewView"
        )
    else:
        print("[enhance_project_live_activity_card] ProjectLiveActivityCard already exists")

    source = replace_once(
        source,
        "        <LiveActivityCard activities={liveActivity} />",
        "        <ProjectLiveActivityCard activities={liveActivity} />",
        "replace Overview live activity card usage"
    )

    required_after = [
        "function ProjectLiveActivityCard({",
        "getLiveActivityMeta",
        "formatLiveActivityTime",
        "<ProjectLiveActivityCard activities={liveActivity} />",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if source == original:
        fail("No changes detected. No files were written.")

    backup(TARGET)
    TARGET.write_text(source, encoding="utf-8")
    print(f"[enhance_project_live_activity_card] patched: {TARGET}")

    print("")
    print("[enhance_project_live_activity_card] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "ProjectLiveActivityCard|getLiveActivityMeta|formatLiveActivityTime|LiveActivityCard activities" src/pages/ProjectHome.jsx -C 8')
    print("  git diff -- src/pages/ProjectHome.jsx")


if __name__ == "__main__":
    main()
