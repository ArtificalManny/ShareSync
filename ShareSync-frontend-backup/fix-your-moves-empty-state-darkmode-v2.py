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
jsx_backup = jsx_path.with_suffix(jsx_path.suffix + f".backup-empty-state-v2-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-empty-state-v2-{stamp}")

shutil.copy2(jsx_path, jsx_backup)
shutil.copy2(css_path, css_backup)

jsx = jsx_path.read_text()
css = css_path.read_text()

def add_class_to_opening_tag(source, tag_start, class_name):
    tag_end = source.find(">", tag_start)
    if tag_end == -1:
        raise RuntimeError("Could not find end of JSX opening tag.")

    tag = source[tag_start:tag_end + 1]

    if class_name in tag:
        return source

    # className="..."
    if re.search(r'className\s*=\s*"', tag):
        new_tag = re.sub(
            r'(className\s*=\s*")([^"]*)(")',
            lambda m: f'{m.group(1)}{class_name} {m.group(2)}{m.group(3)}',
            tag,
            count=1,
        )
        return source[:tag_start] + new_tag + source[tag_end + 1:]

    # className='...'
    if re.search(r"className\s*=\s*'", tag):
        new_tag = re.sub(
            r"(className\s*=\s*')([^']*)(')",
            lambda m: f'{m.group(1)}{class_name} {m.group(2)}{m.group(3)}',
            tag,
            count=1,
        )
        return source[:tag_start] + new_tag + source[tag_end + 1:]

    # className={`...`}
    if re.search(r'className\s*=\s*\{\s*`', tag, flags=re.DOTALL):
        new_tag = re.sub(
            r'(className\s*=\s*\{\s*`)',
            lambda m: f'{m.group(1)}\n        {class_name}',
            tag,
            count=1,
            flags=re.DOTALL,
        )
        return source[:tag_start] + new_tag + source[tag_end + 1:]

    # No className found: add one.
    new_tag = tag[:-1] + f' className="{class_name}">'
    return source[:tag_start] + new_tag + source[tag_end + 1:]

empty_marker = "function EmptyState"
widget_marker = "export function YourMovesWidget"

empty_start = jsx.find(empty_marker)
if empty_start == -1:
    raise RuntimeError("Could not find function EmptyState.")

widget_start = jsx.find(widget_marker, empty_start)
if widget_start == -1:
    raise RuntimeError("Could not find export function YourMovesWidget.")

# Repair missing closing brace if it ever comes back.
between = jsx[empty_start:widget_start]
if not between.rstrip().endswith("}"):
    jsx = jsx[:widget_start] + "}\n\n" + jsx[widget_start:]

# Recalculate after possible brace repair.
empty_start = jsx.find(empty_marker)
widget_start = jsx.find(widget_marker, empty_start)
segment = jsx[empty_start:widget_start]

return_rel = segment.find("return")
if return_rel == -1:
    raise RuntimeError("Could not find return inside EmptyState.")

root_div_rel = segment.find("<div", return_rel)
if root_div_rel == -1:
    raise RuntimeError("Could not find EmptyState root div.")

root_div_abs = empty_start + root_div_rel
jsx = add_class_to_opening_tag(jsx, root_div_abs, "your-moves-empty-state")

# Add icon class to the last div before "All caught up" when possible.
empty_start = jsx.find(empty_marker)
widget_start = jsx.find(widget_marker, empty_start)
segment = jsx[empty_start:widget_start]

all_caught_rel = segment.find("All caught up")
if all_caught_rel != -1:
    icon_div_rel = segment.rfind("<div", 0, all_caught_rel)
    root_div_rel = segment.find("<div", segment.find("return"))
    if icon_div_rel != -1 and icon_div_rel != root_div_rel:
        icon_div_abs = empty_start + icon_div_rel
        jsx = add_class_to_opening_tag(jsx, icon_div_abs, "your-moves-empty-icon")

# Remove previous version of this specific fix if rerunning.
css = re.sub(
    r"/\* =========================================================\n"
    r"   YOUR MOVES EMPTY STATE DARKMODE FIX V2\n"
    r"   ========================================================= \*/\n"
    r".*?"
    r"/\* END YOUR MOVES EMPTY STATE DARKMODE FIX V2 \*/\n?",
    "",
    css,
    flags=re.DOTALL,
)

css_patch = r'''
/* =========================================================
   YOUR MOVES EMPTY STATE DARKMODE FIX V2
   Scoped fix for "All caught up!" inside YourMovesToday.jsx.
   ========================================================= */

.your-moves-empty-state {
  position: relative;
  overflow: hidden;
  border-radius: 1.5rem !important;
  border: 1px solid rgba(20, 184, 166, 0.20) !important;
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

.your-moves-empty-icon,
.your-moves-empty-state > div:first-child {
  background:
    linear-gradient(135deg, rgba(153, 246, 228, 0.95), rgba(204, 251, 241, 0.80)) !important;
  color: #0f766e !important;
  box-shadow:
    0 14px 30px rgba(20, 184, 166, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.65) !important;
}

.your-moves-empty-icon svg,
.your-moves-empty-state > div:first-child svg {
  color: #0f766e !important;
  stroke: currentColor !important;
}

/* Dark mode: remove the bright white empty-state card */
html.dark .your-moves-empty-state,
html[data-theme="dark"] .your-moves-empty-state,
.dark .your-moves-empty-state,
[data-theme="dark"] .your-moves-empty-state {
  border-color: rgba(45, 212, 191, 0.38) !important;
  background:
    radial-gradient(circle at 50% 0%, rgba(20, 184, 166, 0.22), transparent 42%),
    radial-gradient(circle at 100% 100%, rgba(139, 92, 246, 0.18), transparent 44%),
    linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98)) !important;
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.42),
    0 0 46px rgba(20, 184, 166, 0.14),
    0 0 42px rgba(139, 92, 246, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.07) !important;
}

html.dark .your-moves-empty-icon,
html.dark .your-moves-empty-state > div:first-child,
html[data-theme="dark"] .your-moves-empty-icon,
html[data-theme="dark"] .your-moves-empty-state > div:first-child,
.dark .your-moves-empty-icon,
.dark .your-moves-empty-state > div:first-child,
[data-theme="dark"] .your-moves-empty-icon,
[data-theme="dark"] .your-moves-empty-state > div:first-child {
  background:
    linear-gradient(135deg, rgba(45, 212, 191, 0.34), rgba(139, 92, 246, 0.26)) !important;
  color: #5eead4 !important;
  box-shadow:
    0 18px 48px rgba(20, 184, 166, 0.18),
    0 0 36px rgba(139, 92, 246, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.10) !important;
}

html.dark .your-moves-empty-icon svg,
html.dark .your-moves-empty-state > div:first-child svg,
html[data-theme="dark"] .your-moves-empty-icon svg,
html[data-theme="dark"] .your-moves-empty-state > div:first-child svg,
.dark .your-moves-empty-icon svg,
.dark .your-moves-empty-state > div:first-child svg {
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
  border-color: rgba(148, 163, 184, 0.24) !important;
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
  background: rgba(15, 23, 42, 0.74) !important;
  box-shadow:
    0 12px 28px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.07) !important;
}

/* END YOUR MOVES EMPTY STATE DARKMODE FIX V2 */
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

if "YOUR MOVES EMPTY STATE DARKMODE FIX V2" not in css:
    shutil.copy2(jsx_backup, jsx_path)
    shutil.copy2(css_backup, css_path)
    raise RuntimeError("Patch failed. Missing CSS marker. Original restored.")

jsx_path.write_text(jsx)
css_path.write_text(css)

print("YourMovesToday EmptyState dark-mode fix v2 applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Added your-moves-empty-state to the actual EmptyState root div")
print("- Added your-moves-empty-icon when possible")
print("- Added scoped CSS so All caught up is not bright white in dark mode")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No focus engine logic changed.")
print("No move completion/snooze logic changed.")
