from pathlib import Path
from datetime import datetime

FILES = {
    "tab": Path("src/components/insights/InsightsTab.jsx"),
    "metric": Path("src/components/insights/MetricCard.jsx"),
    "sprint": Path("src/components/insights/SprintHealth.jsx"),
    "team": Path("src/components/insights/TeamBalance.jsx"),
}

for label, path in FILES.items():
    if not path.exists():
        raise FileNotFoundError(f"Could not find {label}: {path}")

def backup(path):
    original = path.read_text()
    backup_path = path.with_suffix(
        path.suffix + f".backup-inline-icons-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    )
    backup_path.write_text(original)
    return original, backup_path

def replace_once(text, old, new, label, backup_path):
    count = text.count(old)
    if count != 1:
        raise RuntimeError(
            f"Expected exactly 1 match for {label}, but found {count}. "
            f"No changes were written. Backup saved at {backup_path}"
        )
    return text.replace(old, new, 1)

# ─────────────────────────────────────────────────────────────────────────────
# 1) InsightsTab.jsx — import icons + pass icon props
# ─────────────────────────────────────────────────────────────────────────────

tab_path = FILES["tab"]
tab, tab_backup = backup(tab_path)

react_import = "import React, { useState, useEffect } from 'react';"
icon_import = "import { Gauge, Clock3, Target, Users2, Activity, Scale } from 'lucide-react';"

if icon_import not in tab:
    tab = replace_once(
        tab,
        react_import,
        f"{react_import}\n{icon_import}",
        "InsightsTab lucide icon import",
        tab_backup,
    )

tab_replacements = [
    (
        "Velocity MetricCard icon",
        """            <MetricCard
              title="Velocity"
              value={metrics.velocity.value}""",
        """            <MetricCard
              title="Velocity"
              icon={Gauge}
              iconTone="violet"
              value={metrics.velocity.value}""",
    ),
    (
        "Avg Cycle Time MetricCard icon",
        """            <MetricCard
              title="Avg Cycle Time"
              value={metrics.cycleTime.value}""",
        """            <MetricCard
              title="Avg Cycle Time"
              icon={Clock3}
              iconTone="blue"
              value={metrics.cycleTime.value}""",
    ),
    (
        "Completion Rate MetricCard icon",
        """            <MetricCard
              title="Completion Rate"
              value={metrics.completionRate.value}""",
        """            <MetricCard
              title="Completion Rate"
              icon={Target}
              iconTone="emerald"
              value={metrics.completionRate.value}""",
    ),
    (
        "Collaboration MetricCard icon",
        """            <MetricCard
              title="Collaboration"
              value={metrics.collaboration.value}""",
        """            <MetricCard
              title="Collaboration"
              icon={Users2}
              iconTone="cyan"
              value={metrics.collaboration.value}""",
    ),
    (
        "SprintHealth icon prop",
        """              <SprintHealth completionRate={metrics.completionRate.value} />""",
        """              <SprintHealth
                icon={Activity}
                completionRate={metrics.completionRate.value}
              />""",
    ),
    (
        "TeamBalance icon prop",
        """              <TeamBalance teamData={teamBalance} />""",
        """              <TeamBalance
                icon={Scale}
                teamData={teamBalance}
              />""",
    ),
]

for label, old, new in tab_replacements:
    if new in tab:
        print(f"Skipping {label}; it already appears to be applied.")
        continue

    tab = replace_once(tab, old, new, label, tab_backup)

tab_path.write_text(tab)

# ─────────────────────────────────────────────────────────────────────────────
# 2) MetricCard.jsx — accept icon + render professional inline badge
# ─────────────────────────────────────────────────────────────────────────────

metric_path = FILES["metric"]
metric_original, metric_backup = backup(metric_path)

metric_new = """import React from 'react';

const ICON_TONE_CLASSES = {
  violet:
    'border-violet-200/80 bg-violet-500/10 text-violet-600 dark:border-violet-400/20 dark:bg-violet-500/15 dark:text-violet-300',
  blue:
    'border-blue-200/80 bg-blue-500/10 text-blue-600 dark:border-blue-400/20 dark:bg-blue-500/15 dark:text-blue-300',
  emerald:
    'border-emerald-200/80 bg-emerald-500/10 text-emerald-600 dark:border-emerald-400/20 dark:bg-emerald-500/15 dark:text-emerald-300',
  cyan:
    'border-cyan-200/80 bg-cyan-500/10 text-cyan-600 dark:border-cyan-400/20 dark:bg-cyan-500/15 dark:text-cyan-300',
};

const MetricCard = ({
  title,
  icon: Icon,
  iconTone = 'violet',
  value,
  trend,
  unit,
  invertTrendColors = false,
}) => {
  // If invertTrendColors is true (like for Cycle Time), a negative trend is GOOD (green)
  const isPositiveTrend = invertTrendColors ? trend <= 0 : trend >= 0;

  // Neon color classes
  const trendColorClass = isPositiveTrend ? 'text-emerald-400' : 'text-rose-400';
  const trendBgClass = isPositiveTrend ? 'bg-emerald-400/10' : 'bg-rose-400/10';
  const iconToneClass = ICON_TONE_CLASSES[iconTone] || ICON_TONE_CLASSES.violet;

  return (
    <div
      className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 flex flex-col justify-between"
      style={{ boxShadow: '0 2px 12px rgba(139, 92, 246, 0.04)' }}
    >
      <div className="mb-3 flex items-center gap-2">
        {Icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${iconToneClass}`}>
            <Icon className="h-4 w-4" strokeWidth={2.15} />
          </div>
        )}

        <h3 className="text-slate-500 dark:text-zinc-400 text-sm font-semibold tracking-wide">
          {title}
        </h3>
      </div>

      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-slate-800 dark:text-zinc-100">{value}</span>
          {unit && <span className="text-slate-400 dark:text-zinc-500 text-sm font-medium">{unit}</span>}
        </div>

        <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${trendColorClass} ${trendBgClass}`}>
          {trend > 0 ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
          ) : trend < 0 ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
          ) : (
            <span className="px-1">-</span>
          )}
          {trend !== 0 && <span>{Math.abs(trend)}%</span>}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
"""

metric_path.write_text(metric_new)

# ─────────────────────────────────────────────────────────────────────────────
# 3) SprintHealth.jsx — accept icon + render inline title badge
# ─────────────────────────────────────────────────────────────────────────────

sprint_path = FILES["sprint"]
sprint_original, sprint_backup = backup(sprint_path)

sprint_new = """import React from 'react';

const SprintHealth = ({ completionRate, icon: Icon }) => {
  // SVG Donut Math
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <div
      className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded-xl p-6 flex flex-col items-center justify-center"
      style={{ boxShadow: '0 2px 12px rgba(139, 92, 246, 0.04)' }}
    >
      <div className="mb-6 flex w-full items-center gap-2 self-start">
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200/80 bg-amber-500/10 text-amber-600 dark:border-amber-400/20 dark:bg-amber-500/15 dark:text-amber-300">
            <Icon className="h-4 w-4" strokeWidth={2.15} />
          </div>
        )}

        <h3 className="text-slate-800 dark:text-zinc-100 font-semibold">
          Sprint Health
        </h3>
      </div>

      <div className="relative flex items-center justify-center w-32 h-32">
        {/* Background Track */}
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-200 dark:text-zinc-800"
          />
          {/* Neon Progress Arc */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-amber-400 transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-800 dark:text-zinc-100">{completionRate}%</span>
          <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium tracking-wide">DONE</span>
        </div>
      </div>

      <p className="text-slate-500 dark:text-zinc-400 text-sm mt-6 text-center">
        On track to hit milestone targets.
      </p>
    </div>
  );
};

export default SprintHealth;
"""

sprint_path.write_text(sprint_new)

# ─────────────────────────────────────────────────────────────────────────────
# 4) TeamBalance.jsx — accept icon + render inline title badge
# ─────────────────────────────────────────────────────────────────────────────

team_path = FILES["team"]
team_original, team_backup = backup(team_path)

team_new = """import React from 'react';

const TeamBalanceHeader = ({ icon: Icon, title }) => (
  <div className="mb-4 flex items-center gap-2">
    {Icon && (
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-200/80 bg-cyan-500/10 text-cyan-600 dark:border-cyan-400/20 dark:bg-cyan-500/15 dark:text-cyan-300">
        <Icon className="h-4 w-4" strokeWidth={2.15} />
      </div>
    )}

    <h3 className="text-slate-800 dark:text-zinc-100 font-semibold">
      {title}
    </h3>
  </div>
);

const TeamBalance = ({ teamData, icon: Icon }) => {
  if (!teamData || teamData.length === 0) {
    return (
      <div
        className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded-xl p-6"
        style={{ boxShadow: '0 2px 12px rgba(139, 92, 246, 0.04)' }}
      >
        <TeamBalanceHeader icon={Icon} title="Team Balance" />
        <p className="text-slate-500 dark:text-zinc-500 text-sm">Not enough task data to calculate workload.</p>
      </div>
    );
  }

  return (
    <div
      className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded-xl p-6"
      style={{ boxShadow: '0 2px 12px rgba(139, 92, 246, 0.04)' }}
    >
      <TeamBalanceHeader icon={Icon} title="Team Workload Balance" />

      <div className="space-y-5">
        {teamData.map((member) => {
          // Dynamic neon coloring based on workload strain
          let barColor = 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
          let textColor = 'text-emerald-400';

          if (member.workloadPercentage > 110) {
            barColor = 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]';
            textColor = 'text-rose-400';
          } else if (member.workloadPercentage > 85) {
            barColor = 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]';
            textColor = 'text-amber-400';
          }

          return (
            <div key={member.userId} className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700 dark:text-zinc-200 font-medium">{member.name}</span>
                <span className={`font-bold ${textColor}`}>
                  {member.workloadPercentage}%
                </span>
              </div>

              {/* Progress Bar Track */}
              <div className="w-full bg-slate-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
                  style={{ width: `${Math.min(member.workloadPercentage, 100)}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 dark:text-zinc-500">{member.taskCount} active tasks</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamBalance;
"""

team_path.write_text(team_new)

print("Insights inline icons patch applied successfully.")
print("")
print("Updated files:")
print(f"- {tab_path}")
print(f"- {metric_path}")
print(f"- {sprint_path}")
print(f"- {team_path}")
print("")
print("Backups:")
print(f"- {tab_backup}")
print(f"- {metric_backup}")
print(f"- {sprint_backup}")
print(f"- {team_backup}")
print("")
print("Changed only:")
print("- Added professional lucide icons to Insights metrics and panels.")
print("- Added visual icon badges next to Velocity, Avg Cycle Time, Completion Rate, Collaboration, Sprint Health, and Team Balance.")
print("")
print("No backend files were touched.")
print("No API calls, state logic, metric calculations, refresh logic, export logic, or activity-fetch logic were changed.")
