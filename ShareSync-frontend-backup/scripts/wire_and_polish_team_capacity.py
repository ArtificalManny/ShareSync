from pathlib import Path
import re

path = Path("src/pages/ProjectHome.jsx")
text = path.read_text()

backup = path.with_suffix(".jsx.bak-before-team-capacity-realtime-polish")
backup.write_text(text)

changed = 0

# Add utility import.
if 'buildProjectTeamCapacity from "../utils/projectTeamCapacity"' not in text:
    anchor = 'import buildProjectActiveGoals from "../utils/projectActiveGoals";'
    if anchor not in text:
        raise SystemExit("❌ Could not find buildProjectActiveGoals import anchor.")
    text = text.replace(
        anchor,
        anchor + '\nimport buildProjectTeamCapacity from "../utils/projectTeamCapacity";',
        1,
    )
    changed += 1
    print("✅ Added buildProjectTeamCapacity import.")

# Add lucide icons used by the polished card.
lucide_match = re.search(r'import\s*\{([\s\S]*?)\}\s*from\s*"lucide-react";', text)
if not lucide_match:
    raise SystemExit("❌ Could not find lucide-react import block.")

needed_icons = ["Users", "Gauge", "Layers", "ShieldAlert", "Activity"]
icons_block = lucide_match.group(1)

missing = [icon for icon in needed_icons if not re.search(rf'\b{icon}\b', icons_block)]
if missing:
    insert = "".join(f"\n  {icon}," for icon in missing)
    new_icons_block = icons_block.rstrip() + insert + "\n"
    text = text[:lucide_match.start(1)] + new_icons_block + text[lucide_match.end(1):]
    changed += 1
    print(f"✅ Added lucide icons: {', '.join(missing)}")

# Insert real-time Team Capacity derived metrics inside OverviewView.
if "const polishedTeamMetrics = useMemo(() => {" not in text:
    anchor = "  const teamCapacity = Array.isArray(overview?.teamCapacity) ? overview.teamCapacity : [];"
    if anchor not in text:
        raise SystemExit(
            "❌ Could not find teamCapacity anchor. Run:\n"
            "rg -n \"teamCapacity|teamMetrics|activeGoals\" src/pages/ProjectHome.jsx -C 12"
        )

    insertion = """  const polishedTeamMetrics = useMemo(() => {
    return buildProjectTeamCapacity({
      project: project || overview?.project || {},
      tasks: liveTasks,
      overview,
      projectOnlineCount,
    });
  }, [project, liveTasks, overview, projectOnlineCount]);

"""
    text = text.replace(anchor, insertion + anchor, 1)
    changed += 1
    print("✅ Added polishedTeamMetrics derived from liveTasks.")
else:
    print("ℹ️ polishedTeamMetrics already exists.")

# Make the rendered card use the new real-time metrics.
if "metrics={polishedTeamMetrics}" not in text:
    if "metrics={teamMetrics}" not in text:
        raise SystemExit(
            "❌ Could not find TeamCapacityCard metrics={teamMetrics}. Run:\n"
            "rg -n \"TeamCapacityCard\" src/pages/ProjectHome.jsx -C 10"
        )

    text = text.replace("metrics={teamMetrics}", "metrics={polishedTeamMetrics}", 1)
    changed += 1
    print("✅ TeamCapacityCard now receives polishedTeamMetrics.")

# Replace TeamCapacityCard with polished UI.
start = text.find("function TeamCapacityCard(")
if start == -1:
    raise SystemExit("❌ Could not find function TeamCapacityCard.")

end = text.find("\nfunction ProjectActiveGoalsCard", start)
if end == -1:
    raise SystemExit("❌ Could not find ProjectActiveGoalsCard after TeamCapacityCard.")

new_card = r'''function TeamCapacityCard({ metrics = {} }) {
  const members = Array.isArray(metrics?.members) ? metrics.members : [];

  const statCards = [
    {
      label: "Members",
      value: metrics?.memberCount ?? members.length,
      icon: Users,
      tone: "cyan",
    },
    {
      label: "Avg load",
      value: `${Number(metrics?.avgLoad || 0)}%`,
      icon: Gauge,
      tone: "violet",
    },
    {
      label: "Assigned",
      value: Number(metrics?.assigned || 0),
      icon: Layers,
      tone: "slate",
    },
    {
      label: "Blocked",
      value: Number(metrics?.blocked || 0),
      icon: ShieldAlert,
      tone: Number(metrics?.blocked || 0) > 0 ? "amber" : "emerald",
    },
  ];

  const getToneClasses = (tone) => {
    if (tone === "risk") {
      return {
        badge: "bg-rose-50 text-rose-700 border-rose-200",
        bar: "bg-gradient-to-r from-rose-500 to-orange-400",
        glow: "shadow-rose-500/10",
      };
    }

    if (tone === "warning") {
      return {
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        bar: "bg-gradient-to-r from-amber-400 to-orange-400",
        glow: "shadow-amber-500/10",
      };
    }

    return {
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      bar: "bg-gradient-to-r from-emerald-400 to-cyan-400",
      glow: "shadow-emerald-500/10",
    };
  };

  const getStatTone = (tone) => {
    const tones = {
      cyan: "bg-cyan-50 text-cyan-700 border-cyan-100",
      violet: "bg-violet-50 text-violet-700 border-violet-100",
      slate: "bg-slate-50 text-slate-700 border-slate-200",
      amber: "bg-amber-50 text-amber-700 border-amber-200",
      emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };

    return tones[tone] || tones.slate;
  };

  return (
    <section className="relative overflow-hidden bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/[0.06] rounded-2xl shadow-sm dark:shadow-none">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-500" />

      <div className="p-5">
        <header className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 border border-cyan-100 flex items-center justify-center shadow-sm">
              <Activity className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-950 dark:text-white">
                  Team Capacity
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase tracking-[0.18em]">
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Workload, ownership, and blockers by teammate.
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
              Online
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {Number(metrics?.onlineCount || 0)}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {statCards.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className={[
                  "rounded-2xl border px-4 py-3",
                  getStatTone(stat.tone),
                ].join(" ")}
              >
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] font-bold opacity-80">
                  <Icon className="w-3.5 h-3.5" />
                  {stat.label}
                </div>
                <div className="mt-2 text-xl font-black text-slate-950 dark:text-white">
                  {stat.value}
                </div>
              </div>
            );
          })}
        </div>

        {members.length > 0 ? (
          <div className="space-y-3">
            {members.map((member) => {
              const tone = getToneClasses(member.tone);
              const load = Math.max(0, Math.min(100, Number(member.load || 0)));

              return (
                <article
                  key={member.id || member.email || member.name}
                  className={[
                    "rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.03] p-4 shadow-sm",
                    tone.glow,
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          className="w-11 h-11 rounded-2xl object-cover border border-white shadow-sm"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-100 to-violet-100 text-cyan-800 flex items-center justify-center font-black text-xs border border-white shadow-sm">
                          {member.initials}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-slate-950 dark:text-white truncate">
                            {member.name}
                          </h4>

                          {member.displayRole ? (
                            <span className="px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-100 text-[10px] font-bold">
                              {member.displayRole}
                            </span>
                          ) : null}
                        </div>

                        <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                          {member.email || `${member.assigned || 0} assigned`}
                        </p>
                      </div>
                    </div>

                    <span
                      className={[
                        "px-3 py-1 rounded-full border text-xs font-bold whitespace-nowrap",
                        tone.badge,
                      ].join(" ")}
                    >
                      {member.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400 font-bold">
                        Assigned
                      </div>
                      <div className="text-sm font-black text-slate-950 dark:text-white">
                        {member.assigned}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400 font-bold">
                        Blocked
                      </div>
                      <div className="text-sm font-black text-slate-950 dark:text-white">
                        {member.blocked}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400 font-bold">
                        Load
                      </div>
                      <div className="text-sm font-black text-slate-950 dark:text-white">
                        {load}%
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 h-2 rounded-full bg-slate-200/80 dark:bg-white/[0.08] overflow-hidden">
                    <div
                      className={["h-full rounded-full", tone.bar].join(" ")}
                      style={{ width: `${load}%` }}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08] p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 mx-auto flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <p className="font-semibold text-slate-900 dark:text-white">
              No team members found yet
            </p>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
              Add project members or assign tasks to activate capacity tracking.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

'''

text = text[:start] + new_card + text[end:]

path.write_text(text)

print("")
print(f"✅ Team Capacity wired and polished. Changes: {changed}")
print(f"✅ Backup created: {backup}")
print("")
print("Inspect:")
print('rg -n "buildProjectTeamCapacity|polishedTeamMetrics|function TeamCapacityCard|Workload, ownership|metrics=\\{polishedTeamMetrics\\}" src/pages/ProjectHome.jsx -C 8')
