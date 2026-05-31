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

jsx_backup = jsx_path.with_suffix(jsx_path.suffix + f".backup-your-moves-darkmode-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-your-moves-darkmode-{stamp}")

shutil.copy2(jsx_path, jsx_backup)
shutil.copy2(css_path, css_backup)

jsx = jsx_original
css = css_original

required = [
    "export default function YourMovesToday",
    "Your 3 Moves Today",
    "MoveCard",
]

missing = [item for item in required if item not in jsx]
if missing:
    raise RuntimeError(
        f"Could not verify YourMovesToday structure. Missing: {missing}. No changes written."
    )

changes = []

def replace_once(label, old, new, required=False):
    global jsx

    if new in jsx:
        changes.append(f"{label}: already present")
        return

    if old not in jsx:
        if required:
            raise RuntimeError(
                f"Required target not found: {label}. No changes written.\n"
                "Run this and paste the output:\n"
                "grep -n \"card-action\\|Your 3 Moves Today\\|Recommended from your active projects\\|MoveCard\" src/components/focus/YourMovesToday.jsx"
            )
        changes.append(f"{label}: not found/skipped")
        return

    jsx = jsx.replace(old, new, 1)
    changes.append(f"{label}: patched")

# Main scoped wrapper. This is the most important part.
replace_once(
    "main wrapper",
    "card-action",
    "your-moves-today-panel card-action",
    required=True,
)

# Recommendation / command card hook.
replace_once(
    "recommendation card",
    "rounded-2xl border border-violet-100 dark:border-violet-500/15 bg-violet-50/40 dark:bg-violet-500/5 px-4 py-3",
    "your-moves-recommendation-card rounded-2xl border border-violet-100 dark:border-violet-500/15 bg-violet-50/40 dark:bg-violet-500/5 px-4 py-3",
)

# Footer hook.
replace_once(
    "footer",
    'className="mt-5 pt-4 border-t border-slate-100 dark:border-white/10"',
    'className="your-moves-footer mt-5 pt-4 border-t border-slate-100 dark:border-white/10"',
)

# Error state hook.
replace_once(
    "error state",
    'className="py-8 text-center bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10"',
    'className="your-moves-error-card py-8 text-center bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10"',
)

# Empty state hook.
replace_once(
    "empty state",
    'className="py-10 px-5 text-center bg-teal-50/50 dark:bg-teal-500/5 rounded-xl border border-teal-100 dark:border-teal-500/10"',
    'className="your-moves-empty-card py-10 px-5 text-center bg-teal-50/50 dark:bg-teal-500/5 rounded-xl border border-teal-100 dark:border-teal-500/10"',
)

marker = "YOUR MOVES TODAY DARKMODE STRIKE v1"

if marker in css:
    start = css.find("/* =========================================================\n   YOUR MOVES TODAY DARKMODE STRIKE v1")
    end = css.find("/* END YOUR MOVES TODAY DARKMODE STRIKE v1 */", start)
    if start != -1 and end != -1:
        end += len("/* END YOUR MOVES TODAY DARKMODE STRIKE v1 */")
        css = css[:start].rstrip() + "\n\n" + css[end:].lstrip()

css_patch = r'''
/* =========================================================
   YOUR MOVES TODAY DARKMODE STRIKE v1
   Home > Your 3 Moves Today dark-mode mission-card polish.
   Scoped to YourMovesToday only.
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
  z-index: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 220ms ease;
}

html.dark .your-moves-today-panel,
html[data-theme="dark"] .your-moves-today-panel,
body.dark .your-moves-today-panel {
  background:
    radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.22), transparent 36%),
    radial-gradient(circle at 96% 18%, rgba(45, 212, 191, 0.14), transparent 34%),
    linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(8, 13, 25, 0.96)) !important;
  border-color: rgba(167, 139, 250, 0.24) !important;
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
    linear-gradient(120deg, rgba(124, 58, 237, 0.18), transparent 40%, rgba(45, 212, 191, 0.12));
  opacity: 1;
}

/* Header icon block */
html.dark .your-moves-today-panel .rounded-xl.shadow-sm,
html[data-theme="dark"] .your-moves-today-panel .rounded-xl.shadow-sm,
body.dark .your-moves-today-panel .rounded-xl.shadow-sm {
  background:
    radial-gradient(circle at 30% 0%, rgba(139, 92, 246, 0.26), transparent 50%),
    rgba(255, 255, 255, 0.065) !important;
  border: 1px solid rgba(255, 255, 255, 0.10);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.10),
    0 12px 26px rgba(0, 0, 0, 0.22) !important;
}

/* Main recommendation / command card */
html.dark .your-moves-recommendation-card,
html[data-theme="dark"] .your-moves-recommendation-card,
body.dark .your-moves-recommendation-card {
  background:
    radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.24), transparent 40%),
    radial-gradient(circle at 92% 0%, rgba(45, 212, 191, 0.14), transparent 38%),
    rgba(255, 255, 255, 0.055) !important;
  border-color: rgba(196, 181, 253, 0.26) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.10),
    0 18px 38px rgba(0, 0, 0, 0.24) !important;
}

/* Any white/light cards rendered inside YourMovesToday, including MoveCard rows */
html.dark .your-moves-today-panel [class*="bg-white"][class*="rounded"],
html.dark .your-moves-today-panel [class*="bg-slate-50"][class*="rounded"],
html.dark .your-moves-today-panel [class*="bg-zinc-"][class*="rounded"],
html[data-theme="dark"] .your-moves-today-panel [class*="bg-white"][class*="rounded"],
html[data-theme="dark"] .your-moves-today-panel [class*="bg-slate-50"][class*="rounded"],
html[data-theme="dark"] .your-moves-today-panel [class*="bg-zinc-"][class*="rounded"],
body.dark .your-moves-today-panel [class*="bg-white"][class*="rounded"],
body.dark .your-moves-today-panel [class*="bg-slate-50"][class*="rounded"],
body.dark .your-moves-today-panel [class*="bg-zinc-"][class*="rounded"] {
  background:
    radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.18), transparent 42%),
    radial-gradient(circle at 94% 12%, rgba(45, 212, 191, 0.10), transparent 38%),
    rgba(255, 255, 255, 0.055) !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
  color: #f8fafc !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 14px 30px rgba(0, 0, 0, 0.22) !important;
}

/* Inputs inside the focus card */
html.dark .your-moves-today-panel input,
html.dark .your-moves-today-panel textarea,
html[data-theme="dark"] .your-moves-today-panel input,
html[data-theme="dark"] .your-moves-today-panel textarea,
body.dark .your-moves-today-panel input,
body.dark .your-moves-today-panel textarea {
  background: rgba(255, 255, 255, 0.075) !important;
  border-color: rgba(255, 255, 255, 0.14) !important;
  color: #ffffff !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 10px 24px rgba(0, 0, 0, 0.22) !important;
}

html.dark .your-moves-today-panel input::placeholder,
html.dark .your-moves-today-panel textarea::placeholder,
html[data-theme="dark"] .your-moves-today-panel input::placeholder,
html[data-theme="dark"] .your-moves-today-panel textarea::placeholder,
body.dark .your-moves-today-panel input::placeholder,
body.dark .your-moves-today-panel textarea::placeholder {
  color: rgba(226, 232, 240, 0.62) !important;
}

/* Text readability */
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
  text-shadow: 0 0 18px rgba(255, 255, 255, 0.10);
}

html.dark .your-moves-today-panel p,
html.dark .your-moves-today-panel span,
html.dark .your-moves-today-panel [class*="text-slate-"],
html.dark .your-moves-today-panel [class*="text-zinc-"],
html.dark .your-moves-today-panel [class*="text-gray-"],
html[data-theme="dark"] .your-moves-today-panel p,
html[data-theme="dark"] .your-moves-today-panel span,
html[data-theme="dark"] .your-moves-today-panel [class*="text-slate-"],
html[data-theme="dark"] .your-moves-today-panel [class*="text-zinc-"],
html[data-theme="dark"] .your-moves-today-panel [class*="text-gray-"],
body.dark .your-moves-today-panel p,
body.dark .your-moves-today-panel span,
body.dark .your-moves-today-panel [class*="text-slate-"],
body.dark .your-moves-today-panel [class*="text-zinc-"],
body.dark .your-moves-today-panel [class*="text-gray-"] {
  color: rgba(226, 232, 240, 0.78) !important;
}

/* Preserve important accents */
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

/* Badges / pills */
html.dark .your-moves-today-panel [class*="rounded-full"],
html[data-theme="dark"] .your-moves-today-panel [class*="rounded-full"],
body.dark .your-moves-today-panel [class*="rounded-full"] {
  border-color: rgba(255, 255, 255, 0.14) !important;
}

/* Footer impact strip */
html.dark .your-moves-footer,
html[data-theme="dark"] .your-moves-footer,
body.dark .your-moves-footer {
  border-top-color: rgba(255, 255, 255, 0.10) !important;
}

/* Empty/error cards */
html.dark .your-moves-empty-card,
html.dark .your-moves-error-card,
html[data-theme="dark"] .your-moves-empty-card,
html[data-theme="dark"] .your-moves-error-card,
body.dark .your-moves-empty-card,
body.dark .your-moves-error-card {
  background:
    radial-gradient(circle at 12% 0%, rgba(45, 212, 191, 0.18), transparent 42%),
    rgba(255, 255, 255, 0.055) !important;
  border-color: rgba(45, 212, 191, 0.22) !important;
}

/* END YOUR MOVES TODAY DARKMODE STRIKE v1 */
'''

css = css.rstrip() + "\n\n" + css_patch.strip() + "\n"

for bad in ["onClick={() =", "className={}"]:
    if bad in jsx and bad not in jsx_original:
        jsx_path.write_text(jsx_original)
        css_path.write_text(css_original)
        raise RuntimeError(f"Unsafe JSX corruption pattern detected: {bad}. Original restored.")

if "your-moves-today-panel" not in jsx or marker not in css:
    jsx_path.write_text(jsx_original)
    css_path.write_text(css_original)
    raise RuntimeError("Patch incomplete. Original restored.")

jsx_path.write_text(jsx)
css_path.write_text(css)

print("YourMovesToday dark-mode visual patch applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Patch results:")
for item in changes:
    print(f"- {item}")
print("")
print("Changed only:")
print("- Added one scoped wrapper class to YourMovesToday")
print("- Added dark-mode CSS for the Your 3 Moves Today panel and child blocks")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No focus engine logic changed.")
print("No move completion/snooze logic changed.")
