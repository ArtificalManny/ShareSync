from pathlib import Path
from datetime import datetime
import shutil
import re

jsx_path = Path("src/components/social/StreakComparison.jsx")
css_path = Path("src/index.css")

if not jsx_path.exists():
    raise FileNotFoundError("Could not find src/components/social/StreakComparison.jsx")

if not css_path.exists():
    raise FileNotFoundError("Could not find src/index.css")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
jsx_backup = jsx_path.with_suffix(jsx_path.suffix + f".backup-streak-visual-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-streak-visual-{stamp}")

shutil.copy2(jsx_path, jsx_backup)
shutil.copy2(css_path, css_backup)

jsx = jsx_path.read_text()
css = css_path.read_text()

# Add one scoped class to the real StreakComparison outer card.
if "streak-comparison-card" not in jsx:
    markers = [
        "export default function StreakComparison",
        "function StreakComparison",
        "const StreakComparison",
    ]

    start = -1
    for marker in markers:
        found = jsx.find(marker)
        if found != -1:
            start = found
            break

    if start == -1:
        shutil.copy2(jsx_backup, jsx_path)
        raise RuntimeError(
            "Could not find StreakComparison component. No changes written.\n"
            "Run this and paste the output:\n"
            "grep -n \"StreakComparison\\|return (\\|className\" src/components/social/StreakComparison.jsx"
        )

    return_pos = jsx.find("return", start)
    if return_pos == -1:
        shutil.copy2(jsx_backup, jsx_path)
        raise RuntimeError("Could not find return inside StreakComparison. No changes written.")

    search_window = jsx[return_pos:return_pos + 3500]
    tag_match = re.search(r"<(div|section|article)\b", search_window)

    if not tag_match:
        shutil.copy2(jsx_backup, jsx_path)
        raise RuntimeError(
            "Could not find outer div/section/article after StreakComparison return. No changes written."
        )

    tag_start = return_pos + tag_match.start()
    tag_end = jsx.find(">", tag_start)

    if tag_end == -1:
        shutil.copy2(jsx_backup, jsx_path)
        raise RuntimeError("Could not find end of StreakComparison opening tag. No changes written.")

    opening = jsx[tag_start:tag_end]

    updated_opening = opening

    if 'className={`' in opening:
        updated_opening = opening.replace('className={`', 'className={`streak-comparison-card ', 1)
    elif 'className="' in opening:
        updated_opening = opening.replace('className="', 'className="streak-comparison-card ', 1)
    elif "className='" in opening:
        updated_opening = opening.replace("className='", "className='streak-comparison-card ", 1)
    elif re.search(r"className=\{[^{}\n]+\}", opening):
        updated_opening = re.sub(
            r"className=\{([^{}\n]+)\}",
            r'className={["streak-comparison-card", \1].filter(Boolean).join(" ")}',
            opening,
            count=1,
        )
    else:
        updated_opening = opening.replace(
            tag_match.group(0),
            f'{tag_match.group(0)} className="streak-comparison-card"',
            1,
        )

    if updated_opening == opening:
        shutil.copy2(jsx_backup, jsx_path)
        raise RuntimeError("Could not safely add streak-comparison-card class. No changes written.")

    jsx = jsx[:tag_start] + updated_opening + jsx[tag_end:]

# Remove old block if rerunning.
css = re.sub(
    r"/\* =========================================================\n"
    r"   STREAK COMPARISON VISUAL STRIKE\n"
    r"   ========================================================= \*/\n"
    r".*?"
    r"/\* END STREAK COMPARISON VISUAL STRIKE \*/\n?",
    "",
    css,
    flags=re.DOTALL,
)

css_patch = r'''
/* =========================================================
   STREAK COMPARISON VISUAL STRIKE
   Scoped polish for src/components/social/StreakComparison.jsx
   ========================================================= */

.streak-comparison-card {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: 1.45rem !important;
  border: 1px solid rgba(251, 146, 60, 0.24) !important;
  background:
    radial-gradient(circle at 0% 0%, rgba(251, 146, 60, 0.14), transparent 34%),
    radial-gradient(circle at 100% 100%, rgba(139, 92, 246, 0.13), transparent 38%),
    rgba(255, 255, 255, 0.92) !important;
  box-shadow:
    0 22px 70px rgba(15, 23, 42, 0.10),
    0 0 34px rgba(251, 146, 60, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.74) !important;
}

.streak-comparison-card::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  z-index: 1;
  background: linear-gradient(90deg, #fb923c 0%, #a855f7 58%, #38bdf8 100%);
  opacity: 0.96;
}

.streak-comparison-card::after {
  content: "";
  position: absolute;
  right: -5rem;
  bottom: -6rem;
  width: 16rem;
  height: 16rem;
  z-index: 0;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(251, 146, 60, 0.22), transparent 68%);
  filter: blur(10px);
  pointer-events: none;
}

.streak-comparison-card > * {
  position: relative;
  z-index: 2;
}

html.dark .streak-comparison-card,
html[data-theme="dark"] .streak-comparison-card,
.dark .streak-comparison-card,
[data-theme="dark"] .streak-comparison-card {
  border-color: rgba(251, 146, 60, 0.35) !important;
  background:
    radial-gradient(circle at 0% 0%, rgba(251, 146, 60, 0.22), transparent 35%),
    radial-gradient(circle at 100% 100%, rgba(139, 92, 246, 0.24), transparent 42%),
    linear-gradient(135deg, rgba(24, 24, 27, 0.96), rgba(15, 23, 42, 0.94)) !important;
  box-shadow:
    0 26px 90px rgba(0, 0, 0, 0.42),
    0 0 42px rgba(251, 146, 60, 0.12),
    0 0 60px rgba(139, 92, 246, 0.10),
    inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
}

/* Header and body text */
html.dark .streak-comparison-card h2,
html.dark .streak-comparison-card h3,
html.dark .streak-comparison-card h4,
html[data-theme="dark"] .streak-comparison-card h2,
html[data-theme="dark"] .streak-comparison-card h3,
html[data-theme="dark"] .streak-comparison-card h4,
.dark .streak-comparison-card h2,
.dark .streak-comparison-card h3,
.dark .streak-comparison-card h4 {
  color: rgba(248, 250, 252, 0.98) !important;
  text-shadow: 0 0 24px rgba(251, 146, 60, 0.14);
}

html.dark .streak-comparison-card p,
html.dark .streak-comparison-card span,
html[data-theme="dark"] .streak-comparison-card p,
html[data-theme="dark"] .streak-comparison-card span,
.dark .streak-comparison-card p,
.dark .streak-comparison-card span {
  color: rgba(226, 232, 240, 0.86);
}

/* Make the main streak number feel like the hero stat */
html.dark .streak-comparison-card [class*="text-orange"],
html.dark .streak-comparison-card [class*="text-amber"],
html[data-theme="dark"] .streak-comparison-card [class*="text-orange"],
html[data-theme="dark"] .streak-comparison-card [class*="text-amber"],
.dark .streak-comparison-card [class*="text-orange"],
.dark .streak-comparison-card [class*="text-amber"] {
  color: #fb923c !important;
  text-shadow:
    0 0 18px rgba(251, 146, 60, 0.24),
    0 0 34px rgba(251, 146, 60, 0.12);
}

/* Progress bars should glow instead of looking flat */
.streak-comparison-card [class*="bg-violet"],
.streak-comparison-card [class*="bg-purple"] {
  box-shadow: 0 0 22px rgba(139, 92, 246, 0.24);
}

html.dark .streak-comparison-card [class*="bg-violet"],
html.dark .streak-comparison-card [class*="bg-purple"],
html[data-theme="dark"] .streak-comparison-card [class*="bg-violet"],
html[data-theme="dark"] .streak-comparison-card [class*="bg-purple"],
.dark .streak-comparison-card [class*="bg-violet"],
.dark .streak-comparison-card [class*="bg-purple"] {
  box-shadow:
    0 0 18px rgba(139, 92, 246, 0.34),
    0 0 34px rgba(139, 92, 246, 0.16);
}

/* Bottom status callout */
.streak-comparison-card > div:last-child {
  border-radius: 1rem !important;
}

html.dark .streak-comparison-card > div:last-child,
html[data-theme="dark"] .streak-comparison-card > div:last-child,
.dark .streak-comparison-card > div:last-child {
  background:
    linear-gradient(135deg, rgba(251, 146, 60, 0.12), rgba(139, 92, 246, 0.16)) !important;
  border-color: rgba(251, 146, 60, 0.20) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

/* Subtle hover lift */
.streak-comparison-card {
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease;
}

.streak-comparison-card:hover {
  transform: translateY(-2px);
  border-color: rgba(251, 146, 60, 0.42) !important;
  box-shadow:
    0 28px 90px rgba(15, 23, 42, 0.14),
    0 0 42px rgba(251, 146, 60, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.76) !important;
}

html.dark .streak-comparison-card:hover,
html[data-theme="dark"] .streak-comparison-card:hover,
.dark .streak-comparison-card:hover {
  box-shadow:
    0 30px 96px rgba(0, 0, 0, 0.48),
    0 0 52px rgba(251, 146, 60, 0.16),
    0 0 68px rgba(139, 92, 246, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.09) !important;
}

/* END STREAK COMPARISON VISUAL STRIKE */
'''

css = css.rstrip() + "\n\n" + css_patch.strip() + "\n"

# Safety checks.
unsafe_regexes = [
    (r"onClick=\{\(\)\s*=(?!>)", "malformed onClick arrow"),
    (r"className=\{className=\{", "double className corruption"),
]

for pattern, label in unsafe_regexes:
    if re.search(pattern, jsx):
        shutil.copy2(jsx_backup, jsx_path)
        shutil.copy2(css_backup, css_path)
        raise RuntimeError(f"Unsafe pattern detected: {label}. Original restored.")

if "streak-comparison-card" not in jsx:
    shutil.copy2(jsx_backup, jsx_path)
    shutil.copy2(css_backup, css_path)
    raise RuntimeError("Patch failed. Missing streak-comparison-card. Original restored.")

if "STREAK COMPARISON VISUAL STRIKE" not in css:
    shutil.copy2(jsx_backup, jsx_path)
    shutil.copy2(css_backup, css_path)
    raise RuntimeError("Patch failed. Missing CSS marker. Original restored.")

jsx_path.write_text(jsx)
css_path.write_text(css)

print("StreakComparison visual polish applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Added one scoped class to the StreakComparison card")
print("- Added scoped CSS to make Your Streak more visually striking")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No streak calculation logic changed.")
