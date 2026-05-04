from pathlib import Path
import re

path = Path("src/components/ecosystem/Achievements.jsx")

if not path.exists():
    raise SystemExit(f"File not found: {path}")

text = path.read_text()

# ─────────────────────────────────────────────────────────────
# 1) Make React import include hooks.
# ─────────────────────────────────────────────────────────────
react_import_pattern = re.compile(r"import\s+React(?:\s*,\s*\{[^}]*\})?\s+from\s+['\"]react['\"];\s*")

react_match = react_import_pattern.search(text)
if not react_match:
    raise SystemExit("Could not find React import.")

text = react_import_pattern.sub(
    "import React, { useEffect, useMemo, useState } from 'react';\n",
    text,
    count=1,
)

# ─────────────────────────────────────────────────────────────
# 2) Add API client import after the last import.
# ─────────────────────────────────────────────────────────────
if "from '../../api/client'" not in text and 'from "../../api/client"' not in text:
    import_matches = list(re.finditer(r"^import .+?;\s*$", text, re.MULTILINE))
    if not import_matches:
        raise SystemExit("Could not find import block.")

    last_import = import_matches[-1]
    insert_at = last_import.end()
    text = text[:insert_at] + "\nimport client from '../../api/client';" + text[insert_at:]

# ─────────────────────────────────────────────────────────────
# 3) Expand Achievements props.
# ─────────────────────────────────────────────────────────────
old_sig_pattern = re.compile(
    r"const\s+Achievements\s*=\s*\(\s*\{\s*currentLevel\s*=\s*1,\s*currentXp\s*=\s*0,\s*currentStreak\s*=\s*0,\s*totalShips\s*=\s*0\s*\}\s*\)\s*=>\s*\{"
)

new_sig = """const Achievements = ({
  currentLevel = 1,
  currentXp = 0,
  currentStreak = 0,
  totalShips = 0,
  variant = 'compact',
}) => {"""

if not old_sig_pattern.search(text):
    raise SystemExit("Could not find Achievements function signature.")

text = old_sig_pattern.sub(new_sig, text, count=1)

# ─────────────────────────────────────────────────────────────
# 4) Add backend stats loading after isMobile line.
# ─────────────────────────────────────────────────────────────
old_mobile_line = "  const isMobile = useIsMobile();"

stats_block = """  const isMobile = useIsMobile();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        const response = await client.get('/users/me/stats');
        const payload = response.data?.data || response.data || null;

        if (!cancelled && payload) {
          setStats(payload);
        }
      } catch (err) {
        console.warn('[Achievements] Failed to load stats:', err?.message);
      }
    }

    loadStats();

    const onRefresh = () => loadStats();
    window.addEventListener('task.completed', onRefresh);
    window.addEventListener('project.completed', onRefresh);
    window.addEventListener('project:lifecycle-updated', onRefresh);

    return () => {
      cancelled = true;
      window.removeEventListener('task.completed', onRefresh);
      window.removeEventListener('project.completed', onRefresh);
      window.removeEventListener('project:lifecycle-updated', onRefresh);
    };
  }, []);

  const resolvedLevel = Number(stats?.level ?? currentLevel ?? 1);
  const resolvedXp = Number(stats?.xp ?? currentXp ?? 0);
  const resolvedStreak = Number(
    stats?.streakDays ??
      stats?.currentStreak ??
      currentStreak ??
      0
  );
  const resolvedShips = Number(
    stats?.totalShips ??
      stats?.ships ??
      stats?.shipCount ??
      totalShips ??
      0
  );
  const resolvedWeeklyShips = Number(
    stats?.weeklyShips ??
      stats?.shipsThisWeek ??
      stats?.shippedThisWeek ??
      0
  );"""

if old_mobile_line not in text:
    raise SystemExit("Could not find const isMobile = useIsMobile(); line.")

text = text.replace(old_mobile_line, stats_block, 1)

# ─────────────────────────────────────────────────────────────
# 5) Replace prop-based calculations with resolved backend values.
# ─────────────────────────────────────────────────────────────
text = text.replace(
    "{ id: 1, name: `Level ${currentLevel + 1}`, current: currentXp, target: (currentLevel * 500) + 150, icon: Star, color: 'purple' },",
    "{ id: 1, name: `Level ${resolvedLevel + 1}`, current: resolvedXp, target: (resolvedLevel * 500) + 150, icon: Star, color: 'purple' },"
)

text = text.replace(
    "{ id: 2, name: '30-Day Streak', current: currentStreak, target: 30, icon: Flame, color: 'orange' },",
    "{ id: 2, name: '30-Day Streak', current: resolvedStreak, target: 30, icon: Flame, color: 'orange' },"
)

text = text.replace(
    "{ id: 3, name: '100 Ships', current: totalShips, target: 100, icon: Trophy, color: 'yellow' }",
    "{ id: 3, name: '100 Ships', current: resolvedShips, target: 100, icon: Trophy, color: 'yellow' }"
)

replacements = {
    "unlocked: currentStreak >= 7": "unlocked: resolvedStreak >= 7",
    "unlocked: totalShips >= 5": "unlocked: resolvedShips >= 5",
    "unlocked: currentLevel >= 5": "unlocked: resolvedLevel >= 5",
    "unlocked: currentStreak >= 100": "unlocked: resolvedStreak >= 100",
    "unlocked: currentLevel >= 10": "unlocked: resolvedLevel >= 10",
    "unlocked: currentLevel >= 20": "unlocked: resolvedLevel >= 20",
}

for old, new in replacements.items():
    text = text.replace(old, new)

# ─────────────────────────────────────────────────────────────
# 6) Add compact Discover version before the mobile/full version.
# ─────────────────────────────────────────────────────────────
anchor = """  const getStyles = (color) => colorStyles[color] || colorStyles.purple;
  const getRarityBorder = (rarity) => rarityStyles[rarity] || rarityStyles.common;

  if (isMobile) {"""

compact = """  const getStyles = (color) => colorStyles[color] || colorStyles.purple;
  const getRarityBorder = (rarity) => rarityStyles[rarity] || rarityStyles.common;

  if (variant === 'compact') {
    const nextShipTarget = resolvedShips >= 100 ? 250 : 100;
    const shipProgress = Math.min(100, Math.round((resolvedShips / nextShipTarget) * 100));
    const streakProgress = Math.min(100, Math.round((resolvedStreak / 30) * 100));
    const unlockedBadges = achievements.badges.filter((badge) => badge.unlocked);

    return (
      <div className="bg-white dark:bg-surface-1 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-orange-100 dark:bg-warning/10 rounded-xl flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-orange-500 dark:text-warning" />
            </div>

            <div className="min-w-0">
              <h3 className="font-bold text-slate-800 dark:text-text-primary text-base leading-tight">
                Your Progress
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-text-tertiary">
                Personal momentum while you discover projects
              </p>
            </div>
          </div>

          <span className="shrink-0 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
            Level {resolvedLevel}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/[0.05] dark:bg-surface-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-text-tertiary">
              Ships
            </p>
            <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">
              {resolvedShips}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/[0.05] dark:bg-surface-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-text-tertiary">
              Streak
            </p>
            <p className="mt-1 text-lg font-black text-orange-600 dark:text-orange-300">
              {resolvedStreak}d
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/[0.05] dark:bg-surface-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-text-tertiary">
              Week
            </p>
            <p className="mt-1 text-lg font-black text-violet-600 dark:text-violet-300">
              {resolvedWeeklyShips}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-text-tertiary mb-1.5">
              <span>{nextShipTarget} Ships</span>
              <span>{resolvedShips}/{nextShipTarget}</span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-surface-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${shipProgress}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-text-tertiary mb-1.5">
              <span>30-Day Streak</span>
              <span>{resolvedStreak}/30</span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-surface-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${streakProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            {achievements.badges.slice(0, 4).map((badge, idx) => {
              const BadgeIcon = badge.icon;
              const styles = badge.unlocked ? getStyles(badge.color) : null;

              return (
                <div
                  key={idx}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                    badge.unlocked
                      ? 'bg-slate-50 dark:bg-surface-2 border-slate-200 dark:border-white/[0.08]'
                      : 'bg-slate-50 dark:bg-surface-0 opacity-35 border-slate-100 dark:border-transparent'
                  }`}
                  title={badge.unlocked ? `${badge.label} Badge` : 'Locked'}
                >
                  <BadgeIcon className={`w-4 h-4 ${badge.unlocked ? styles?.icon : 'text-slate-400 dark:text-text-tertiary'}`} />
                </div>
              );
            })}
          </div>

          <span className="text-[11px] font-bold text-slate-400 dark:text-text-tertiary">
            {unlockedBadges.length}/{achievements.badges.length} badges
          </span>
        </div>
      </div>
    );
  }

  if (isMobile) {"""

if anchor not in text:
    raise SystemExit("Could not find getStyles/mobile branch anchor.")

text = text.replace(anchor, compact, 1)

path.write_text(text)
print("Patched Achievements into backend-backed compact Discover teaser.")
