from pathlib import Path
import re
import sys

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"

def fail(message):
    print(f"\n[polish_profile_recent_ships_visual_only_v5] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

NEW_HELPERS = r"""
const getShipDateValue = (ship) => {
  return ship?.completedAt || ship?.shippedAt || ship?.updatedAt || ship?.createdAt || null;
};

const formatShipDate = (ship) => {
  const rawDate = getShipDateValue(ship);

  if (!rawDate) return "Recently";

  const date = new Date(rawDate);

  if (Number.isNaN(date.getTime())) return "Recently";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const getShipTitle = (ship) => {
  return ship?.title || ship?.name || ship?.summary || "Untitled ship";
};

const getShipProjectName = (ship) => {
  if (typeof ship?.projectId === "object" && ship.projectId?.name) return ship.projectId.name;
  if (typeof ship?.project === "object" && ship.project?.name) return ship.project.name;

  return ship?.projectName || ship?.workspaceName || "OpenShare workspace";
};

const getShipTypeMeta = (ship) => {
  const rawType = String(ship?.type || ship?.kind || ship?.category || "").toLowerCase();
  const title = String(getShipTitle(ship)).toLowerCase();

  if (rawType.includes("milestone") || title.includes("milestone")) {
    return { label: "Milestone completed", tone: "amber", Icon: Flag };
  }

  if (rawType.includes("file") || title.includes("file")) {
    return { label: "File delivered", tone: "blue", Icon: FileCheck2 };
  }

  if (rawType.includes("project") || title.includes("launch") || title.includes("ship")) {
    return { label: "Project shipped", tone: "violet", Icon: Rocket };
  }

  if (rawType.includes("update") || title.includes("update")) {
    return { label: "Update published", tone: "slate", Icon: Send };
  }

  return { label: "Task shipped", tone: "teal", Icon: CheckCircle2 };
};

const getShipToneClasses = (tone) => {
  const tones = {
    teal: {
      badge: "bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/20",
      dot: "bg-teal-500",
    },
    violet: {
      badge: "bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20",
      dot: "bg-violet-500",
    },
    amber: {
      badge: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
      dot: "bg-amber-500",
    },
    blue: {
      badge: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20",
      dot: "bg-blue-500",
    },
    slate: {
      badge: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-white/5 dark:text-zinc-300 dark:border-white/10",
      dot: "bg-slate-400",
    },
  };

  return tones[tone] || tones.teal;
};

const RecentShipsPanel = ({ ships = [], loading = false }) => {
  const safeShips = Array.isArray(ships) ? ships : [];
  const visibleShips = safeShips.slice(0, 6);
  const totalShips = visibleShips.length;

  return (
    <section
      className="mb-10 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm shadow-violet-100/40 backdrop-blur dark:border-white/10 dark:bg-[#1f1f23]/90 dark:shadow-black/20"
      aria-label="Recent shipped work"
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-teal-600 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300">
            <CheckCircle2 className="h-5 w-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                Recent Ships
              </h2>

              <span className="rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
                {loading ? "Refreshing" : "Live feed"}
              </span>
            </div>

            <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-zinc-400">
              Recent completed work and shipped deliverables from your profile activity.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300">
          <ArrowUpRight className="h-3.5 w-3.5 text-violet-500" />
          {totalShips} recent {totalShips === 1 ? "ship" : "ships"}
        </div>
      </div>

      {totalShips > 0 ? (
        <div className="space-y-2">
          {visibleShips.map((ship, index) => {
            const meta = getShipTypeMeta(ship);
            const tone = getShipToneClasses(meta.tone);
            const Icon = meta.Icon;
            const title = getShipTitle(ship);
            const projectName = getShipProjectName(ship);
            const dateLabel = formatShipDate(ship);
            const shipKey = ship?._id || ship?.id || `${title}-${dateLabel}-${index}`;

            return (
              <div
                key={shipKey}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50/30 hover:shadow-md hover:shadow-violet-100/50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-violet-500/30 dark:hover:bg-violet-500/[0.06] dark:hover:shadow-black/20"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${tone.badge}`}>
                    <Icon className="h-[18px] w-[18px]" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-zinc-100">
                      {title}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                      <span className="truncate">{projectName}</span>
                      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                      <span>{meta.label}</span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400">
                  <Clock3 className="h-3.5 w-3.5" />
                  {dateLabel}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-center dark:border-white/[0.14] dark:bg-white/[0.04]">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-300">
            <CheckCircle2 className="h-5 w-5" />
          </div>

          <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
            No recent ships yet.
          </p>

          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500 dark:text-zinc-400">
            Complete a task, publish an update, or ship a milestone to start building this visible delivery history.
          </p>
        </div>
      )}
    </section>
  );
};

"""

def add_lucide_imports(source):
    needed = [
        "CheckCircle2",
        "Clock3",
        "Rocket",
        "Flag",
        "FileCheck2",
        "Send",
        "ArrowUpRight",
    ]

    match = re.search(r'import\s*\{(?P<body>.*?)\}\s*from\s*["\']lucide-react["\'];', source, re.DOTALL)

    if not match:
        fail("Could not find lucide-react import block. No changes were written.")

    body = match.group("body")
    existing = set(re.findall(r'\b[A-Za-z][A-Za-z0-9_]*\b', body))
    missing = [name for name in needed if name not in existing]

    if not missing:
        return source

    cleaned_items = [item.strip() for item in body.split(",") if item.strip()]
    cleaned_items.extend(missing)

    new_body = "\n  " + ",\n  ".join(cleaned_items) + ",\n"
    new_import = f'import {{{new_body}}} from "lucide-react";'

    return source[:match.start()] + new_import + source[match.end():]

def insert_recent_ships_component(source):
    if "const RecentShipsPanel =" in source:
        return source

    anchor = "/* ─────────────────────────────────────────────────────────────────────────\n   MAIN PAGE - \"The Personal Gallery\"\n───────────────────────────────────────────────────────────────────────── */"

    if anchor not in source:
        fail("Could not find MAIN PAGE anchor. No changes were written.")

    return source.replace(anchor, NEW_HELPERS + anchor, 1)

def replace_recent_ships_map_only(source):
    if "<RecentShipsPanel ships={recentShips}" in source:
        print("[polish_profile_recent_ships_visual_only_v5] RecentShipsPanel call already present")
        return source

    # This targets the common old block:
    # {isOwnProfile && recentShips.length > 0 && ( ... recentShips.map(...) ... )}
    pattern = re.compile(
        r'\n\s*\{isOwnProfile\s*&&\s*recentShips(?:\?\.|\.|\s*)length\s*>\s*0\s*&&\s*\([\s\S]*?\n\s*\)\}\s*\n\s*(?=\{/\*\s*═══════════════════════════════════════════════════════════════════\s*\n\s*MAIN GRID|\{/\*\s*Impact Metrics\s*\*/|<div className="grid grid-cols-12 gap-6")',
        re.MULTILINE,
    )

    replacement = """

      {isOwnProfile && (
        <RecentShipsPanel ships={recentShips} loading={growthLoading} />
      )}

"""

    source, count = pattern.subn(replacement, source, count=1)

    if count == 1:
        return source

    # Fallback: insert immediately before MAIN GRID if the old block shape was not found.
    main_grid = source.find("      {/* ═══════════════════════════════════════════════════════════════════\n          MAIN GRID")
    if main_grid == -1:
        main_grid = source.find('      <div className="grid grid-cols-12 gap-6">')

    if main_grid == -1:
        fail("Could not find old Recent Ships block or MAIN GRID insertion point. No changes were written.")

    return source[:main_grid] + replacement + source[main_grid:]

def main():
    print("[polish_profile_recent_ships_visual_only_v5] starting")

    if not PROFILE.exists():
        fail(f"Could not find {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "export default function Profile",
        "Recent Ships",
        "Impact Metrics",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Expected marker not found before patch: {marker}. No changes were written.")

    source = add_lucide_imports(source)
    source = insert_recent_ships_component(source)
    source = replace_recent_ships_map_only(source)

    required_after = [
        "const RecentShipsPanel =",
        "const getShipTypeMeta =",
        "<RecentShipsPanel ships={recentShips} loading={growthLoading} />",
        "Recent completed work and shipped deliverables",
        "No recent ships yet.",
        "CheckCircle2",
        "Clock3",
        "Rocket",
        "Flag",
        "FileCheck2",
        "Send",
        "ArrowUpRight",
        "Impact Metrics",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed. Missing marker after patch: {marker}")

    if source == original:
        print("[polish_profile_recent_ships_visual_only_v5] no changes needed")
        return

    backup = PROFILE.with_suffix(PROFILE.suffix + ".bak-recent-ships-visual-only-v5")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[polish_profile_recent_ships_visual_only_v5] backup created: {backup}")

    PROFILE.write_text(source, encoding="utf-8")
    print(f"[polish_profile_recent_ships_visual_only_v5] patched: {PROFILE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"RecentShipsPanel|recentShips|Recent completed work|No recent ships yet|CheckCircle2|Clock3|Impact Metrics\" src/pages/Profile.jsx")
    print("  git diff -- src/pages/Profile.jsx")

if __name__ == "__main__":
    main()
