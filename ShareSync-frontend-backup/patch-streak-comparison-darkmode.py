from pathlib import Path
from datetime import datetime
import shutil

jsx_path = Path("src/components/social/StreakComparison.jsx")
css_path = Path("src/index.css")

if not jsx_path.exists():
    raise FileNotFoundError(f"Missing file: {jsx_path}")

if not css_path.exists():
    raise FileNotFoundError(f"Missing file: {css_path}")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")

jsx_original = jsx_path.read_text()
css_original = css_path.read_text()

jsx_backup = jsx_path.with_suffix(jsx_path.suffix + f".backup-streak-darkmode-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-streak-darkmode-{stamp}")

shutil.copy2(jsx_path, jsx_backup)
shutil.copy2(css_path, css_backup)

jsx = jsx_original
css = css_original

if "export default function StreakComparison" not in jsx:
    raise RuntimeError("Could not verify StreakComparison.jsx. No changes written.")

# Add compact root hook.
compact_old = """          p-4 rounded-xl bg-surface-1 border border-white/[0.06]
          ${onViewDetails ? 'cursor-pointer hover:bg-surface-2' : ''}
          transition-colors
          ${className}"""

compact_new = """          streak-comparison-card streak-comparison-card--compact
          p-4 rounded-xl bg-surface-1 border border-white/[0.06]
          ${onViewDetails ? 'cursor-pointer hover:bg-surface-2' : ''}
          transition-colors
          ${className}"""

if "streak-comparison-card--compact" not in jsx:
    if compact_old not in jsx:
        raise RuntimeError(
            "Could not find compact StreakComparison root. No changes written.\n"
            "Run: grep -n \"variant === 'compact'\\|bg-surface-1\\|Your Streak\" src/components/social/StreakComparison.jsx"
        )
    jsx = jsx.replace(compact_old, compact_new, 1)

# Add default root hook.
default_old = """    <div className={`p-4 rounded-xl bg-surface-1 border border-white/[0.06] ${className}`}>"""
default_new = """    <div className={`streak-comparison-card streak-comparison-card--default p-4 rounded-xl bg-surface-1 border border-white/[0.06] ${className}`}>"""

if "streak-comparison-card--default" not in jsx:
    if default_old not in jsx:
        raise RuntimeError(
            "Could not find default StreakComparison root. No changes written.\n"
            "Run: grep -n \"rounded-xl bg-surface-1\" src/components/social/StreakComparison.jsx"
        )
    jsx = jsx.replace(default_old, default_new, 1)

# Add direct hooks to inner sections.
if 'className="streak-comparison-bars space-y-2"' not in jsx:
    jsx = jsx.replace('className="space-y-2"', 'className="streak-comparison-bars space-y-2"', 1)

if 'className="streak-comparison-leader-card ' not in jsx:
    jsx = jsx.replace(
        """      p-3 rounded-xl
      ${isYouLeading ? 'bg-warning-500/10 border border-warning-500/20' : 'bg-surface-2 border border-white/[0.06]'}""",
        """      streak-comparison-leader-card p-3 rounded-xl
      ${isYouLeading ? 'bg-warning-500/10 border border-warning-500/20' : 'bg-surface-2 border border-white/[0.06]'}""",
        1
    )

if 'className={`streak-comparison-catchup ' not in jsx:
    jsx = jsx.replace(
        'className={`flex items-center gap-2 text-sm ${color}`}',
        'className={`streak-comparison-catchup flex items-center gap-2 text-sm ${color}`}',
        1
    )

# Remove older patch block if it exists.
def remove_block(text, title):
    start_marker = f"/* =========================================================\n   {title}"
    end_marker = f"/* END {title} */"

    start = text.find(start_marker)
    if start == -1:
        return text

    end = text.find(end_marker, start)
    if end == -1:
        return text

    end += len(end_marker)
    return text[:start].rstrip() + "\n\n" + text[end:].lstrip()

css = remove_block(css, "STREAK COMPARISON DARKMODE STRIKE v1")

css_patch = r'''
/* =========================================================
   STREAK COMPARISON DARKMODE STRIKE v1
   Home > Your Streak card.
   ========================================================= */

.streak-comparison-card {
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

.streak-comparison-card > * {
  position: relative;
  z-index: 1;
}

.streak-comparison-card::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0;
}

/* Main card shell */
html.dark .streak-comparison-card,
html[data-theme="dark"] .streak-comparison-card,
body.dark .streak-comparison-card {
  background:
    radial-gradient(circle at 8% 0%, rgba(251, 146, 60, 0.20), transparent 34%),
    radial-gradient(circle at 94% 12%, rgba(139, 92, 246, 0.16), transparent 36%),
    linear-gradient(135deg, rgba(20, 24, 38, 0.98), rgba(9, 14, 26, 0.98)) !important;
  border: 1px solid rgba(251, 146, 60, 0.26) !important;
  color: #f8fafc !important;
  box-shadow:
    0 24px 58px rgba(0, 0, 0, 0.40),
    0 0 0 1px rgba(251, 146, 60, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.11) !important;
}

html.dark .streak-comparison-card::before,
html[data-theme="dark"] .streak-comparison-card::before,
body.dark .streak-comparison-card::before {
  opacity: 1;
  background:
    linear-gradient(120deg, rgba(251, 146, 60, 0.10), transparent 42%, rgba(139, 92, 246, 0.12));
}

/* Header text */
html.dark .streak-comparison-card h3,
html.dark .streak-comparison-card .text-text-primary,
html.dark .streak-comparison-card .font-medium,
html.dark .streak-comparison-card .font-bold,
html.dark .streak-comparison-card .font-black,
html[data-theme="dark"] .streak-comparison-card h3,
html[data-theme="dark"] .streak-comparison-card .text-text-primary,
html[data-theme="dark"] .streak-comparison-card .font-medium,
html[data-theme="dark"] .streak-comparison-card .font-bold,
html[data-theme="dark"] .streak-comparison-card .font-black,
body.dark .streak-comparison-card h3,
body.dark .streak-comparison-card .text-text-primary,
body.dark .streak-comparison-card .font-medium,
body.dark .streak-comparison-card .font-bold,
body.dark .streak-comparison-card .font-black {
  color: #ffffff !important;
  opacity: 1 !important;
  text-shadow: 0 0 18px rgba(255, 255, 255, 0.12);
}

/* Secondary text */
html.dark .streak-comparison-card p,
html.dark .streak-comparison-card span,
html.dark .streak-comparison-card .text-text-secondary,
html.dark .streak-comparison-card .text-text-tertiary,
html[data-theme="dark"] .streak-comparison-card p,
html[data-theme="dark"] .streak-comparison-card span,
html[data-theme="dark"] .streak-comparison-card .text-text-secondary,
html[data-theme="dark"] .streak-comparison-card .text-text-tertiary,
body.dark .streak-comparison-card p,
body.dark .streak-comparison-card span,
body.dark .streak-comparison-card .text-text-secondary,
body.dark .streak-comparison-card .text-text-tertiary {
  color: rgba(226, 232, 240, 0.84) !important;
  opacity: 1 !important;
}

/* Streak number / flame accent */
html.dark .streak-comparison-card .text-warning-500,
html.dark .streak-comparison-card .text-energy-500,
html[data-theme="dark"] .streak-comparison-card .text-warning-500,
html[data-theme="dark"] .streak-comparison-card .text-energy-500,
body.dark .streak-comparison-card .text-warning-500,
body.dark .streak-comparison-card .text-energy-500 {
  color: #fb923c !important;
  filter: drop-shadow(0 0 12px rgba(251, 146, 60, 0.35));
}

/* Purple / success accents */
html.dark .streak-comparison-card .text-brand-400,
html[data-theme="dark"] .streak-comparison-card .text-brand-400,
body.dark .streak-comparison-card .text-brand-400 {
  color: #c4b5fd !important;
}

html.dark .streak-comparison-card .text-success,
html[data-theme="dark"] .streak-comparison-card .text-success,
body.dark .streak-comparison-card .text-success {
  color: #5eead4 !important;
}

/* Comparison bars */
html.dark .streak-comparison-bars .bg-surface-2,
html[data-theme="dark"] .streak-comparison-bars .bg-surface-2,
body.dark .streak-comparison-bars .bg-surface-2 {
  background: rgba(255, 255, 255, 0.10) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

html.dark .streak-comparison-bars .bg-surface-3,
html[data-theme="dark"] .streak-comparison-bars .bg-surface-3,
body.dark .streak-comparison-bars .bg-surface-3 {
  background: rgba(148, 163, 184, 0.35) !important;
}

/* Leader card */
html.dark .streak-comparison-leader-card,
html[data-theme="dark"] .streak-comparison-leader-card,
body.dark .streak-comparison-leader-card {
  background:
    radial-gradient(circle at 6% 0%, rgba(251, 146, 60, 0.14), transparent 40%),
    rgba(255, 255, 255, 0.055) !important;
  border-color: rgba(251, 146, 60, 0.22) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.09),
    0 14px 32px rgba(0, 0, 0, 0.22) !important;
}

/* Catch-up message strip */
html.dark .streak-comparison-catchup,
html[data-theme="dark"] .streak-comparison-catchup,
body.dark .streak-comparison-catchup {
  padding: 0.65rem 0.75rem;
  border-radius: 0.85rem;
  background:
    linear-gradient(135deg, rgba(251, 146, 60, 0.10), rgba(139, 92, 246, 0.08)) !important;
  border: 1px solid rgba(255, 255, 255, 0.10);
}

/* Buttons */
html.dark .streak-comparison-card button,
html[data-theme="dark"] .streak-comparison-card button,
body.dark .streak-comparison-card button {
  background: rgba(255, 255, 255, 0.065) !important;
  border-color: rgba(255, 255, 255, 0.14) !important;
}

/* END STREAK COMPARISON DARKMODE STRIKE v1 */
'''

css = css.rstrip() + "\n\n" + css_patch.strip() + "\n"

for bad in ["onClick={() =", "className={}"]:
    if bad in jsx and bad not in jsx_original:
        jsx_path.write_text(jsx_original)
        css_path.write_text(css_original)
        raise RuntimeError(f"Unsafe JSX corruption pattern detected: {bad}. Original restored.")

if "streak-comparison-card--compact" not in jsx or "STREAK COMPARISON DARKMODE STRIKE v1" not in css:
    jsx_path.write_text(jsx_original)
    css_path.write_text(css_original)
    raise RuntimeError("Patch incomplete. Original restored.")

jsx_path.write_text(jsx)
css_path.write_text(css)

print("StreakComparison dark-mode patch applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Added scoped classes to StreakComparison.jsx")
print("- Added dark-mode styling for the Your Streak card")
print("- Improved card shell, text contrast, bars, and leader/catch-up sections")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No streak logic changed.")
