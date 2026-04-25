from pathlib import Path
import sys

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"

RECENT_SHIPS_COMPONENT = r"""
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
    return {
      label: "Milestone completed",
      tone: "amber",
      Icon: Flag,
    };
  }

  if (rawType.includes("file") || title.includes("file")) {
    return {
      label: "File delivered",
      tone: "blue",
      Icon: FileCheck2,
    };
  }

  if (rawType.includes("project") || title.includes("launch") || title.includes("ship")) {
    return {
      label: "Project shipped",
      tone: "violet",
      Icon: Rocket,
    };
  }

  if (rawType.includes("update") || title.includes("update")) {
    return {
      label: "Update published",
      tone: "slate",
      Icon: Send,
    };
  }

  return {
    label: "Task shipped",
    tone: "teal",
    Icon: CheckCircle2,
  };
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

const groupRecentShips = (ships = []) => {
  const now = new Date();

  const groups = [
    { label: "Today", items: [] },
    { label: "This Week", items: [] },
    { label: "Earlier", items: [] },
  ];

  ships.forEach((ship) => {
    const rawDate = getShipDateValue(ship);
    const date = rawDate ? new Date(rawDate) : null;

    if (!date || Number.isNaN(date.getTime())) {
      groups[2].items.push(ship);
      return;
    }

    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    const isSameDay = now.toDateString() === date.toDateString();

    if (isSameDay) {
      groups[0].items.push(ship);
    } else if (diffDays <= 7) {
      groups[1].items.push(ship);
    } else {
      groups[2].items.push(ship);
    }
  });

  return groups.filter((group) => group.items.length > 0);
};

const RecentShipsPanel = ({ ships = [], loading = false }) => {
  const safeShips = Array.isArray(ships) ? ships : [];
  const visibleShips = safeShips.slice(0, 6);
  const groups = groupRecentShips(visibleShips);
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
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.label} className="space-y-2">
              <div className="flex items-center gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">
                  {group.label}
                </p>
                <div className="h-px flex-1 bg-slate-100 dark:bg-white/5" />
              </div>

              <div className="space-y-2">
                {group.items.map((ship, index) => {
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
                          <Icon className="h-4.5 w-4.5" />
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
            </div>
          ))}
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

RECENT_SHIPS_CALL = """      {isOwnProfile && (
        <RecentShipsPanel ships={recentShips} loading={growthLoading} />
      )}

"""

RECENT_SHIPS_FETCH = """        try {
          const shipsRes = await client.get("/tasks", {
            params: {
              status: "done",
              limit: 6,
              sortBy: "completedAt",
              sortOrder: "desc",
            },
          });

          const taskPayload = shipsRes.data?.data?.tasks
            || shipsRes.data?.tasks
            || (Array.isArray(shipsRes.data?.data) ? shipsRes.data.data : [])
            || (Array.isArray(shipsRes.data) ? shipsRes.data : []);

          setRecentShips(Array.isArray(taskPayload) ? taskPayload.slice(0, 6) : []);
        } catch (err) {
          console.warn("[Profile] recent ships load failed", err?.message || err);
          setRecentShips([]);
        }

"""

def fail(message):
    print(f"\n[polish_profile_recent_ships] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def add_lucide_imports(source):
    missing = [
        "CheckCircle2",
        "Clock3",
        "Rocket",
        "Flag",
        "FileCheck2",
        "Send",
        "ArrowUpRight",
    ]

    actually_missing = [name for name in missing if name not in source]

    if not actually_missing:
        return source

    anchor = "  RefreshCw,\n} from \"lucide-react\";"

    if anchor not in source:
        fail("Could not find lucide-react import anchor. No changes were written.")

    insert = "".join(f"  {name},\n" for name in actually_missing)

    return source.replace(anchor, f"  RefreshCw,\n{insert}}} from \"lucide-react\";", 1)

def insert_recent_ships_state(source):
    if "const [recentShips, setRecentShips]" in source:
        return source

    anchor = "  const [profileAnalytics, setProfileAnalytics] = useState(null);\n"

    if anchor not in source:
        fail("Could not find profileAnalytics state anchor. No changes were written.")

    return source.replace(anchor, anchor + "  const [recentShips, setRecentShips] = useState([]);\n", 1)

def insert_recent_ships_fetch(source):
    if "setRecentShips(" in source and 'client.get("/tasks"' in source:
        return source

    anchor = "        setMe(merged);\n\n"

    if anchor not in source:
        fail("Could not find setMe(merged) anchor for recent ships fetch. No changes were written.")

    return source.replace(anchor, anchor + RECENT_SHIPS_FETCH, 1)

def insert_recent_ships_component(source):
    if "const RecentShipsPanel =" in source:
        return source

    anchor = "/* ─────────────────────────────────────────────────────────────────────────\n   MAIN PAGE - \"The Personal Gallery\"\n───────────────────────────────────────────────────────────────────────── */"

    if anchor not in source:
        fail("Could not find MAIN PAGE anchor. No changes were written.")

    return source.replace(anchor, RECENT_SHIPS_COMPONENT + anchor, 1)

def replace_or_insert_recent_ships_panel(source):
    if "<RecentShipsPanel ships={recentShips}" in source:
        return source

    header_idx = source.find("Recent Ships")

    main_grid_anchor = "      {/* ═══════════════════════════════════════════════════════════════════\n          MAIN GRID"
    main_grid_idx = source.find(main_grid_anchor)

    if main_grid_idx == -1:
        main_grid_idx = source.find('      <div className="grid grid-cols-12 gap-6">')

    if main_grid_idx == -1:
        fail("Could not find MAIN GRID anchor. No changes were written.")

    if header_idx == -1:
        return source[:main_grid_idx] + RECENT_SHIPS_CALL + source[main_grid_idx:]

    if header_idx > main_grid_idx:
        return source[:main_grid_idx] + RECENT_SHIPS_CALL + source[main_grid_idx:]

    start_candidates = [
        source.rfind("\n      {/*", 0, header_idx),
        source.rfind("\n      {isOwnProfile", 0, header_idx),
        source.rfind("\n      <section", 0, header_idx),
    ]

    start_candidates = [idx for idx in start_candidates if idx != -1]

    if not start_candidates:
        fail("Found Recent Ships text but could not identify the section start. No changes were written.")

    start = max(start_candidates)

    if start >= main_grid_idx:
        fail("Recent Ships section start appears after MAIN GRID anchor. No changes were written.")

    return source[:start] + "\n" + RECENT_SHIPS_CALL.rstrip() + "\n" + source[main_grid_idx:]

def main():
    print("[polish_profile_recent_ships] starting")

    if not PROFILE.exists():
        fail(f"Could not find {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "export default function Profile",
        "useGrowthTrack(userId)",
        "client",
        "const user = isPublicRoute ? publicUser : me;",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Expected marker not found before patch: {marker}. No changes were written.")

    source = add_lucide_imports(source)
    source = insert_recent_ships_state(source)
    source = insert_recent_ships_fetch(source)
    source = replace_or_insert_recent_ships_panel(source)
    source = insert_recent_ships_component(source)

    required_after = [
        "const RecentShipsPanel =",
        "const groupRecentShips =",
        "const getShipTypeMeta =",
        "<RecentShipsPanel ships={recentShips} loading={growthLoading} />",
        "const [recentShips, setRecentShips] = useState([]);",
        "setRecentShips(",
        "Recent completed work and shipped deliverables",
        "No recent ships yet.",
        "CheckCircle2",
        "Clock3",
        "Rocket",
        "Flag",
        "FileCheck2",
        "Send",
        "ArrowUpRight",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed. Missing marker after patch: {marker}")

    if source == original:
        print("[polish_profile_recent_ships] no changes needed")
        return

    backup = PROFILE.with_suffix(PROFILE.suffix + ".bak-recent-ships-polish")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[polish_profile_recent_ships] backup created: {backup}")

    PROFILE.write_text(source, encoding="utf-8")
    print(f"[polish_profile_recent_ships] patched: {PROFILE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"RecentShipsPanel|groupRecentShips|getShipTypeMeta|recentShips|Recent completed work|No recent ships yet|CheckCircle2|Clock3\" src/pages/Profile.jsx")
    print("  git diff -- src/pages/Profile.jsx")

if __name__ == "__main__":
    main()
