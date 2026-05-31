from pathlib import Path
from datetime import datetime
import shutil

jsx_path = Path("src/pages/ProjectHome.jsx")
css_path = Path("src/index.css")

if not jsx_path.exists():
    raise FileNotFoundError(f"Missing file: {jsx_path}")

if not css_path.exists():
    raise FileNotFoundError(f"Missing file: {css_path}")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")

jsx_original = jsx_path.read_text()
css_original = css_path.read_text()

jsx_backup = jsx_path.with_suffix(jsx_path.suffix + f".backup-overview-pulse-dark-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-overview-pulse-dark-{stamp}")

shutil.copy2(jsx_path, jsx_backup)
shutil.copy2(css_path, css_backup)

jsx = jsx_original
css = css_original

# Verify we are patching the right component.
required = [
    "function OverviewPulseCard({ pulse })",
    'label: "Today"',
    'label: "In motion"',
    'label: "Ready"',
]

missing = [item for item in required if item not in jsx]
if missing:
    raise RuntimeError(f"Could not verify OverviewPulseCard structure. Missing: {missing}. No changes written.")

old = '''              className="rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-zinc-900/50 px-4 py-3"'''

new = '''              className={`overview-pulse-signal-card overview-pulse-${String(item.label).toLowerCase().replace(/\\s+/g, "-")} rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-zinc-900/50 px-4 py-3`}'''

if "overview-pulse-signal-card" not in jsx:
    if old not in jsx:
        raise RuntimeError(
            "Could not find the Pulse card className block. No changes written.\n"
            "Run this and paste the output:\n"
            "grep -n \"OverviewPulseCard\\|rounded-xl border border-slate-200\\|Today\\|In motion\\|Ready\" src/pages/ProjectHome.jsx"
        )
    jsx = jsx.replace(old, new, 1)

marker = "OVERVIEW PULSE DARK SIGNAL CARDS v1"

# Remove older copy of this patch if it exists.
if marker in css:
    start = css.find("/* =========================================================\n   OVERVIEW PULSE DARK SIGNAL CARDS v1")
    end = css.find("/* END OVERVIEW PULSE DARK SIGNAL CARDS v1 */", start)
    if start != -1 and end != -1:
        end += len("/* END OVERVIEW PULSE DARK SIGNAL CARDS v1 */")
        css = css[:start].rstrip() + "\n\n" + css[end:].lstrip()

css_patch = r'''
/* =========================================================
   OVERVIEW PULSE DARK SIGNAL CARDS v1
   ProjectHome > Overview > Pulse:
   Today / In motion / Ready dark-mode readability.
   ========================================================= */

.overview-pulse-signal-card {
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

.overview-pulse-signal-card > * {
  position: relative;
  z-index: 1;
}

html.dark .overview-pulse-signal-card,
html[data-theme="dark"] .overview-pulse-signal-card,
body.dark .overview-pulse-signal-card {
  color: #f8fafc !important;
  box-shadow:
    0 18px 42px rgba(0, 0, 0, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.10) !important;
}

/* Today */
html.dark .overview-pulse-today,
html[data-theme="dark"] .overview-pulse-today,
body.dark .overview-pulse-today {
  background:
    radial-gradient(circle at 15% 0%, rgba(251, 146, 60, 0.42), transparent 44%),
    linear-gradient(135deg, rgba(67, 20, 7, 0.98), rgba(15, 23, 42, 0.94)) !important;
  border-color: rgba(251, 146, 60, 0.88) !important;
}

/* In motion */
html.dark .overview-pulse-in-motion,
html[data-theme="dark"] .overview-pulse-in-motion,
body.dark .overview-pulse-in-motion {
  background:
    radial-gradient(circle at 15% 0%, rgba(139, 92, 246, 0.40), transparent 44%),
    linear-gradient(135deg, rgba(30, 27, 75, 0.98), rgba(15, 23, 42, 0.94)) !important;
  border-color: rgba(167, 139, 250, 0.86) !important;
}

/* Ready */
html.dark .overview-pulse-ready,
html[data-theme="dark"] .overview-pulse-ready,
body.dark .overview-pulse-ready {
  background:
    radial-gradient(circle at 15% 0%, rgba(16, 185, 129, 0.38), transparent 44%),
    linear-gradient(135deg, rgba(6, 78, 59, 0.98), rgba(15, 23, 42, 0.94)) !important;
  border-color: rgba(52, 211, 153, 0.90) !important;
}

/* Optional: keep Blocked readable too, without changing its layout */
html.dark .overview-pulse-blocked,
html[data-theme="dark"] .overview-pulse-blocked,
body.dark .overview-pulse-blocked {
  background:
    radial-gradient(circle at 15% 0%, rgba(148, 163, 184, 0.28), transparent 44%),
    linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(17, 24, 39, 0.94)) !important;
  border-color: rgba(148, 163, 184, 0.42) !important;
}

html.dark .overview-pulse-today span,
html.dark .overview-pulse-today svg {
  color: #fb923c !important;
}

html.dark .overview-pulse-in-motion span,
html.dark .overview-pulse-in-motion svg {
  color: #c4b5fd !important;
}

html.dark .overview-pulse-ready span,
html.dark .overview-pulse-ready svg {
  color: #34d399 !important;
}

html.dark .overview-pulse-signal-card div:last-child,
html[data-theme="dark"] .overview-pulse-signal-card div:last-child,
body.dark .overview-pulse-signal-card div:last-child {
  color: #ffffff !important;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.16);
}

/* END OVERVIEW PULSE DARK SIGNAL CARDS v1 */
'''

css = css.rstrip() + "\n\n" + css_patch.strip() + "\n"

for bad in ["onClick={() =", "className={}"]:
    if bad in jsx and bad not in jsx_original:
        jsx_path.write_text(jsx_original)
        css_path.write_text(css_original)
        raise RuntimeError(f"Unsafe JSX corruption pattern detected: {bad}. Original restored.")

if "overview-pulse-signal-card" not in jsx or marker not in css:
    jsx_path.write_text(jsx_original)
    css_path.write_text(css_original)
    raise RuntimeError("Patch incomplete. Original restored.")

jsx_path.write_text(jsx)
css_path.write_text(css)

print("Overview Pulse dark signal card patch applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Added scoped class names to ProjectHome Overview Pulse cards")
print("- Added dark-mode CSS for Today / In motion / Ready")
print("- Kept Blocked readable as a neutral dark card")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No overview loading, metrics, pulse counts, or project logic changed.")
