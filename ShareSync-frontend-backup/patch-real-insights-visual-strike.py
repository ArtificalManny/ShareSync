from pathlib import Path
from datetime import datetime

FILES = {
    "tab": Path("src/components/insights/InsightsTab.jsx"),
    "weekly": Path("src/components/insights/WeeklyMomentumReport.jsx"),
    "activity": Path("src/components/insights/ActivityFeed.jsx"),
}

for label, path in FILES.items():
    if not path.exists():
        raise FileNotFoundError(f"Could not find {label}: {path}")

def backup(path):
    original = path.read_text()
    backup_path = path.with_suffix(
        path.suffix + f".backup-real-insights-visual-strike-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    )
    backup_path.write_text(original)
    return original, backup_path

# ─────────────────────────────────────────────────────────────────────────────
# 1) InsightsTab.jsx — main rendered Insights layout
# ─────────────────────────────────────────────────────────────────────────────

tab_path = FILES["tab"]
tab_original, tab_backup = backup(tab_path)
tab = tab_original

tab_replacements = [
    (
        "root shell",
        '<div className="space-y-6 pb-20">',
        '<div className="insights-tab-shell space-y-6 pb-20">',
    ),
    (
        "header panel",
        '<div className="flex items-center justify-between">',
        '<div className="insights-tab-header flex items-center justify-between">',
    ),
    (
        "range selector",
        '<div className="flex bg-slate-100 dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded-lg p-1">',
        '<div className="insights-range-selector flex bg-slate-100 dark:bg-[#18181b] border border-slate-200 dark:border-[#27272a] rounded-lg p-1">',
    ),
    (
        "ai banner",
        '<div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 flex gap-4 items-start">',
        '<div className="insights-momentum-banner bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 flex gap-4 items-start">',
    ),
    (
        "metrics grid",
        '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">',
        '<div className="insights-metrics-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">',
    ),
    (
        "charts grid",
        '<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">',
        '<div className="insights-charts-grid grid grid-cols-1 lg:grid-cols-3 gap-4">',
    ),
]

for label, old, new in tab_replacements:
    count = tab.count(old)
    if count != 1:
        raise RuntimeError(
            f"InsightsTab.jsx: expected exactly 1 match for {label}, found {count}. "
            f"No changes written. Backup saved at {tab_backup}"
        )
    tab = tab.replace(old, new, 1)

tab_style_anchor = """  return (
    <div className="insights-tab-shell space-y-6 pb-20">"""

tab_style_replacement = """  return (
    <div className="insights-tab-shell space-y-6 pb-20">
      <style>
        {`
          .insights-tab-shell {
            position: relative;
          }

          .insights-tab-shell::before {
            content: "";
            position: absolute;
            inset: -24px -18px auto -18px;
            height: 320px;
            pointer-events: none;
            background:
              radial-gradient(circle at 8% 12%, rgba(139, 92, 246, 0.16), transparent 34%),
              radial-gradient(circle at 88% 10%, rgba(34, 211, 238, 0.13), transparent 34%);
            opacity: 0.85;
            z-index: -1;
          }

          .insights-tab-header {
            position: relative;
            overflow: hidden;
            border: 1px solid rgba(124, 58, 237, 0.16);
            border-radius: 1.75rem;
            padding: 1.25rem 1.35rem;
            background:
              radial-gradient(circle at 8% 18%, rgba(139, 92, 246, 0.16), transparent 34%),
              radial-gradient(circle at 96% 8%, rgba(34, 211, 238, 0.12), transparent 32%),
              linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,250,252,0.82));
            box-shadow:
              0 24px 76px rgba(15, 23, 42, 0.10),
              inset 0 1px 0 rgba(255,255,255,0.78);
            backdrop-filter: blur(18px);
          }

          .dark .insights-tab-header {
            border-color: rgba(255,255,255,0.10);
            background:
              radial-gradient(circle at 8% 18%, rgba(139, 92, 246, 0.20), transparent 34%),
              radial-gradient(circle at 96% 8%, rgba(34, 211, 238, 0.10), transparent 32%),
              linear-gradient(135deg, rgba(15,23,42,0.94), rgba(2,6,23,0.88));
            box-shadow:
              0 30px 96px rgba(0,0,0,0.40),
              inset 0 1px 0 rgba(255,255,255,0.08);
          }

          .insights-range-selector {
            border-radius: 999px !important;
            background: rgba(255,255,255,0.74) !important;
            box-shadow:
              0 12px 32px rgba(15,23,42,0.08),
              inset 0 1px 0 rgba(255,255,255,0.72);
          }

          .dark .insights-range-selector {
            background: rgba(15,23,42,0.70) !important;
            box-shadow:
              0 14px 40px rgba(0,0,0,0.32),
              inset 0 1px 0 rgba(255,255,255,0.06);
          }

          .insights-momentum-banner {
            background:
              radial-gradient(circle at 3% 35%, rgba(16,185,129,0.22), transparent 28%),
              linear-gradient(135deg, rgba(236,253,245,0.96), rgba(240,253,250,0.78)) !important;
            border-color: rgba(16,185,129,0.28) !important;
            box-shadow:
              0 18px 52px rgba(16,185,129,0.10),
              inset 0 1px 0 rgba(255,255,255,0.70) !important;
          }

          .dark .insights-momentum-banner {
            background:
              radial-gradient(circle at 3% 35%, rgba(16,185,129,0.18), transparent 28%),
              linear-gradient(135deg, rgba(6,78,59,0.30), rgba(2,6,23,0.72)) !important;
            border-color: rgba(16,185,129,0.22) !important;
          }

          .insights-metrics-grid > *,
          .insights-charts-grid > div > * {
            position: relative;
            overflow: hidden;
            border-color: rgba(148,163,184,0.36) !important;
            background:
              radial-gradient(circle at 12% 0%, rgba(139,92,246,0.10), transparent 32%),
              radial-gradient(circle at 100% 0%, rgba(34,211,238,0.08), transparent 30%),
              linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.88)) !important;
            box-shadow:
              0 20px 58px rgba(15,23,42,0.10),
              inset 0 1px 0 rgba(255,255,255,0.72) !important;
            backdrop-filter: blur(16px);
            transition:
              transform 220ms ease,
              box-shadow 220ms ease,
              border-color 220ms ease;
          }

          .insights-metrics-grid > *:hover,
          .insights-charts-grid > div > *:hover {
            transform: translateY(-2px);
            border-color: rgba(124,58,237,0.36) !important;
            box-shadow:
              0 30px 78px rgba(124,58,237,0.16),
              inset 0 1px 0 rgba(255,255,255,0.80) !important;
          }

          .dark .insights-metrics-grid > *,
          .dark .insights-charts-grid > div > * {
            border-color: rgba(255,255,255,0.10) !important;
            background:
              radial-gradient(circle at 12% 0%, rgba(139,92,246,0.16), transparent 32%),
              radial-gradient(circle at 100% 0%, rgba(34,211,238,0.10), transparent 30%),
              linear-gradient(180deg, rgba(15,23,42,0.86), rgba(2,6,23,0.78)) !important;
            box-shadow:
              0 28px 90px rgba(0,0,0,0.42),
              inset 0 1px 0 rgba(255,255,255,0.07) !important;
          }

          .insights-metrics-grid > *::before,
          .insights-charts-grid > div > *::before {
            content: "";
            position: absolute;
            inset: 0 0 auto 0;
            height: 3px;
            background: linear-gradient(90deg, #8b5cf6, #22d3ee, #10b981);
            opacity: 0.82;
          }
        `}
      </style>"""

count = tab.count(tab_style_anchor)
if count != 1:
    raise RuntimeError(
        f"InsightsTab.jsx: expected exactly 1 style anchor, found {count}. "
        f"No changes written. Backup saved at {tab_backup}"
    )

tab = tab.replace(tab_style_anchor, tab_style_replacement, 1)
tab_path.write_text(tab)

# ─────────────────────────────────────────────────────────────────────────────
# 2) WeeklyMomentumReport.jsx — weekly report card + save button
# ─────────────────────────────────────────────────────────────────────────────

weekly_path = FILES["weekly"]
weekly_original, weekly_backup = backup(weekly_path)
weekly = weekly_original

weekly_replacements = [
    (
        "card class",
        'className="relative rounded-2xl overflow-hidden"',
        'className="weekly-momentum-card relative rounded-2xl overflow-hidden"',
    ),
    (
        "embedded wrapper",
        '<div className="space-y-3">',
        '<div className="weekly-momentum-shell space-y-3">',
    ),
    (
        "embedded save button",
        'className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 transition-all shadow-sm hover:shadow-violet-500/20"',
        'className="weekly-save-button flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 transition-all shadow-sm hover:shadow-violet-500/20"',
    ),
    (
        "modal save button",
        'className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm disabled:opacity-50 transition-all border border-white/10"',
        'className="weekly-save-button flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm disabled:opacity-50 transition-all border border-white/10"',
    ),
]

for label, old, new in weekly_replacements:
    count = weekly.count(old)
    if count != 1:
        raise RuntimeError(
            f"WeeklyMomentumReport.jsx: expected exactly 1 match for {label}, found {count}. "
            f"No changes written. Backup saved at {weekly_backup}"
        )
    weekly = weekly.replace(old, new, 1)

weekly_style_anchor = """  const card = (
    <div
      ref={cardRef}
      className="weekly-momentum-card relative rounded-2xl overflow-hidden\""""

weekly_style_replacement = """  const card = (
    <div
      ref={cardRef}
      className="weekly-momentum-card relative rounded-2xl overflow-hidden\""""

# The style is injected into the embedded wrapper instead of the card itself.
embedded_style_anchor = """  if (embedded) {
    return (
      <div className="weekly-momentum-shell space-y-3">"""

embedded_style_replacement = """  if (embedded) {
    return (
      <div className="weekly-momentum-shell space-y-3">
        <style>
          {`
            .weekly-momentum-shell {
              position: relative;
            }

            .weekly-momentum-card {
              border: 1px solid rgba(139,92,246,0.22) !important;
              box-shadow:
                0 30px 90px rgba(15,23,42,0.22),
                0 0 90px rgba(139,92,246,0.12),
                inset 0 1px 0 rgba(255,255,255,0.08) !important;
              min-height: 335px;
            }

            .weekly-momentum-card::before {
              content: "";
              position: absolute;
              inset: 0;
              pointer-events: none;
              background:
                radial-gradient(circle at 8% 10%, rgba(139,92,246,0.22), transparent 30%),
                radial-gradient(circle at 94% 16%, rgba(34,211,238,0.14), transparent 30%),
                linear-gradient(180deg, rgba(255,255,255,0.03), transparent 38%);
              z-index: 1;
            }

            .weekly-save-button {
              background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
              color: #ffffff !important;
              border: 1px solid rgba(196,181,253,0.72) !important;
              box-shadow:
                0 16px 36px rgba(109,40,217,0.34),
                inset 0 1px 0 rgba(255,255,255,0.24) !important;
            }

            .weekly-save-button:hover {
              background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 48%, #5b21b6 100%) !important;
              box-shadow:
                0 22px 48px rgba(109,40,217,0.46),
                inset 0 1px 0 rgba(255,255,255,0.24) !important;
            }

            .weekly-save-button,
            .weekly-save-button span,
            .weekly-save-button svg {
              color: #ffffff !important;
              stroke: #ffffff !important;
            }
          `}
        </style>"""

count = weekly.count(embedded_style_anchor)
if count != 1:
    raise RuntimeError(
        f"WeeklyMomentumReport.jsx: expected exactly 1 embedded style anchor, found {count}. "
        f"No changes written. Backup saved at {weekly_backup}"
    )

weekly = weekly.replace(embedded_style_anchor, embedded_style_replacement, 1)
weekly_path.write_text(weekly)

# ─────────────────────────────────────────────────────────────────────────────
# 3) ActivityFeed.jsx — lower activity feed panel
# ─────────────────────────────────────────────────────────────────────────────

activity_path = FILES["activity"]
activity_original, activity_backup = backup(activity_path)
activity = activity_original

activity_replacements = [
    (
        "activity row",
        '<div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-white/[0.04] last:border-b-0 group">',
        '<div className="insights-activity-row flex items-start gap-3 py-3 border-b border-slate-100 dark:border-white/[0.04] last:border-b-0 group">',
    ),
    (
        "activity root",
        'className={`bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/[0.06] rounded-xl ${className}`}',
        'className={`insights-activity-panel bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/[0.06] rounded-xl ${className}`}',
    ),
]

for label, old, new in activity_replacements:
    count = activity.count(old)
    if count != 1:
        raise RuntimeError(
            f"ActivityFeed.jsx: expected exactly 1 match for {label}, found {count}. "
            f"No changes written. Backup saved at {activity_backup}"
        )
    activity = activity.replace(old, new, 1)

activity_style_anchor = """    <div
      className={`insights-activity-panel bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/[0.06] rounded-xl ${className}`}
      style={{ boxShadow: '0 2px 12px rgba(139, 92, 246, 0.04)' }}
    >"""

activity_style_replacement = """    <div
      className={`insights-activity-panel bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/[0.06] rounded-xl ${className}`}
      style={{ boxShadow: '0 2px 12px rgba(139, 92, 246, 0.04)' }}
    >
      <style>
        {`
          .insights-activity-panel {
            overflow: hidden;
            border-color: rgba(148,163,184,0.34) !important;
            background:
              radial-gradient(circle at 8% 0%, rgba(139,92,246,0.10), transparent 30%),
              radial-gradient(circle at 96% 0%, rgba(34,211,238,0.08), transparent 30%),
              linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.90)) !important;
            box-shadow:
              0 24px 72px rgba(15,23,42,0.10),
              inset 0 1px 0 rgba(255,255,255,0.74) !important;
            backdrop-filter: blur(16px);
          }

          .dark .insights-activity-panel {
            border-color: rgba(255,255,255,0.10) !important;
            background:
              radial-gradient(circle at 8% 0%, rgba(139,92,246,0.16), transparent 30%),
              radial-gradient(circle at 96% 0%, rgba(34,211,238,0.10), transparent 30%),
              linear-gradient(180deg, rgba(15,23,42,0.88), rgba(2,6,23,0.82)) !important;
            box-shadow:
              0 30px 90px rgba(0,0,0,0.42),
              inset 0 1px 0 rgba(255,255,255,0.07) !important;
          }

          .insights-activity-panel::before {
            content: "";
            display: block;
            height: 3px;
            background: linear-gradient(90deg, #8b5cf6, #22d3ee, #10b981);
            opacity: 0.90;
          }

          .insights-activity-row {
            padding-left: 0.25rem;
            padding-right: 0.25rem;
            border-radius: 1rem;
            transition:
              background 180ms ease,
              transform 180ms ease,
              box-shadow 180ms ease;
          }

          .insights-activity-row:hover {
            background: rgba(139,92,246,0.055);
            transform: translateX(2px);
            box-shadow: inset 3px 0 0 rgba(139,92,246,0.32);
          }

          .dark .insights-activity-row:hover {
            background: rgba(139,92,246,0.10);
            box-shadow: inset 3px 0 0 rgba(167,139,250,0.42);
          }
        `}
      </style>"""

count = activity.count(activity_style_anchor)
if count != 1:
    raise RuntimeError(
        f"ActivityFeed.jsx: expected exactly 1 style anchor, found {count}. "
        f"No changes written. Backup saved at {activity_backup}"
    )

activity = activity.replace(activity_style_anchor, activity_style_replacement, 1)
activity_path.write_text(activity)

print("Real Insights visual strike patch applied successfully.")
print("")
print("Updated files:")
print(f"- {tab_path}")
print(f"- {weekly_path}")
print(f"- {activity_path}")
print("")
print("Backups:")
print(f"- {tab_backup}")
print(f"- {weekly_backup}")
print(f"- {activity_backup}")
print("")
print("Changed only visual class hooks and scoped CSS.")
print("No backend files were touched.")
print("No API calls, state logic, metric calculations, export logic, refresh logic, or activity-fetch logic were changed.")
