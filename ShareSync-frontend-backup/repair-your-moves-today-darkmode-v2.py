from pathlib import Path
from datetime import datetime
import shutil

jsx_path = Path("src/components/focus/YourMovesToday.jsx")
css_path = Path("src/index.css")

if not jsx_path.exists():
    raise FileNotFoundError(f"Missing file: {jsx_path}")

if not css_path.exists():
    raise FileNotFoundError(f"Missing file: {css_path}")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")

jsx_original = jsx_path.read_text()
css_original = css_path.read_text()

jsx_backup = jsx_path.with_suffix(jsx_path.suffix + f".backup-your-moves-repair-v2-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-your-moves-repair-v2-{stamp}")

shutil.copy2(jsx_path, jsx_backup)
shutil.copy2(css_path, css_backup)

jsx = jsx_original
css = css_original

if "export default function YourMovesToday" not in jsx or "Your 3 Moves Today" not in jsx:
    raise RuntimeError("Could not verify YourMovesToday.jsx. No changes written.")

# Ensure the scoped wrapper class exists.
if "your-moves-today-panel" not in jsx:
    if "card-action" not in jsx:
        raise RuntimeError(
            "Could not find card-action wrapper. No changes written.\n"
            "Run: grep -n \"card-action\\|Your 3 Moves Today\" src/components/focus/YourMovesToday.jsx"
        )
    jsx = jsx.replace("card-action", "your-moves-today-panel card-action", 1)

# Add hook to recommendation card when available.
old_rec = "rounded-2xl border border-violet-100 dark:border-violet-500/15 bg-violet-50/40 dark:bg-violet-500/5 px-4 py-3"
new_rec = "your-moves-recommendation-card rounded-2xl border border-violet-100 dark:border-violet-500/15 bg-violet-50/40 dark:bg-violet-500/5 px-4 py-3"
if old_rec in jsx and "your-moves-recommendation-card" not in jsx:
    jsx = jsx.replace(old_rec, new_rec, 1)

# Remove older overly-broad blocks so they cannot fight this repair.
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

css = remove_block(css, "YOUR MOVES TODAY DARKMODE STRIKE v1")
css = remove_block(css, "YOUR MOVES TODAY DARKMODE REPAIR v2")

css_patch = r'''
/* =========================================================
   YOUR MOVES TODAY DARKMODE REPAIR v2
   Home > Your 3 Moves Today:
   fixes the MoveCard rows that stayed white in dark mode.
   ========================================================= */

.your-moves-today-panel {
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

.your-moves-today-panel > * {
  position: relative;
  z-index: 1;
}

.your-moves-today-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  z-index: 0;
}

/* Outer mission panel */
html.dark .your-moves-today-panel,
html[data-theme="dark"] .your-moves-today-panel,
body.dark .your-moves-today-panel {
  background:
    radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.22), transparent 36%),
    radial-gradient(circle at 96% 18%, rgba(45, 212, 191, 0.14), transparent 34%),
    linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(8, 13, 25, 0.96)) !important;
  border-color: rgba(167, 139, 250, 0.26) !important;
  color: #f8fafc !important;
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.42),
    0 0 0 1px rgba(167, 139, 250, 0.10),
    inset 0 1px 0 rgba(255, 255, 255, 0.10) !important;
}

html.dark .your-moves-today-panel::before,
html[data-theme="dark"] .your-moves-today-panel::before,
body.dark .your-moves-today-panel::before {
  background:
    linear-gradient(120deg, rgba(124, 58, 237, 0.16), transparent 42%, rgba(45, 212, 191, 0.10));
  opacity: 1;
}

/* Top recommendation command card */
html.dark .your-moves-recommendation-card,
html[data-theme="dark"] .your-moves-recommendation-card,
body.dark .your-moves-recommendation-card {
  background:
    radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.22), transparent 42%),
    radial-gradient(circle at 94% 0%, rgba(45, 212, 191, 0.12), transparent 38%),
    rgba(255, 255, 255, 0.055) !important;
  border-color: rgba(196, 181, 253, 0.28) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.10),
    0 18px 38px rgba(0, 0, 0, 0.24) !important;
}

/* The three metric blocks: Moves / Plan State / Completion */
html.dark .your-moves-recommendation-card [class*="rounded"],
html[data-theme="dark"] .your-moves-recommendation-card [class*="rounded"],
body.dark .your-moves-recommendation-card [class*="rounded"] {
  background:
    radial-gradient(circle at 10% 0%, rgba(139, 92, 246, 0.15), transparent 44%),
    rgba(255, 255, 255, 0.055) !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
}

/* The actual MoveCard rows rendered inside .space-y-3 */
html.dark .your-moves-today-panel .space-y-3 > *,
html[data-theme="dark"] .your-moves-today-panel .space-y-3 > *,
body.dark .your-moves-today-panel .space-y-3 > * {
  background:
    radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.20), transparent 42%),
    radial-gradient(circle at 95% 20%, rgba(45, 212, 191, 0.10), transparent 38%),
    linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(10, 15, 28, 0.96)) !important;
  border: 1px solid rgba(255, 255, 255, 0.13) !important;
  color: #f8fafc !important;
  box-shadow:
    0 18px 44px rgba(0, 0, 0, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.10) !important;
}

/* Force stubborn inner white panels inside each MoveCard to turn dark */
html.dark .your-moves-today-panel .space-y-3 > * [class*="bg-white"],
html.dark .your-moves-today-panel .space-y-3 > * [class*="bg-slate-50"],
html.dark .your-moves-today-panel .space-y-3 > * [class*="bg-gray-50"],
html.dark .your-moves-today-panel .space-y-3 > * [class*="bg-zinc-50"],
html[data-theme="dark"] .your-moves-today-panel .space-y-3 > * [class*="bg-white"],
html[data-theme="dark"] .your-moves-today-panel .space-y-3 > * [class*="bg-slate-50"],
html[data-theme="dark"] .your-moves-today-panel .space-y-3 > * [class*="bg-gray-50"],
html[data-theme="dark"] .your-moves-today-panel .space-y-3 > * [class*="bg-zinc-50"],
body.dark .your-moves-today-panel .space-y-3 > * [class*="bg-white"],
body.dark .your-moves-today-panel .space-y-3 > * [class*="bg-slate-50"],
body.dark .your-moves-today-panel .space-y-3 > * [class*="bg-gray-50"],
body.dark .your-moves-today-panel .space-y-3 > * [class*="bg-zinc-50"] {
  background: rgba(255, 255, 255, 0.055) !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
}

/* Main text readability inside the panel */
html.dark .your-moves-today-panel h1,
html.dark .your-moves-today-panel h2,
html.dark .your-moves-today-panel h3,
html.dark .your-moves-today-panel h4,
html.dark .your-moves-today-panel strong,
html.dark .your-moves-today-panel .font-bold,
html.dark .your-moves-today-panel .font-black,
html[data-theme="dark"] .your-moves-today-panel h1,
html[data-theme="dark"] .your-moves-today-panel h2,
html[data-theme="dark"] .your-moves-today-panel h3,
html[data-theme="dark"] .your-moves-today-panel h4,
html[data-theme="dark"] .your-moves-today-panel strong,
html[data-theme="dark"] .your-moves-today-panel .font-bold,
html[data-theme="dark"] .your-moves-today-panel .font-black,
body.dark .your-moves-today-panel h1,
body.dark .your-moves-today-panel h2,
body.dark .your-moves-today-panel h3,
body.dark .your-moves-today-panel h4,
body.dark .your-moves-today-panel strong,
body.dark .your-moves-today-panel .font-bold,
body.dark .your-moves-today-panel .font-black {
  color: #ffffff !important;
  opacity: 1 !important;
  text-shadow: 0 0 18px rgba(255, 255, 255, 0.10);
}

html.dark .your-moves-today-panel p,
html.dark .your-moves-today-panel span,
html.dark .your-moves-today-panel button,
html.dark .your-moves-today-panel [class*="text-slate-"],
html.dark .your-moves-today-panel [class*="text-zinc-"],
html.dark .your-moves-today-panel [class*="text-gray-"],
html[data-theme="dark"] .your-moves-today-panel p,
html[data-theme="dark"] .your-moves-today-panel span,
html[data-theme="dark"] .your-moves-today-panel button,
html[data-theme="dark"] .your-moves-today-panel [class*="text-slate-"],
html[data-theme="dark"] .your-moves-today-panel [class*="text-zinc-"],
html[data-theme="dark"] .your-moves-today-panel [class*="text-gray-"],
body.dark .your-moves-today-panel p,
body.dark .your-moves-today-panel span,
body.dark .your-moves-today-panel button,
body.dark .your-moves-today-panel [class*="text-slate-"],
body.dark .your-moves-today-panel [class*="text-zinc-"],
body.dark .your-moves-today-panel [class*="text-gray-"] {
  color: rgba(226, 232, 240, 0.82) !important;
  opacity: 1 !important;
}

/* Keep project badges / pills readable */
html.dark .your-moves-today-panel [class*="rounded-full"],
html.dark .your-moves-today-panel [class*="rounded-md"],
html[data-theme="dark"] .your-moves-today-panel [class*="rounded-full"],
html[data-theme="dark"] .your-moves-today-panel [class*="rounded-md"],
body.dark .your-moves-today-panel [class*="rounded-full"],
body.dark .your-moves-today-panel [class*="rounded-md"] {
  border-color: rgba(255, 255, 255, 0.14) !important;
}

/* Accent colors */
html.dark .your-moves-today-panel [class*="text-violet-"],
html[data-theme="dark"] .your-moves-today-panel [class*="text-violet-"],
body.dark .your-moves-today-panel [class*="text-violet-"] {
  color: #c4b5fd !important;
}

html.dark .your-moves-today-panel [class*="text-cyan-"],
html[data-theme="dark"] .your-moves-today-panel [class*="text-cyan-"],
body.dark .your-moves-today-panel [class*="text-cyan-"] {
  color: #67e8f9 !important;
}

html.dark .your-moves-today-panel [class*="text-teal-"],
html.dark .your-moves-today-panel [class*="text-emerald-"],
html[data-theme="dark"] .your-moves-today-panel [class*="text-teal-"],
html[data-theme="dark"] .your-moves-today-panel [class*="text-emerald-"],
body.dark .your-moves-today-panel [class*="text-teal-"],
body.dark .your-moves-today-panel [class*="text-emerald-"] {
  color: #5eead4 !important;
}

html.dark .your-moves-today-panel [class*="text-amber-"],
html[data-theme="dark"] .your-moves-today-panel [class*="text-amber-"],
body.dark .your-moves-today-panel [class*="text-amber-"] {
  color: #fcd34d !important;
}

html.dark .your-moves-today-panel [class*="text-red-"],
html[data-theme="dark"] .your-moves-today-panel [class*="text-red-"],
body.dark .your-moves-today-panel [class*="text-red-"] {
  color: #fb7185 !important;
}

/* Inputs / add move field */
html.dark .your-moves-today-panel input,
html.dark .your-moves-today-panel textarea,
html[data-theme="dark"] .your-moves-today-panel input,
html[data-theme="dark"] .your-moves-today-panel textarea,
body.dark .your-moves-today-panel input,
body.dark .your-moves-today-panel textarea {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: rgba(255, 255, 255, 0.16) !important;
  color: #ffffff !important;
}

html.dark .your-moves-today-panel input::placeholder,
html.dark .your-moves-today-panel textarea::placeholder,
html[data-theme="dark"] .your-moves-today-panel input::placeholder,
html[data-theme="dark"] .your-moves-today-panel textarea::placeholder,
body.dark .your-moves-today-panel input::placeholder,
body.dark .your-moves-today-panel textarea::placeholder {
  color: rgba(226, 232, 240, 0.62) !important;
}

/* Footer */
html.dark .your-moves-footer,
html[data-theme="dark"] .your-moves-footer,
body.dark .your-moves-footer {
  border-top-color: rgba(255, 255, 255, 0.12) !important;
}

/* END YOUR MOVES TODAY DARKMODE REPAIR v2 */
'''

css = css.rstrip() + "\n\n" + css_patch.strip() + "\n"

for bad in ["onClick={() =", "className={}"]:
    if bad in jsx and bad not in jsx_original:
        jsx_path.write_text(jsx_original)
        css_path.write_text(css_original)
        raise RuntimeError(f"Unsafe JSX corruption pattern detected: {bad}. Original restored.")

if "your-moves-today-panel" not in jsx or "YOUR MOVES TODAY DARKMODE REPAIR v2" not in css:
    jsx_path.write_text(jsx_original)
    css_path.write_text(css_original)
    raise RuntimeError("Repair incomplete. Original restored.")

jsx_path.write_text(jsx)
css_path.write_text(css)

print("YourMovesToday dark-mode repair v2 applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Ensured YourMovesToday has a scoped wrapper class")
print("- Removed the older v1 YourMovesToday dark-mode CSS block")
print("- Added stronger dark-mode styling for the actual MoveCard rows")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No focus engine logic changed.")
print("No move completion/snooze logic changed.")
