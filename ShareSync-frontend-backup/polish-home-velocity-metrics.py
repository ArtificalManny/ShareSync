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
home_backup = home_path.with_suffix(home_path.suffix + f".backup-velocity-visual-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-velocity-visual-{stamp}")

shutil.copy2(home_path, home_backup)
shutil.copy2(css_path, css_backup)

home = home_path.read_text()
css = css_path.read_text()

if "Velocity Metrics" not in home:
    raise RuntimeError("Could not find 'Velocity Metrics' in Home.jsx. No changes written.")

# Find the line containing Velocity Metrics.
lines = home.splitlines()
velocity_line_index = None

for i, line in enumerate(lines):
    if "Velocity Metrics" in line:
        velocity_line_index = i
        break

if velocity_line_index is None:
    raise RuntimeError("Could not locate Velocity Metrics line. No changes written.")

# Walk upward to find the nearest likely outer panel/card wrapper.
candidate_index = None

for i in range(velocity_line_index, max(-1, velocity_line_index - 80), -1):
    line = lines[i]
    lower = line.lower()

    if "classname" not in lower:
        continue

    # We want the actual card/panel shell, not a tiny icon/badge.
    looks_like_panel = (
        ("rounded" in lower or "card" in lower)
        and ("border" in lower or "shadow" in lower or "bg-" in lower or "dark:bg" in lower)
    )

    looks_tiny = (
        "w-4" in lower
        or "h-4" in lower
        or "w-5" in lower
        or "h-5" in lower
        or "icon" in lower
        or "badge" in lower
    )

    if looks_like_panel and not looks_tiny:
        candidate_index = i
        break

if candidate_index is None:
    shutil.copy2(home_backup, home_path)
    raise RuntimeError(
        "Could not confidently find the Velocity Metrics panel wrapper. No changes written.\n"
        "Run this and paste the output:\n"
        "grep -n -B 30 -A 80 \"Velocity Metrics\" src/pages/Home.jsx"
    )

line = lines[candidate_index]

if "home-velocity-metrics-panel" not in home:
    if 'className="' in line:
        lines[candidate_index] = line.replace(
            'className="',
            'className="home-velocity-metrics-panel ',
            1
        )
    elif "className={`" in line:
        lines[candidate_index] = line.replace(
            "className={`",
            "className={`home-velocity-metrics-panel ",
            1
        )
    elif "className={'" in line:
        lines[candidate_index] = line.replace(
            "className={'",
            "className={'home-velocity-metrics-panel ",
            1
        )
    else:
        shutil.copy2(home_backup, home_path)
        raise RuntimeError(
            "Found likely Velocity Metrics wrapper, but its className format was unusual. No changes written.\n"
            "Run this and paste the output:\n"
            "grep -n -B 30 -A 80 \"Velocity Metrics\" src/pages/Home.jsx"
        )

home = "\n".join(lines) + ("\n" if home.endswith("\n") else "")

# Remove older version of this specific CSS block if rerunning.
css = re.sub(
    r"/\* =========================================================\n"
    r"   Home Velocity Metrics visual polish\n"
    r"   ========================================================= \*/\n"
    r".*?"
    r"/\* ===== End Home Velocity Metrics visual polish ===== \*/\n?",
    "",
    css,
    flags=re.DOTALL,
)

velocity_css = r'''
/* =========================================================
   Home Velocity Metrics visual polish
   ========================================================= */

.home-velocity-metrics-panel {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: 1.35rem !important;
  border: 1px solid rgba(168, 85, 247, 0.18) !important;
  background:
    radial-gradient(circle at 8% 0%, rgba(168, 85, 247, 0.10), transparent 34%),
    radial-gradient(circle at 92% 100%, rgba(20, 184, 166, 0.10), transparent 36%),
    rgba(255, 255, 255, 0.84) !important;
  box-shadow:
    0 22px 70px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.72) !important;
}

.home-velocity-metrics-panel::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  z-index: 1;
  background: linear-gradient(
    90deg,
    #8b5cf6 0%,
    #38bdf8 42%,
    #2dd4bf 100%
  );
  opacity: 0.92;
}

.home-velocity-metrics-panel::after {
  content: "";
  position: absolute;
  width: 17rem;
  height: 17rem;
  right: -5rem;
  bottom: -8rem;
  z-index: -1;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.20), transparent 68%);
  filter: blur(8px);
}

.dark .home-velocity-metrics-panel {
  border-color: rgba(148, 163, 184, 0.18) !important;
  background:
    radial-gradient(circle at 0% 0%, rgba(139, 92, 246, 0.18), transparent 34%),
    radial-gradient(circle at 100% 100%, rgba(20, 184, 166, 0.14), transparent 38%),
    linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.96)) !important;
  box-shadow:
    0 24px 90px rgba(0, 0, 0, 0.34),
    0 0 42px rgba(139, 92, 246, 0.10),
    inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
}

/* Header/title inside Velocity Metrics */
.home-velocity-metrics-panel h2,
.home-velocity-metrics-panel h3,
.home-velocity-metrics-panel [class*="Velocity"] {
  color: rgb(15, 23, 42) !important;
}

.dark .home-velocity-metrics-panel h2,
.dark .home-velocity-metrics-panel h3 {
  color: rgba(248, 250, 252, 0.96) !important;
}

/* The two metric cards: Ships + Streak */
.home-velocity-metrics-panel [class*="grid"] > * {
  position: relative;
  overflow: hidden;
  border-radius: 1.1rem !important;
  border: 1px solid rgba(148, 163, 184, 0.22) !important;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 252, 0.72)) !important;
  box-shadow:
    0 14px 34px rgba(15, 23, 42, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 0.72) !important;
}

.dark .home-velocity-metrics-panel [class*="grid"] > * {
  border-color: rgba(148, 163, 184, 0.18) !important;
  background:
    radial-gradient(circle at 18% 18%, rgba(139, 92, 246, 0.18), transparent 34%),
    linear-gradient(135deg, rgba(30, 41, 59, 0.82), rgba(15, 23, 42, 0.78)) !important;
  box-shadow:
    0 18px 46px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
}

.dark .home-velocity-metrics-panel [class*="grid"] > *:nth-child(2) {
  background:
    radial-gradient(circle at 18% 18%, rgba(251, 146, 60, 0.18), transparent 34%),
    radial-gradient(circle at 88% 88%, rgba(139, 92, 246, 0.20), transparent 36%),
    linear-gradient(135deg, rgba(30, 41, 59, 0.82), rgba(15, 23, 42, 0.78)) !important;
}

/* Big numbers */
.home-velocity-metrics-panel [class*="grid"] > * *:first-child {
  text-shadow: 0 10px 30px rgba(139, 92, 246, 0.18);
}

.dark .home-velocity-metrics-panel [class*="grid"] > * {
  color: rgba(248, 250, 252, 0.95) !important;
}

.dark .home-velocity-metrics-panel [class*="grid"] > * * {
  color: inherit;
}

.dark .home-velocity-metrics-panel [class*="grid"] > *:first-child *:first-child {
  color: #c084fc !important;
}

.dark .home-velocity-metrics-panel [class*="grid"] > *:nth-child(2) *:first-child {
  color: #f59e0b !important;
}

/* Labels/descriptions */
.dark .home-velocity-metrics-panel p,
.dark .home-velocity-metrics-panel span {
  color: rgba(226, 232, 240, 0.82);
}

/* Live badge polish if it lives inside this panel */
.home-velocity-metrics-panel [class*="LIVE"],
.home-velocity-metrics-panel [class*="Live"],
.home-velocity-metrics-panel [class*="live"] {
  backdrop-filter: blur(14px);
}

/* ===== End Home Velocity Metrics visual polish ===== */
'''

css = css.rstrip() + "\n\n" + velocity_css.lstrip()

# Safety checks.
bad_patterns = [
    "onClick={() =",
    "className={className={",
    "undefined undefined",
]

for bad in bad_patterns:
    if bad in home:
        shutil.copy2(home_backup, home_path)
        shutil.copy2(css_backup, css_path)
        raise RuntimeError(f"Unsafe pattern detected: {bad}. Original restored.")

if "home-velocity-metrics-panel" not in home:
    shutil.copy2(home_backup, home_path)
    shutil.copy2(css_backup, css_path)
    raise RuntimeError("Patch verification failed. Missing home-velocity-metrics-panel. Original restored.")

home_path.write_text(home)
css_path.write_text(css)

print("Velocity Metrics visual polish applied successfully.")
print(f"Updated file: {home_path}")
print(f"Backup file:  {home_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Added one scoped class to the Velocity Metrics panel")
print("- Added scoped CSS for the Velocity Metrics shell and metric cards")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No realtime metric logic changed.")
