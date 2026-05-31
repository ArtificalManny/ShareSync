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
home_backup = home_path.with_suffix(home_path.suffix + f".backup-suggested-missions-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-suggested-missions-{stamp}")

shutil.copy2(home_path, home_backup)
shutil.copy2(css_path, css_backup)

home = home_path.read_text()
css = css_path.read_text()

# Add scoped class to the real Suggested Projects & Missions panel.
if "home-suggested-missions-panel" not in home:
    title_marker = 'title="Suggested Projects & Missions"'
    title_index = home.find(title_marker)

    if title_index == -1:
        shutil.copy2(home_backup, home_path)
        raise RuntimeError(
            "Could not find Suggested Projects & Missions title. No changes written.\n"
            "Run this and paste the output:\n"
            "grep -n -B 40 -A 120 \"Suggested Projects & Missions\" src/pages/Home.jsx"
        )

    # This is the exact wrapper pattern shown in your Home.jsx around the missions panel.
    old = '''          <div
            className={`
              ${sectionCardClasses}
              transition-all duration-300'''

    new = '''          <div
            className={`
              home-suggested-missions-panel
              ${sectionCardClasses}
              transition-all duration-300'''

    # Only patch the wrapper before the title marker.
    before = home[:title_index]
    after = home[title_index:]

    if old not in before:
        shutil.copy2(home_backup, home_path)
        raise RuntimeError(
            "Could not find the Suggested Projects wrapper before the title. No changes written.\n"
            "Run this and paste the output:\n"
            "grep -n -B 50 -A 80 \"Suggested Projects & Missions\" src/pages/Home.jsx"
        )

    before = before.replace(old, new, 1)
    home = before + after

# Remove older version if rerunning.
css = re.sub(
    r"/\* =========================================================\n"
    r"   HOME SUGGESTED MISSIONS VISUAL STRIKE\n"
    r"   ========================================================= \*/\n"
    r".*?"
    r"/\* END HOME SUGGESTED MISSIONS VISUAL STRIKE \*/\n?",
    "",
    css,
    flags=re.DOTALL,
)

css_patch = r'''
/* =========================================================
   HOME SUGGESTED MISSIONS VISUAL STRIKE
   Scoped polish for Home.jsx > Suggested Projects & Missions.
   ========================================================= */

.home-suggested-missions-panel {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: 1.65rem !important;
  border: 1px solid rgba(139, 92, 246, 0.22) !important;
  background:
    radial-gradient(circle at 0% 0%, rgba(139, 92, 246, 0.12), transparent 36%),
    radial-gradient(circle at 100% 100%, rgba(45, 212, 191, 0.10), transparent 40%),
    rgba(255, 255, 255, 0.94) !important;
  box-shadow:
    0 24px 70px rgba(15, 23, 42, 0.10),
    0 0 34px rgba(139, 92, 246, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
}

.home-suggested-missions-panel::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  z-index: 1;
  background: linear-gradient(90deg, #8b5cf6 0%, #22d3ee 48%, #34d399 100%);
  opacity: 0.98;
}

.home-suggested-missions-panel::after {
  content: "";
  position: absolute;
  right: -5rem;
  bottom: -7rem;
  width: 18rem;
  height: 18rem;
  z-index: 0;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(34, 211, 238, 0.18), transparent 68%);
  filter: blur(12px);
  pointer-events: none;
}

.home-suggested-missions-panel > * {
  position: relative;
  z-index: 2;
}

/* Dark mode shell */
html.dark .home-suggested-missions-panel,
html[data-theme="dark"] .home-suggested-missions-panel,
.dark .home-suggested-missions-panel,
[data-theme="dark"] .home-suggested-missions-panel {
  border-color: rgba(139, 92, 246, 0.38) !important;
  background:
    radial-gradient(circle at 0% 0%, rgba(139, 92, 246, 0.20), transparent 38%),
    radial-gradient(circle at 100% 100%, rgba(34, 211, 238, 0.16), transparent 42%),
    linear-gradient(135deg, rgba(24, 24, 27, 0.97), rgba(2, 6, 23, 0.97)) !important;
  box-shadow:
    0 28px 90px rgba(0, 0, 0, 0.46),
    0 0 54px rgba(139, 92, 246, 0.14),
    0 0 58px rgba(34, 211, 238, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
}

/* Header clarity */
html.dark .home-suggested-missions-panel h1,
html.dark .home-suggested-missions-panel h2,
html.dark .home-suggested-missions-panel h3,
html.dark .home-suggested-missions-panel h4,
html[data-theme="dark"] .home-suggested-missions-panel h1,
html[data-theme="dark"] .home-suggested-missions-panel h2,
html[data-theme="dark"] .home-suggested-missions-panel h3,
html[data-theme="dark"] .home-suggested-missions-panel h4,
.dark .home-suggested-missions-panel h1,
.dark .home-suggested-missions-panel h2,
.dark .home-suggested-missions-panel h3,
.dark .home-suggested-missions-panel h4 {
  color: rgba(248, 250, 252, 0.98) !important;
  text-shadow: 0 0 22px rgba(139, 92, 246, 0.18);
}

html.dark .home-suggested-missions-panel p,
html.dark .home-suggested-missions-panel span,
html[data-theme="dark"] .home-suggested-missions-panel p,
html[data-theme="dark"] .home-suggested-missions-panel span,
.dark .home-suggested-missions-panel p,
.dark .home-suggested-missions-panel span {
  color: rgba(226, 232, 240, 0.86) !important;
}

/* Mission rows inside the panel */
.home-suggested-missions-panel .space-y-3 > div {
  border-radius: 1.15rem;
}

html.dark .home-suggested-missions-panel .space-y-3 > div,
html[data-theme="dark"] .home-suggested-missions-panel .space-y-3 > div,
.dark .home-suggested-missions-panel .space-y-3 > div,
[data-theme="dark"] .home-suggested-missions-panel .space-y-3 > div {
  background:
    linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(34, 211, 238, 0.08)) !important;
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow:
    0 16px 44px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

/* Inner mission card polish without touching other Home modules */
html.dark .home-suggested-missions-panel .space-y-3 > div > *,
html[data-theme="dark"] .home-suggested-missions-panel .space-y-3 > div > *,
.dark .home-suggested-missions-panel .space-y-3 > div > *,
[data-theme="dark"] .home-suggested-missions-panel .space-y-3 > div > * {
  border-color: rgba(148, 163, 184, 0.18) !important;
}

/* Progress / momentum accents */
.home-suggested-missions-panel [class*="bg-violet"],
.home-suggested-missions-panel [class*="bg-purple"] {
  box-shadow: 0 0 22px rgba(139, 92, 246, 0.24);
}

html.dark .home-suggested-missions-panel [class*="bg-violet"],
html.dark .home-suggested-missions-panel [class*="bg-purple"],
html[data-theme="dark"] .home-suggested-missions-panel [class*="bg-violet"],
html[data-theme="dark"] .home-suggested-missions-panel [class*="bg-purple"],
.dark .home-suggested-missions-panel [class*="bg-violet"],
.dark .home-suggested-missions-panel [class*="bg-purple"] {
  box-shadow:
    0 0 20px rgba(139, 92, 246, 0.36),
    0 0 38px rgba(139, 92, 246, 0.16);
}

/* Ship button / action text */
html.dark .home-suggested-missions-panel button,
html.dark .home-suggested-missions-panel a,
html[data-theme="dark"] .home-suggested-missions-panel button,
html[data-theme="dark"] .home-suggested-missions-panel a,
.dark .home-suggested-missions-panel button,
.dark .home-suggested-missions-panel a {
  color: rgba(248, 250, 252, 0.92);
}

/* Hover lift */
.home-suggested-missions-panel {
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease;
}

.home-suggested-missions-panel:hover {
  transform: translateY(-2px);
  border-color: rgba(139, 92, 246, 0.40) !important;
  box-shadow:
    0 30px 90px rgba(15, 23, 42, 0.14),
    0 0 48px rgba(139, 92, 246, 0.12),
    0 0 44px rgba(34, 211, 238, 0.10),
    inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
}

html.dark .home-suggested-missions-panel:hover,
html[data-theme="dark"] .home-suggested-missions-panel:hover,
.dark .home-suggested-missions-panel:hover,
[data-theme="dark"] .home-suggested-missions-panel:hover {
  box-shadow:
    0 32px 100px rgba(0, 0, 0, 0.52),
    0 0 62px rgba(139, 92, 246, 0.18),
    0 0 64px rgba(34, 211, 238, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.09) !important;
}

/* END HOME SUGGESTED MISSIONS VISUAL STRIKE */
'''

css = css.rstrip() + "\n\n" + css_patch.strip() + "\n"

unsafe_regexes = [
    (r"onClick=\{\(\)\s*=(?!>)", "malformed onClick arrow"),
    (r"className=\{className=\{", "double className corruption"),
]

for pattern, label in unsafe_regexes:
    if re.search(pattern, home):
        shutil.copy2(home_backup, home_path)
        shutil.copy2(css_backup, css_path)
        raise RuntimeError(f"Unsafe pattern detected: {label}. Original restored.")

if "home-suggested-missions-panel" not in home:
    shutil.copy2(home_backup, home_path)
    shutil.copy2(css_backup, css_path)
    raise RuntimeError("Patch failed. Missing home-suggested-missions-panel. Original restored.")

if "HOME SUGGESTED MISSIONS VISUAL STRIKE" not in css:
    shutil.copy2(home_backup, home_path)
    shutil.copy2(css_backup, css_path)
    raise RuntimeError("Patch failed. Missing CSS marker. Original restored.")

home_path.write_text(home)
css_path.write_text(css)

print("Suggested Projects & Missions visual polish applied successfully.")
print(f"Updated file: {home_path}")
print(f"Backup file:  {home_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Added home-suggested-missions-panel to the real Suggested Projects & Missions panel")
print("- Added scoped CSS for Suggested Projects & Missions visual polish")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No home API helper logic changed.")
print("No mission ship/fetch logic changed.")
