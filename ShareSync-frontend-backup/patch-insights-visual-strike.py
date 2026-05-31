from pathlib import Path
from datetime import datetime

FILE_PATH = Path("src/components/views/InsightsView.jsx")

if not FILE_PATH.exists():
    raise FileNotFoundError(f"Could not find {FILE_PATH}")

original = FILE_PATH.read_text()

backup_path = FILE_PATH.with_suffix(
    FILE_PATH.suffix + f".backup-visual-strike-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup_path.write_text(original)

updated = original

replacements = [
    (
        "InsightCard outer shell",
        '<div className={`p-5 rounded-xl ${style.bg} border ${style.border}`}>',
        '<div className={`insights-signal-card p-5 rounded-xl ${style.bg} border ${style.border}`}>',
    ),
    (
        "MetricCard outer shell",
        '<div className="p-5 rounded-xl bg-surface-1 border border-white/[0.06]">',
        '<div className="insights-metric-card p-5 rounded-xl bg-surface-1 border border-white/[0.06]">',
    ),
    (
        "SprintHealthGauge outer shell",
        '<div className="p-6 rounded-xl bg-surface-1 border border-white/[0.06]">',
        '<div className="insights-panel-card p-6 rounded-xl bg-surface-1 border border-white/[0.06]">',
    ),
    (
        "TeamBalanceChart outer shell",
        '<div className="p-6 rounded-xl bg-surface-1 border border-white/[0.06]">',
        '<div className="insights-panel-card p-6 rounded-xl bg-surface-1 border border-white/[0.06]">',
    ),
    (
        "AIAssistant outer shell",
        '<div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 via-brand-500/5 to-transparent border border-purple-500/20">',
        '<div className="insights-ai-panel p-6 rounded-xl bg-gradient-to-br from-purple-500/10 via-brand-500/5 to-transparent border border-purple-500/20">',
    ),
    (
        "main wrapper",
        '<div className="p-10 max-w-[1400px] mx-auto">',
        '<div className="insights-view-shell p-10 max-w-[1400px] mx-auto">',
    ),
    (
        "header row",
        '<div className="flex items-center justify-between mb-8">',
        '<div className="insights-hero-panel flex items-center justify-between mb-8">',
    ),
    (
        "metrics grid",
        '<div className="grid grid-cols-4 gap-6 mb-8">',
        '<div className="insights-metrics-grid grid grid-cols-4 gap-6 mb-8">',
    ),
    (
        "main grid",
        '<div className="grid grid-cols-12 gap-8">',
        '<div className="insights-main-grid grid grid-cols-12 gap-8">',
    ),
]

for label, old, new in replacements:
    count = updated.count(old)

    if count < 1:
        raise RuntimeError(
            f"Expected at least 1 match for {label}, but found {count}. "
            f"No changes were written. Backup saved at {backup_path}"
        )

    if label in ["SprintHealthGauge outer shell", "TeamBalanceChart outer shell"]:
        updated = updated.replace(old, new, 1)
    else:
        if count != 1:
            raise RuntimeError(
                f"Expected exactly 1 match for {label}, but found {count}. "
                f"No changes were written. Backup saved at {backup_path}"
            )
        updated = updated.replace(old, new, 1)

style_anchor = """  return (
    <div className="insights-view-shell p-10 max-w-[1400px] mx-auto">"""

style_replacement = """  return (
    <div className="insights-view-shell p-10 max-w-[1400px] mx-auto">
      <style>
        {`
          .insights-view-shell {
            position: relative;
          }

          .insights-view-shell::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background:
              radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.14), transparent 28%),
              radial-gradient(circle at 92% 5%, rgba(34, 211, 238, 0.12), transparent 30%);
            opacity: 0.9;
            z-index: -1;
          }

          .insights-hero-panel {
            position: relative;
            overflow: hidden;
            border: 1px solid rgba(124, 58, 237, 0.16);
            border-radius: 2rem;
            padding: 1.5rem;
            background:
              radial-gradient(circle at 7% 15%, rgba(139, 92, 246, 0.18), transparent 32%),
              radial-gradient(circle at 94% 10%, rgba(34, 211, 238, 0.14), transparent 32%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.78));
            box-shadow:
              0 28px 90px rgba(15, 23, 42, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.78);
            backdrop-filter: blur(18px);
          }

          .dark .insights-hero-panel {
            border-color: rgba(255, 255, 255, 0.10);
            background:
              radial-gradient(circle at 7% 15%, rgba(139, 92, 246, 0.22), transparent 32%),
              radial-gradient(circle at 94% 10%, rgba(34, 211, 238, 0.12), transparent 32%),
              linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.88));
            box-shadow:
              0 34px 110px rgba(0, 0, 0, 0.42),
              inset 0 1px 0 rgba(255, 255, 255, 0.08);
          }

          .insights-metric-card,
          .insights-panel-card,
          .insights-signal-card,
          .insights-ai-panel {
            position: relative;
            overflow: hidden;
            border-color: rgba(148, 163, 184, 0.32) !important;
            background:
              radial-gradient(circle at 10% 0%, rgba(139, 92, 246, 0.10), transparent 32%),
              radial-gradient(circle at 100% 0%, rgba(34, 211, 238, 0.08), transparent 30%),
              linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.86)) !important;
            box-shadow:
              0 20px 58px rgba(15, 23, 42, 0.10),
              inset 0 1px 0 rgba(255, 255, 255, 0.72) !important;
            backdrop-filter: blur(16px);
            transition:
              transform 220ms ease,
              box-shadow 220ms ease,
              border-color 220ms ease;
          }

          .insights-metric-card:hover,
          .insights-panel-card:hover,
          .insights-signal-card:hover,
          .insights-ai-panel:hover {
            transform: translateY(-2px);
            border-color: rgba(124, 58, 237, 0.32) !important;
            box-shadow:
              0 30px 78px rgba(124, 58, 237, 0.16),
              inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
          }

          .dark .insights-metric-card,
          .dark .insights-panel-card,
          .dark .insights-signal-card,
          .dark .insights-ai-panel {
            border-color: rgba(255, 255, 255, 0.10) !important;
            background:
              radial-gradient(circle at 10% 0%, rgba(139, 92, 246, 0.16), transparent 32%),
              radial-gradient(circle at 100% 0%, rgba(34, 211, 238, 0.10), transparent 30%),
              linear-gradient(180deg, rgba(15, 23, 42, 0.86), rgba(2, 6, 23, 0.78)) !important;
            box-shadow:
              0 28px 90px rgba(0, 0, 0, 0.42),
              inset 0 1px 0 rgba(255, 255, 255, 0.07) !important;
          }

          .insights-metric-card::before,
          .insights-panel-card::before,
          .insights-signal-card::before,
          .insights-ai-panel::before {
            content: "";
            position: absolute;
            inset: 0 0 auto 0;
            height: 3px;
            background: linear-gradient(90deg, #8b5cf6, #22d3ee, #10b981);
            opacity: 0.85;
          }

          .insights-ai-panel {
            border-color: rgba(139, 92, 246, 0.28) !important;
            background:
              radial-gradient(circle at 12% 10%, rgba(139, 92, 246, 0.22), transparent 34%),
              radial-gradient(circle at 90% 20%, rgba(34, 211, 238, 0.12), transparent 32%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(245, 243, 255, 0.82)) !important;
          }

          .dark .insights-ai-panel {
            background:
              radial-gradient(circle at 12% 10%, rgba(139, 92, 246, 0.22), transparent 34%),
              radial-gradient(circle at 90% 20%, rgba(34, 211, 238, 0.10), transparent 32%),
              linear-gradient(135deg, rgba(30, 27, 75, 0.82), rgba(2, 6, 23, 0.86)) !important;
          }

          .insights-metrics-grid {
            position: relative;
          }

          .insights-main-grid {
            position: relative;
          }
        `}
      </style>"""

count = updated.count(style_anchor)

if count != 1:
    raise RuntimeError(
        f"Expected exactly 1 style anchor match, but found {count}. "
        f"No changes were written. Backup saved at {backup_path}"
    )

updated = updated.replace(style_anchor, style_replacement, 1)

FILE_PATH.write_text(updated)

print("Insights visual strike patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- Scoped visual CSS inside InsightsView.jsx")
print("- Visual class hooks on header, metric cards, insight cards, panels, and AI assistant")
print("")
print("No backend files were touched.")
print("No state logic was changed.")
print("No metrics, insight data, AI assistant behavior, time range logic, or button behavior was changed.")
