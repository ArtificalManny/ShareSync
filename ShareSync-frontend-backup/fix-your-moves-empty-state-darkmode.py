from pathlib import Path
from datetime import datetime
import shutil
import re

jsx_path = Path("src/components/focus/YourMovesToday.jsx")
css_path = Path("src/index.css")

if not jsx_path.exists():
    raise FileNotFoundError("Could not find src/components/focus/YourMovesToday.jsx")

if not css_path.exists():
    raise FileNotFoundError("Could not find src/index.css")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
jsx_backup = jsx_path.with_suffix(jsx_path.suffix + f".backup-empty-state-darkmode-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-empty-state-darkmode-{stamp}")

shutil.copy2(jsx_path, jsx_backup)
shutil.copy2(css_path, css_backup)

jsx = jsx_path.read_text()
css = css_path.read_text()

# Add a scoped class to the EmptyState root.
old_empty_root = 'className="py-10 px-5 text-center bg-teal-50/50 dark:bg-teal-500/5 rounded-xl border border-teal-100 dark:border-teal-500/10"'
new_empty_root = 'className="your-moves-empty-state py-10 px-5 text-center bg-teal-50/50 dark:bg-teal-500/5 rounded-xl border border-teal-100 dark:border-teal-500/10"'

if "your-moves-empty-state" not in jsx:
    if old_empty_root not in jsx:
        shutil.copy2(jsx_backup, jsx_path)
        shutil.copy2(css_backup, css_path)
        raise RuntimeError(
            "Could not find the EmptyState root class. No changes written.\n"
            "Run this and paste the output:\n"
            "grep -n -B 10 -A 35 \"All caught up\\|No critical moves\\|bg-teal\" src/components/focus/YourMovesToday.jsx"
        )

    jsx = jsx.replace(old_empty_root, new_empty_root, 1)

# Add a scoped class to the EmptyState icon wrapper.
old_icon = 'className="w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-500/20 mx-auto mb-4 flex items-center justify-center shadow-sm"'
new_icon = 'className="your-moves-empty-icon w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-500/20 mx-auto mb-4 flex items-center justify-center shadow-sm"'

if "your-moves-empty-icon" not in jsx and old_icon in jsx:
    jsx = jsx.replace(old_icon, new_icon, 1)

# Remove older empty-state block if rerunning.
css = re.sub(
    r"/\* =========================================================\n"
    r"   YOUR MOVES EMPTY STATE DARKMODE FIX\n"
    r"   ========================================================= \*/\n"
    r".*?"
    r"/\* END YOUR MOVES EMPTY STATE DARKMODE FIX \*/\n?",
    "",
    css,
    flags=re.DOTALL,
)

css_patch = r'''
/* =========================================================
   YOUR MOVES EMPTY STATE DARKMODE FIX
   Scoped fix for "All caught up!" inside YourMovesToday.jsx.
   ========================================================= */

.your-moves-empty-state {
  position: relative;
  overflow: hidden;
  border-radius: 1.5rem !important;
  border: 1px solid rgba(20, 184, 166, 0.18) !important;
  background:
    radial-gradient(circle at 50% 0%, rgba(20, 184, 166, 0.10), transparent 42%),
    rgba(255, 255, 255, 0.96) !important;
  box-shadow:
    0 18px 56px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
}

.your-moves-empty-state::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: linear-gradient(90deg, #14b8a6 0%, #22d3ee 48%, #8b5cf6 100%);
  opacity: 0.95;
}

.your-moves-empty-icon {
  background:
    linear-gradient(135deg, rgba(153, 246, 228, 0.95), rgba(204, 251, 241, 0.80)) !important;
  color: #0f766e !important;
  box-shadow:
    0 14px 30px rgba(20, 184, 166, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.65) !important;
}

.your-moves-empty-icon svg {
  color: #0f766e !important;
  stroke: currentColor !important;
}

html.dark .your-moves-empty-state,
html[data-theme="dark"] .your-moves-empty-state,
.dark .your-moves-empty-state,
[data-theme="dark"] .your-moves-empty-state {
  border-color: rgba(45, 212, 191, 0.36) !important;
  background:
    radial-gradient(circle at 50% 0%, rgba(20, 184, 166, 0.22), transparent 42%),
    radial-gradient(circle at 100% 100%, rgba(139, 92, 246, 0.18), transparent 44%),
    linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98)) !important;
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.42),
    0 0 46px rgba(20, 184, 166, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.07) !important;
}

html.dark .your-moves-empty-icon,
html[data-theme="dark"] .your-moves-empty-icon,
.dark .your-moves-empty-icon,
[data-theme="dark"] .your-moves-empty-icon {
  background:
    linear-gradient(135deg, rgba(45, 212, 191, 0.32), rgba(139, 92, 246, 0.24)) !important;
  color: #5eead4 !important;
  box-shadow:
    0 18px 48px rgba(20, 184, 166, 0.18),
    0 0 36px rgba(139, 92, 246, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.10) !important;
}

html.dark .your-moves-empty-icon svg,
html[data-theme="dark"] .your-moves-empty-icon svg,
.dark .your-moves-empty-icon svg,
[data-theme="dark"] .your-moves-empty-icon svg {
  color: #5eead4 !important;
  stroke: currentColor !important;
}

html.dark .your-moves-empty-state h4,
html[data-theme="dark"] .your-moves-empty-state h4,
.dark .your-moves-empty-state h4,
[data-theme="dark"] .your-moves-empty-state h4 {
  color: rgba(248, 250, 252, 0.98) !important;
  text-shadow: 0 0 24px rgba(45, 212, 191, 0.16);
}

html.dark .your-moves-empty-state p,
html[data-theme="dark"] .your-moves-empty-state p,
.dark .your-moves-empty-state p,
[data-theme="dark"] .your-moves-empty-state p {
  color: rgba(203, 213, 225, 0.92) !important;
}

html.dark .your-moves-empty-state button,
html[data-theme="dark"] .your-moves-empty-state button,
.dark .your-moves-empty-state button,
[data-theme="dark"] .your-moves-empty-state button {
  border-color: rgba(148, 163, 184, 0.22) !important;
  color: rgba(248, 250, 252, 0.94) !important;
}

html.dark .your-moves-empty-state button:first-of-type,
html[data-theme="dark"] .your-moves-empty-state button:first-of-type,
.dark .your-moves-empty-state button:first-of-type,
[data-theme="dark"] .your-moves-empty-state button:first-of-type {
  background: linear-gradient(135deg, #14b8a6, #0d9488) !important;
  color: #ffffff !important;
  box-shadow:
    0 16px 38px rgba(20, 184, 166, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.16) !important;
}

html.dark .your-moves-empty-state button:not(:first-of-type),
html[data-theme="dark"] .your-moves-empty-state button:not(:first-of-type),
.dark .your-moves-empty-state button:not(:first-of-type),
[data-theme="dark"] .your-moves-empty-state button:not(:first-of-type) {
  background: rgba(15, 23, 42, 0.72) !important;
  box-shadow:
    0 12px 28px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.07) !important;
}

/* END YOUR MOVES EMPTY STATE DARKMODE FIX */
'''

css = css.rstrip() + "\n\n" + css_patch.strip() + "\n"

unsafe_patterns = [
    ("onClick={() =", "malformed onClick arrow"),
    ("className={className={", "double className corruption"),
]

for pattern, label in unsafe_patterns:
    if pattern in jsx:
        shutil.copy2(jsx_backup, jsx_path)
        shutil.copy2(css_backup, css_path)
        raise RuntimeError(f"Unsafe pattern detected: {label}. Original restored.")

if "your-moves-empty-state" not in jsx:
    shutil.copy2(jsx_backup, jsx_path)
    shutil.copy2(css_backup, css_path)
    raise RuntimeError("Patch failed. Missing your-moves-empty-state. Original restored.")

if "YOUR MOVES EMPTY STATE DARKMODE FIX" not in css:
    shutil.copy2(jsx_backup, jsx_path)
    shutil.copy2(css_backup, css_path)
    raise RuntimeError("Patch failed. Missing CSS marker. Original restored.")

jsx_path.write_text(jsx)
css_path.write_text(css)

print("YourMovesToday EmptyState dark-mode fix applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Added your-moves-empty-state to the All caught up EmptyState root")
print("- Added your-moves-empty-icon to the EmptyState icon wrapper")
print("- Added scoped dark-mode CSS so the EmptyState is no longer bright white")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No focus engine logic changed.")
print("No move completion/snooze logic changed.")
