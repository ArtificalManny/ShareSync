from pathlib import Path
from datetime import datetime
import shutil
import re

home_path = Path("src/pages/Home.jsx")
css_path = Path("src/index.css")

if not home_path.exists():
    raise FileNotFoundError("Could not find src/pages/Home.jsx")

if not css_path.exists():
    raise FileNotFoundError("Could not find src/index.css")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
home_backup = home_path.with_suffix(home_path.suffix + f".backup-velocity-visual-v2-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-velocity-visual-v2-{stamp}")

shutil.copy2(home_path, home_backup)
shutil.copy2(css_path, css_backup)

home = home_path.read_text()
css = css_path.read_text()

old_wrapper = '''            <div className={sectionCardClasses} data-momentum={glowLevel}>
              <SectionHeader
                icon={TrendingUp}
                iconColor="text-violet-600 dark:text-violet-400"
                title="Velocity Metrics"'''

new_wrapper = '''            <div className={`home-velocity-metrics-panel ${sectionCardClasses}`} data-momentum={glowLevel}>
              <SectionHeader
                icon={TrendingUp}
                iconColor="text-violet-600 dark:text-violet-400"
                title="Velocity Metrics"'''

if "home-velocity-metrics-panel" not in home:
    if old_wrapper not in home:
        raise RuntimeError(
            "Could not find the exact Velocity Metrics wrapper. No changes written."
        )
    home = home.replace(old_wrapper, new_wrapper, 1)

old_grid = '''              <div className="home-stat-grid grid grid-cols-1 md:grid-cols-2 gap-4">'''
new_grid = '''              <div className="home-velocity-stat-grid home-stat-grid grid grid-cols-1 md:grid-cols-2 gap-4">'''

if "home-velocity-stat-grid" not in home:
    if old_grid not in home:
        raise RuntimeError("Could not find Velocity Metrics grid. No changes written.")
    home = home.replace(old_grid, new_grid, 1)

# Remove old visual block if rerunning.
css = re.sub(
    r"/\* =========================================================\n"
    r"   HOME VELOCITY METRICS VISUAL STRIKE v2\n"
    r"   ========================================================= \*/\n"
    r".*?"
    r"/\* END HOME VELOCITY METRICS VISUAL STRIKE v2 \*/\n?",
    "",
    css,
    flags=re.DOTALL,
)

css_patch = r'''
/* =========================================================
   HOME VELOCITY METRICS VISUAL STRIKE v2
   Scoped polish for Home.jsx > Velocity Metrics.
   ========================================================= */

.home-velocity-metrics-panel {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: 1.75rem !important;
  border: 1px solid rgba(139, 92, 246, 0.22) !important;
  background:
    radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.13), transparent 34%),
    radial-gradient(circle at 92% 100%, rgba(45, 212, 191, 0.11), transparent 38%),
    rgba(255, 255, 255, 0.88) !important;
  box-shadow:
    0 22px 70px rgba(15, 23, 42, 0.10),
    inset 0 1px 0 rgba(255, 255, 255, 0.72) !important;
}

.home-velocity-metrics-panel::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  z-index: 1;
  height: 3px;
  background: linear-gradient(90deg, #8b5cf6 0%, #38bdf8 48%, #2dd4bf 100%);
  opacity: 0.95;
}

.home-velocity-metrics-panel::after {
  content: "";
  position: absolute;
  right: -6rem;
  bottom: -8rem;
  z-index: 0;
  width: 20rem;
  height: 20rem;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.20), transparent 66%);
  filter: blur(10px);
  pointer-events: none;
}

.home-velocity-metrics-panel > * {
  position: relative;
  z-index: 2;
}

html.dark .home-page .home-velocity-metrics-panel,
html[data-theme="dark"] .home-page .home-velocity-metrics-panel,
.dark .home-page .home-velocity-metrics-panel,
[data-theme="dark"] .home-page .home-velocity-metrics-panel {
  border-color: rgba(167, 139, 250, 0.24) !important;
  background:
    radial-gradient(circle at 0% 0%, rgba(139, 92, 246, 0.24), transparent 36%),
    radial-gradient(circle at 100% 100%, rgba(45, 212, 191, 0.16), transparent 40%),
    linear-gradient(135deg, rgba(17, 24, 39, 0.96), rgba(2, 6, 23, 0.96)) !important;
  box-shadow:
    0 26px 86px rgba(0, 0, 0, 0.42),
    0 0 44px rgba(139, 92, 246, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
}

/* Make header pop without touching other Home headers */
.home-velocity-metrics-panel h2,
.home-velocity-metrics-panel h3 {
  letter-spacing: -0.02em;
}

html.dark .home-page .home-velocity-metrics-panel h2,
html.dark .home-page .home-velocity-metrics-panel h3,
html[data-theme="dark"] .home-page .home-velocity-metrics-panel h2,
html[data-theme="dark"] .home-page .home-velocity-metrics-panel h3,
.dark .home-page .home-velocity-metrics-panel h2,
.dark .home-page .home-velocity-metrics-panel h3 {
  color: rgba(248, 250, 252, 0.98) !important;
  text-shadow: 0 0 24px rgba(167, 139, 250, 0.20);
}

/* Ships + Streak cards */
.home-velocity-stat-grid > * {
  position: relative;
  overflow: hidden;
  border-radius: 1.35rem !important;
  border: 1px solid rgba(148, 163, 184, 0.22) !important;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.72)) !important;
  box-shadow:
    0 16px 38px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.72) !important;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease;
}

.home-velocity-stat-grid > *::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 2px;
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.0), rgba(139, 92, 246, 0.85), rgba(45, 212, 191, 0.0));
  opacity: 0.85;
}

.home-velocity-stat-grid > *::after {
  content: "";
  position: absolute;
  right: -2.75rem;
  top: -2.75rem;
  width: 7rem;
  height: 7rem;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.18), transparent 64%);
  pointer-events: none;
}

.home-velocity-stat-grid > *:hover {
  transform: translateY(-2px);
  border-color: rgba(139, 92, 246, 0.34) !important;
  box-shadow:
    0 22px 48px rgba(15, 23, 42, 0.12),
    0 0 24px rgba(139, 92, 246, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
}

html.dark .home-page .home-velocity-stat-grid > *,
html[data-theme="dark"] .home-page .home-velocity-stat-grid > *,
.dark .home-page .home-velocity-stat-grid > *,
[data-theme="dark"] .home-page .home-velocity-stat-grid > * {
  border-color: rgba(148, 163, 184, 0.18) !important;
  background:
    radial-gradient(circle at 18% 18%, rgba(139, 92, 246, 0.20), transparent 34%),
    linear-gradient(135deg, rgba(30, 41, 59, 0.84), rgba(15, 23, 42, 0.78)) !important;
  box-shadow:
    0 18px 48px rgba(0, 0, 0, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.07) !important;
}

html.dark .home-page .home-velocity-stat-grid > *:nth-child(2),
html[data-theme="dark"] .home-page .home-velocity-stat-grid > *:nth-child(2),
.dark .home-page .home-velocity-stat-grid > *:nth-child(2),
[data-theme="dark"] .home-page .home-velocity-stat-grid > *:nth-child(2) {
  background:
    radial-gradient(circle at 18% 18%, rgba(251, 146, 60, 0.20), transparent 34%),
    radial-gradient(circle at 92% 88%, rgba(139, 92, 246, 0.20), transparent 36%),
    linear-gradient(135deg, rgba(30, 41, 59, 0.84), rgba(15, 23, 42, 0.78)) !important;
}

/* Make all stat card text readable in dark mode */
html.dark .home-page .home-velocity-stat-grid > * *,
html[data-theme="dark"] .home-page .home-velocity-stat-grid > * *,
.dark .home-page .home-velocity-stat-grid > * *,
[data-theme="dark"] .home-page .home-velocity-stat-grid > * * {
  color: rgba(226, 232, 240, 0.86);
}

/* Main numbers */
html.dark .home-page .home-velocity-stat-grid > *:first-child [class*="text-"],
html[data-theme="dark"] .home-page .home-velocity-stat-grid > *:first-child [class*="text-"],
.dark .home-page .home-velocity-stat-grid > *:first-child [class*="text-"],
[data-theme="dark"] .home-page .home-velocity-stat-grid > *:first-child [class*="text-"] {
  color: #c084fc !important;
  text-shadow: 0 0 24px rgba(192, 132, 252, 0.22);
}

html.dark .home-page .home-velocity-stat-grid > *:nth-child(2) [class*="text-"],
html[data-theme="dark"] .home-page .home-velocity-stat-grid > *:nth-child(2) [class*="text-"],
.dark .home-page .home-velocity-stat-grid > *:nth-child(2) [class*="text-"],
[data-theme="dark"] .home-page .home-velocity-stat-grid > *:nth-child(2) [class*="text-"] {
  color: #f59e0b !important;
  text-shadow: 0 0 24px rgba(245, 158, 11, 0.20);
}

/* Keep descriptions softer than the big values */
html.dark .home-page .home-velocity-stat-grid p,
html[data-theme="dark"] .home-page .home-velocity-stat-grid p,
.dark .home-page .home-velocity-stat-grid p,
[data-theme="dark"] .home-page .home-velocity-stat-grid p {
  color: rgba(203, 213, 225, 0.78) !important;
  text-shadow: none !important;
}

/* END HOME VELOCITY METRICS VISUAL STRIKE v2 */
'''

css = css.rstrip() + "\n\n" + css_patch.strip() + "\n"

# Safety checks
required_home = [
    "home-velocity-metrics-panel",
    "home-velocity-stat-grid",
    'title="Velocity Metrics"',
]

missing_home = [item for item in required_home if item not in home]

if missing_home:
    shutil.copy2(home_backup, home_path)
    shutil.copy2(css_backup, css_path)
    raise RuntimeError(f"Patch incomplete. Missing from Home.jsx: {missing_home}. Original restored.")

if "HOME VELOCITY METRICS VISUAL STRIKE v2" not in css:
    shutil.copy2(home_backup, home_path)
    shutil.copy2(css_backup, css_path)
    raise RuntimeError("Patch incomplete. CSS marker missing. Original restored.")

home_path.write_text(home)
css_path.write_text(css)

print("Home Velocity Metrics visual polish v2 applied successfully.")
print(f"Updated file: {home_path}")
print(f"Backup file:  {home_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Added home-velocity-metrics-panel to the real Velocity Metrics section")
print("- Added home-velocity-stat-grid to the real Ships/Streak grid")
print("- Added scoped visual CSS for the panel and stat cards")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No realtime logic changed.")
