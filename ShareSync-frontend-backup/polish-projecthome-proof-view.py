from pathlib import Path
from datetime import datetime
import shutil

path = Path("src/pages/ProjectHome.jsx")

if not path.exists():
    raise FileNotFoundError(f"Could not find {path}")

text = path.read_text()
original = text

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".backup-proof-view-polish-{stamp}")
shutil.copy2(path, backup)

def fail(message):
    path.write_text(original)
    raise RuntimeError(message + f"\nOriginal restored. Backup kept at: {backup}")

start = text.find("function ProofView({")
end_marker = "// ═══════════════════════════════════════════════════════════════════════════════\n// MAIN COMPONENT"
end = text.find(end_marker, start)

if start == -1 or end == -1:
    fail("Could not safely find ProofView block.")

new_block = r'''function ProofMetricTile({
  icon: Icon,
  label,
  value,
  caption,
  tone = "violet",
}) {
  const toneClasses = {
    violet: {
      shell: "border-violet-200/80 bg-white shadow-violet-500/5 dark:border-violet-500/20 dark:bg-white/[0.035]",
      icon: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
      top: "from-violet-500 to-cyan-400",
    },
    teal: {
      shell: "border-teal-200/80 bg-white shadow-teal-500/5 dark:border-teal-500/20 dark:bg-white/[0.035]",
      icon: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300",
      top: "from-teal-400 to-emerald-400",
    },
    amber: {
      shell: "border-amber-200/80 bg-white shadow-amber-500/5 dark:border-amber-500/20 dark:bg-white/[0.035]",
      icon: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
      top: "from-amber-400 to-orange-400",
    },
    slate: {
      shell: "border-slate-200/80 bg-white shadow-slate-500/5 dark:border-white/[0.08] dark:bg-white/[0.035]",
      icon: "bg-slate-50 text-slate-600 dark:bg-white/[0.06] dark:text-zinc-300",
      top: "from-slate-300 to-slate-500",
    },
  };

  const styles = toneClasses[tone] || toneClasses.violet;

  return (
    <section
      className={`
        relative overflow-hidden rounded-[26px] border p-5 shadow-sm transition-all duration-300
        hover:-translate-y-0.5 hover:shadow-lg
        ${styles.shell}
      `}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${styles.top}`} />
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-500">
            {label}
          </p>
          <p className="mt-3 text-3xl font-black leading-none text-slate-950 dark:text-white">
            {value}
          </p>
          <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-zinc-400">
            {caption}
          </p>
        </div>

        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${styles.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </section>
  );
}

function ProofSummaryCard({
  project,
  finishLine,
  onReopenProject,
  isReopeningProject,
}) {
  const snapshot = finishLine?.completionSnapshot || {};
  const completedAt = formatDateTime(
    finishLine?.completedAt ||
      snapshot?.completedAt ||
      project?.completedAt
  );

  const outcomeStatus = humanizeEnum(
    finishLine?.outcomeStatus ||
      snapshot?.outcomeStatus ||
      project?.outcomeStatus
  );

  const isCompleted =
    finishLine?.isCompleted ||
    String(project?.status || "").toLowerCase() === "completed";

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#111113] dark:shadow-none">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(124,58,237,0.10),transparent_34%),radial-gradient(circle_at_100%_20%,rgba(45,212,191,0.10),transparent_34%)]" />

      <div className="relative z-10 border-b border-slate-100 px-5 py-4 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Archive className="h-4 w-4 text-violet-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Proof Summary
          </h3>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
          The project’s public-facing execution record.
        </p>
      </div>

      <div className="relative z-10 p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-white/[0.07] dark:bg-white/[0.03]">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
              Mode
            </p>
            <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">
              {isCompleted ? "Historical" : "Live"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-white/[0.07] dark:bg-white/[0.03]">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
              Outcome
            </p>
            <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">
              {outcomeStatus || (isCompleted ? "Completed" : "In Progress")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-white/[0.07] dark:bg-white/[0.03]">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
              Closed
            </p>
            <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">
              {completedAt || "Not closed yet"}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 p-5 dark:border-white/[0.08] dark:bg-white/[0.03]">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
              <Sparkles className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                Case study layer
              </h4>
              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-zinc-400">
                This is where OpenShare becomes different from a normal task manager:
                not just work tracking, but a clean record of what shipped, who moved it,
                and what changed.
              </p>
            </div>
          </div>
        </div>

        {isCompleted ? (
          <button
            type="button"
            onClick={onReopenProject}
            disabled={isReopeningProject}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-500/20 transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCcw className="h-4 w-4" />
            <span>{isReopeningProject ? "Reopening…" : "Reopen Project"}</span>
          </button>
        ) : null}
      </div>
    </section>
  );
}

function ProofSignalsPreview({ overview }) {
  const momentumScore = readNumber(overview?.momentum?.score, 0);
  const weeklyShips = readNumber(overview?.momentum?.weeklyShips, 0);
  const trend = readNumber(overview?.momentum?.trend, 0);
  const blockedCount = readNumber(overview?.summary?.blockedCount, 0);
  const activeGoalCount = Array.isArray(overview?.activeGoals)
    ? overview.activeGoals.length
    : 0;

  const signals = [
    {
      label: "Momentum",
      value: momentumScore,
      caption: "Current project energy",
      icon: Zap,
      tone: "violet",
    },
    {
      label: "Weekly ships",
      value: weeklyShips,
      caption: "Work shipped this week",
      icon: Rocket,
      tone: "teal",
    },
    {
      label: "Trend",
      value: trend > 0 ? `+${trend}` : trend,
      caption: "Execution direction",
      icon: TrendingUp,
      tone: trend >= 0 ? "teal" : "amber",
    },
    {
      label: "Open blockers",
      value: blockedCount,
      caption: `${activeGoalCount} active goal${activeGoalCount === 1 ? "" : "s"}`,
      icon: AlertTriangle,
      tone: blockedCount > 0 ? "amber" : "slate",
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#111113] dark:shadow-none">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(45,212,191,0.10),transparent_32%),radial-gradient(circle_at_10%_0%,rgba(124,58,237,0.08),transparent_34%)]" />

      <div className="relative z-10 border-b border-slate-100 px-5 py-4 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-violet-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Signals Preview
          </h3>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
          Proof should show the strongest signals, not open a full analytics page inside itself.
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
        {signals.map((signal) => {
          const Icon = signal.icon;

          return (
            <div
              key={signal.label}
              className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-white/[0.07] dark:bg-white/[0.03]"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
                  {signal.label}
                </span>
                <Icon className="h-4 w-4 text-violet-500" />
              </div>

              <p className="text-2xl font-black text-slate-950 dark:text-white">
                {signal.value}
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-zinc-400">
                {signal.caption}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ProofView({
  projectId,
  project,
  overview,
  finishLine,
  onReopenProject,
  isReopeningProject,
}) {
  const line = finishLine || overview?.finishLine || null;
  const snapshot = line?.completionSnapshot || {};
  const liveActivity = Array.isArray(overview?.liveActivity) ? overview.liveActivity : [];

  const completedTaskCount = readNumber(
    snapshot?.completedTaskCount,
    readNumber(
      line?.completedTaskCount,
      readNumber(
        overview?.summary?.completedTaskCount,
        readNumber(overview?.pulse?.todayCompleted, 0)
      )
    )
  );

  const activityCount = liveActivity.length;
  const blockedCount = readNumber(overview?.summary?.blockedCount, 0);
  const completionRate = readNumber(
    overview?.summary?.completionRate,
    readNumber(overview?.pulse?.completionRate, 0)
  );

  return (
    <div className="p-10 max-w-[1600px] mx-auto">
      <section className="mb-8 overflow-hidden rounded-[34px] border border-slate-200/80 bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#111113] dark:shadow-none">
        <div className="relative p-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(124,58,237,0.12),transparent_32%),radial-gradient(circle_at_92%_16%,rgba(45,212,191,0.12),transparent_34%),radial-gradient(circle_at_58%_110%,rgba(251,146,60,0.10),transparent_38%)]" />
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />

          <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 shadow-sm dark:bg-emerald-500/10 dark:text-emerald-300">
                <CheckCircle2 className="h-6 w-6" />
                <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400 dark:border-[#111113]" />
              </div>

              <div>
                <div className="mb-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                  Proof Ledger
                </div>

                <h2 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                  Evidence of execution, captured automatically.
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-zinc-400">
                  Proof turns ships, completions, blockers, signals, and activity into a visible record the team can trust.
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
              Live record
            </span>
          </div>
        </div>
      </section>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ProofMetricTile
          icon={CheckCircle2}
          label="Completed Work"
          value={completedTaskCount}
          caption="Items available as proof of execution."
          tone="teal"
        />

        <ProofMetricTile
          icon={Activity}
          label="Activity Signals"
          value={activityCount}
          caption="Recent project events captured in the ledger."
          tone="violet"
        />

        <ProofMetricTile
          icon={AlertTriangle}
          label="Open Friction"
          value={blockedCount === 0 ? "Clear" : blockedCount}
          caption={blockedCount === 0 ? "No open blockers surfaced." : "Blockers still visible in the record."}
          tone={blockedCount > 0 ? "amber" : "slate"}
        />

        <ProofMetricTile
          icon={Target}
          label="Completion"
          value={`${completionRate}%`}
          caption="Current completion signal for the project."
          tone="violet"
        />
      </div>

      <div className="mb-8">
        <ProjectLiveActivityCard activities={liveActivity} project={project} />
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <ProofSummaryCard
          project={project}
          finishLine={line}
          onReopenProject={onReopenProject}
          isReopeningProject={isReopeningProject}
        />

        <ProofSignalsPreview overview={overview} />
      </div>
    </div>
  );
}

'''

text = text[:start] + new_block + "\n" + text[end:]

required = [
    "function ProofMetricTile(",
    "function ProofSummaryCard(",
    "function ProofSignalsPreview(",
    "function ProofView({",
    "Proof Ledger",
    "Evidence of execution, captured automatically.",
]

missing = [item for item in required if item not in text]
if missing:
    fail("Patch incomplete. Missing: " + ", ".join(missing))

path.write_text(text)

print("Proof view polish applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- Replaced the weird mixed Proof/Insights layout with a cleaner Proof Ledger")
print("- Removed the full embedded InsightsTab from Proof")
print("- Kept Live Activity, but made it part of a proof record")
print("- Added compact Signals Preview instead of a giant analytics page")
print("- Added a Proof Summary / case-study foundation card")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No routes changed.")
