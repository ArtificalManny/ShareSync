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
home_backup = home_path.with_suffix(home_path.suffix + f".backup-intelligence-visual-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-intelligence-visual-{stamp}")

shutil.copy2(home_path, home_backup)
shutil.copy2(css_path, css_backup)

home = home_path.read_text()
css = css_path.read_text()

# Locate the Intelligence section.
possible_titles = [
    'title="Intelligence"',
    "title='Intelligence'",
    "INTELLIGENCE",
    "Intelligence",
]

title_index = -1
for title in possible_titles:
    title_index = home.find(title)
    if title_index != -1:
        break

if title_index == -1:
    shutil.copy2(home_backup, home_path)
    raise RuntimeError(
        "Could not find the Intelligence section. No changes written.\n"
        "Run this and paste the output:\n"
        "grep -n -B 40 -A 120 \"Intelligence\\|INTELLIGENCE\" src/pages/Home.jsx"
    )

# Prefer the same sectionCardClasses wrapper pattern used by other Home panels.
if "home-intelligence-panel" not in home:
    before = home[:title_index]
    after = home[title_index:]

    pattern = re.compile(r"<div\s+className=\{sectionCardClasses\}([^>]*)>")
    matches = list(pattern.finditer(before))

    if matches:
        match = matches[-1]
        original = match.group(0)
        attrs = match.group(1)
        replacement = f'<div className={{`home-intelligence-panel ${{sectionCardClasses}}`}}{attrs}>'
        before = before[:match.start()] + replacement + before[match.end():]
        home = before + after
    else:
        # Fallback: add class to nearest card-like div before Intelligence.
        window_start = max(0, title_index - 5000)
        window = home[window_start:title_index]
        div_matches = list(re.finditer(r"<div\b[^>]*className=(?:\"[^\"]*\"|'[^']*'|\{[^}]*\})[^>]*>", window))

        best = None
        best_score = -999

        for m in div_matches:
            tag = m.group(0)
            tag_lower = tag.lower()

            score = 0
            if "rounded" in tag_lower:
                score += 3
            if "border" in tag_lower:
                score += 3
            if "shadow" in tag_lower:
                score += 2
            if "bg-" in tag_lower or "dark:bg" in tag_lower:
                score += 2
            if "sectioncardclasses" in tag_lower:
                score += 10

            # Penalize tiny icon/badge wrappers.
            if "w-4" in tag_lower or "h-4" in tag_lower:
                score -= 5
            if "w-5" in tag_lower or "h-5" in tag_lower:
                score -= 5
            if "w-6" in tag_lower or "h-6" in tag_lower:
                score -= 4
            if "items-center justify-center" in tag_lower:
                score -= 2

            if score > best_score:
                best = m
                best_score = score

        if best is None or best_score < 2:
            shutil.copy2(home_backup, home_path)
            raise RuntimeError(
                "Could not confidently find the Intelligence panel wrapper. No changes written.\n"
                "Run this and paste the output:\n"
                "grep -n -B 40 -A 120 \"Intelligence\\|INTELLIGENCE\" src/pages/Home.jsx"
            )

        absolute_start = window_start + best.start()
        absolute_end = window_start + best.end()
        opening = home[absolute_start:absolute_end]

        if 'className="' in opening:
            updated = opening.replace('className="', 'className="home-intelligence-panel ', 1)
        elif "className='" in opening:
            updated = opening.replace("className='", "className='home-intelligence-panel ", 1)
        elif "className={`" in opening:
            updated = opening.replace("className={`", "className={`home-intelligence-panel ", 1)
        elif re.search(r"className=\{([^{}\n]+)\}", opening):
            updated = re.sub(
                r"className=\{([^{}\n]+)\}",
                r'className={["home-intelligence-panel", \1].filter(Boolean).join(" ")}',
                opening,
                count=1,
            )
        else:
            shutil.copy2(home_backup, home_path)
            raise RuntimeError("Could not safely add Intelligence class. No changes written.")

        home = home[:absolute_start] + updated + home[absolute_end:]

# Remove older version if rerunning.
css = re.sub(
    r"/\* =========================================================\n"
    r"   HOME INTELLIGENCE PANEL VISUAL STRIKE\n"
    r"   ========================================================= \*/\n"
    r".*?"
    r"/\* END HOME INTELLIGENCE PANEL VISUAL STRIKE \*/\n?",
    "",
    css,
    flags=re.DOTALL,
)

css_patch = r'''
/* =========================================================
   HOME INTELLIGENCE PANEL VISUAL STRIKE
   Scoped polish for Home.jsx > Intelligence.
   ========================================================= */

.home-intelligence-panel {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: 1.75rem !important;
  border: 1px solid rgba(168, 85, 247, 0.20) !important;
  background:
    radial-gradient(circle at 0% 0%, rgba(168, 85, 247, 0.12), transparent 34%),
    radial-gradient(circle at 100% 90%, rgba(251, 146, 60, 0.10), transparent 38%),
    rgba(255, 255, 255, 0.92) !important;
  box-shadow:
    0 22px 70px rgba(15, 23, 42, 0.10),
    0 0 34px rgba(168, 85, 247, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.72) !important;
}

.home-intelligence-panel::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  z-index: 1;
  height: 3px;
  background: linear-gradient(90deg, #8b5cf6 0%, #f59e0b 48%, #38bdf8 100%);
  opacity: 0.95;
}

.home-intelligence-panel::after {
  content: "";
  position: absolute;
  right: -5rem;
  bottom: -7rem;
  z-index: 0;
  width: 18rem;
  height: 18rem;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.22), transparent 68%);
  filter: blur(10px);
  pointer-events: none;
}

.home-intelligence-panel > * {
  position: relative;
  z-index: 2;
}

html.dark .home-page .home-intelligence-panel,
html[data-theme="dark"] .home-page .home-intelligence-panel,
.dark .home-page .home-intelligence-panel,
[data-theme="dark"] .home-page .home-intelligence-panel {
  border-color: rgba(245, 158, 11, 0.30) !important;
  background:
    radial-gradient(circle at 0% 0%, rgba(168, 85, 247, 0.18), transparent 34%),
    radial-gradient(circle at 100% 100%, rgba(245, 158, 11, 0.18), transparent 40%),
    linear-gradient(135deg, rgba(24, 24, 27, 0.96), rgba(2, 6, 23, 0.96)) !important;
  box-shadow:
    0 26px 90px rgba(0, 0, 0, 0.42),
    0 0 46px rgba(168, 85, 247, 0.12),
    0 0 58px rgba(245, 158, 11, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
}

/* Intelligence title */
html.dark .home-page .home-intelligence-panel h2,
html.dark .home-page .home-intelligence-panel h3,
html.dark .home-page .home-intelligence-panel h4,
html[data-theme="dark"] .home-page .home-intelligence-panel h2,
html[data-theme="dark"] .home-page .home-intelligence-panel h3,
html[data-theme="dark"] .home-page .home-intelligence-panel h4,
.dark .home-page .home-intelligence-panel h2,
.dark .home-page .home-intelligence-panel h3,
.dark .home-page .home-intelligence-panel h4 {
  color: rgba(248, 250, 252, 0.98) !important;
  text-shadow: 0 0 24px rgba(168, 85, 247, 0.18);
}

/* Inner readout cards */
.home-intelligence-panel [class*="rounded"] {
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease;
}

html.dark .home-page .home-intelligence-panel [class*="rounded"],
html[data-theme="dark"] .home-page .home-intelligence-panel [class*="rounded"],
.dark .home-page .home-intelligence-panel [class*="rounded"],
[data-theme="dark"] .home-page .home-intelligence-panel [class*="rounded"] {
  border-color: rgba(148, 163, 184, 0.18) !important;
  background:
    radial-gradient(circle at 0% 0%, rgba(245, 158, 11, 0.10), transparent 36%),
    linear-gradient(135deg, rgba(30, 41, 59, 0.72), rgba(15, 23, 42, 0.78)) !important;
  box-shadow:
    0 14px 42px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
}

/* Make warning/high-workload style cards feel intentional */
html.dark .home-page .home-intelligence-panel [class*="amber"],
html.dark .home-page .home-intelligence-panel [class*="orange"],
html[data-theme="dark"] .home-page .home-intelligence-panel [class*="amber"],
html[data-theme="dark"] .home-page .home-intelligence-panel [class*="orange"],
.dark .home-page .home-intelligence-panel [class*="amber"],
.dark .home-page .home-intelligence-panel [class*="orange"] {
  color: #f59e0b !important;
  text-shadow:
    0 0 18px rgba(245, 158, 11, 0.24),
    0 0 34px rgba(245, 158, 11, 0.10);
}

/* Text clarity in dark mode */
html.dark .home-page .home-intelligence-panel p,
html.dark .home-page .home-intelligence-panel span,
html[data-theme="dark"] .home-page .home-intelligence-panel p,
html[data-theme="dark"] .home-page .home-intelligence-panel span,
.dark .home-page .home-intelligence-panel p,
.dark .home-page .home-intelligence-panel span,
[data-theme="dark"] .home-page .home-intelligence-panel p,
[data-theme="dark"] .home-page .home-intelligence-panel span {
  color: rgba(226, 232, 240, 0.84);
}

/* Stronger emphasis for key values like Peak Window */
html.dark .home-page .home-intelligence-panel strong,
html.dark .home-page .home-intelligence-panel b,
html[data-theme="dark"] .home-page .home-intelligence-panel strong,
html[data-theme="dark"] .home-page .home-intelligence-panel b,
.dark .home-page .home-intelligence-panel strong,
.dark .home-page .home-intelligence-panel b {
  color: rgba(248, 250, 252, 0.98) !important;
  text-shadow: 0 0 22px rgba(139, 92, 246, 0.18);
}

/* Hover lift for the whole intelligence module */
.home-intelligence-panel:hover {
  transform: translateY(-2px);
  border-color: rgba(168, 85, 247, 0.34) !important;
  box-shadow:
    0 28px 90px rgba(15, 23, 42, 0.14),
    0 0 42px rgba(168, 85, 247, 0.12),
    0 0 44px rgba(245, 158, 11, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.76) !important;
}

html.dark .home-page .home-intelligence-panel:hover,
html[data-theme="dark"] .home-page .home-intelligence-panel:hover,
.dark .home-page .home-intelligence-panel:hover,
[data-theme="dark"] .home-page .home-intelligence-panel:hover {
  box-shadow:
    0 30px 96px rgba(0, 0, 0, 0.48),
    0 0 56px rgba(168, 85, 247, 0.16),
    0 0 64px rgba(245, 158, 11, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.09) !important;
}

/* END HOME INTELLIGENCE PANEL VISUAL STRIKE */
'''

css = css.rstrip() + "\n\n" + css_patch.strip() + "\n"

# Safety checks.
unsafe_regexes = [
    (r"onClick=\{\(\)\s*=(?!>)", "malformed onClick arrow"),
    (r"className=\{className=\{", "double className corruption"),
]

for pattern, label in unsafe_regexes:
    if re.search(pattern, home):
        shutil.copy2(home_backup, home_path)
        shutil.copy2(css_backup, css_path)
        raise RuntimeError(f"Unsafe pattern detected: {label}. Original restored.")

if "home-intelligence-panel" not in home:
    shutil.copy2(home_backup, home_path)
    shutil.copy2(css_backup, css_path)
    raise RuntimeError("Patch failed. Missing home-intelligence-panel. Original restored.")

if "HOME INTELLIGENCE PANEL VISUAL STRIKE" not in css:
    shutil.copy2(home_backup, home_path)
    shutil.copy2(css_backup, css_path)
    raise RuntimeError("Patch failed. Missing CSS marker. Original restored.")

home_path.write_text(home)
css_path.write_text(css)

print("Home Intelligence visual polish applied successfully.")
print(f"Updated file: {home_path}")
print(f"Backup file:  {home_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Added home-intelligence-panel to the real Intelligence section")
print("- Added scoped CSS for the Intelligence panel")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No intelligence logic changed.")
