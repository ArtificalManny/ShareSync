from pathlib import Path
from datetime import datetime
import shutil
import re

drawer_path = Path("src/components/global/QuickNotesDrawer.jsx")
css_path = Path("src/index.css")

if not drawer_path.exists():
    raise FileNotFoundError("Could not find src/components/global/QuickNotesDrawer.jsx")

if not css_path.exists():
    raise FileNotFoundError("Could not find src/index.css")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
drawer_backup = drawer_path.with_suffix(drawer_path.suffix + f".backup-quick-notes-plus-v2-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-quick-notes-plus-v2-{stamp}")

shutil.copy2(drawer_path, drawer_backup)
shutil.copy2(css_path, css_backup)

drawer = drawer_path.read_text()
css = css_path.read_text()

if "handleNew" not in drawer or "createNote" not in drawer or "setActiveNote" not in drawer:
    raise RuntimeError("Could not verify QuickNotesDrawer note creation logic. No changes written.")

if "Plus" not in drawer:
    raise RuntimeError("QuickNotesDrawer does not appear to import/use Plus. No changes written.")

def add_class_to_button_tags(source, onclick_text, class_name):
    matches = list(re.finditer(r"<button\b[\s\S]*?>", source))
    offset = 0

    for match in matches:
        start = match.start() + offset
        end = match.end() + offset
        tag = source[start:end]

        if onclick_text not in tag:
            continue

        if class_name in tag:
            continue

        if 'className="' in tag:
            new_tag = re.sub(
                r'(className=")([^"]*)(")',
                lambda m: f'{m.group(1)}{class_name} {m.group(2)}{m.group(3)}',
                tag,
                count=1,
            )
        elif "className={`" in tag:
            new_tag = re.sub(
                r'(className=\{`)',
                lambda m: f'{m.group(1)}{class_name} ',
                tag,
                count=1,
            )
        else:
            new_tag = tag[:-1] + f' className="{class_name}">'

        source = source[:start] + new_tag + source[end:]
        offset += len(new_tag) - len(tag)

    return source

# Add a visual class to the drawer shell.
if "quick-notes-drawer-polished" not in drawer:
    drawer = drawer.replace(
        "className={`quick-notes-drawer fixed",
        "className={`quick-notes-drawer quick-notes-drawer-polished fixed",
        1,
    )

# Make every existing handleNew button visually intentional.
drawer = add_class_to_button_tags(drawer, "onClick={handleNew}", "quick-notes-add-button")

# Add a small + button to the left notes list header.
if "quick-notes-list-toolbar" not in drawer:
    exact_nav = '<nav className="quick-notes-list w-40 shrink-0 overflow-y-auto border-r border-slate-200 dark:border-white/10">'
    toolbar = '''<nav className="quick-notes-list w-40 shrink-0 overflow-y-auto border-r border-slate-200 dark:border-white/10">
            <div className="quick-notes-list-toolbar">
              <span className="quick-notes-list-label">Notes</span>

              <button
                type="button"
                onClick={handleNew}
                className="quick-notes-list-add-button"
                title="Create new note"
                aria-label="Create new note"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>'''

    if exact_nav in drawer:
        drawer = drawer.replace(exact_nav, toolbar, 1)
    else:
        match = re.search(r'<nav\s+className="quick-notes-list[^"]*">', drawer)
        if not match:
            shutil.copy2(drawer_backup, drawer_path)
            shutil.copy2(css_backup, css_path)
            raise RuntimeError(
                "Could not find Quick Notes list nav. Original restored.\n"
                "Run this:\n"
                "grep -n -B 10 -A 30 \"quick-notes-list\" src/components/global/QuickNotesDrawer.jsx"
            )

        tag = match.group(0)
        inserted = tag + '''
            <div className="quick-notes-list-toolbar">
              <span className="quick-notes-list-label">Notes</span>

              <button
                type="button"
                onClick={handleNew}
                className="quick-notes-list-add-button"
                title="Create new note"
                aria-label="Create new note"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>'''
        drawer = drawer[:match.start()] + inserted + drawer[match.end():]

# Add a more useful create button to the right-side empty editor state.
if "quick-notes-editor-create-button" not in drawer:
    old_empty_editor = '''<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Or create a new note from the top-right button
                  </p>'''

    new_empty_editor = '''<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Or create a new note from here.
                  </p>

                  <button
                    type="button"
                    onClick={handleNew}
                    className="quick-notes-editor-create-button mt-4 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Note
                  </button>'''

    if old_empty_editor in drawer:
        drawer = drawer.replace(old_empty_editor, new_empty_editor, 1)

# Make the empty-state Create one button visually stronger.
drawer = drawer.replace(
    'className="quick-notes-add-button mt-3 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-700"',
    'className="quick-notes-add-button quick-notes-empty-create-button mt-3 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-700"',
)

drawer = drawer.replace(
    'className="mt-3 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-700"',
    'className="quick-notes-add-button quick-notes-empty-create-button mt-3 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-700"',
)

# Remove older CSS block if rerunning.
css = re.sub(
    r"/\* =========================================================\n"
    r"   QUICK NOTES ADD BUTTON POLISH V2\n"
    r"   ========================================================= \*/\n"
    r".*?"
    r"/\* END QUICK NOTES ADD BUTTON POLISH V2 \*/\n?",
    "",
    css,
    flags=re.DOTALL,
)

css_patch = r'''
/* =========================================================
   QUICK NOTES ADD BUTTON POLISH V2
   Clear + actions and stronger dark-mode design for Quick Notes.
   ========================================================= */

.quick-notes-drawer-polished {
  overflow: hidden;
}

.quick-notes-list-toolbar {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.7rem 0.75rem;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.9));
  backdrop-filter: blur(14px);
}

.quick-notes-list-label {
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(71, 85, 105, 0.88);
}

.quick-notes-list-add-button,
.quick-notes-add-button,
.quick-notes-editor-create-button,
.quick-notes-empty-create-button {
  position: relative;
  isolation: isolate;
}

.quick-notes-list-add-button,
.quick-notes-add-button,
.quick-notes-editor-create-button,
.quick-notes-empty-create-button {
  background:
    radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.42), transparent 34%),
    linear-gradient(135deg, #a855f7 0%, #7c3aed 55%, #6d28d9 100%) !important;
  color: #ffffff !important;
  border: 1px solid rgba(196, 181, 253, 0.75) !important;
  box-shadow:
    0 12px 26px rgba(124, 58, 237, 0.24),
    0 0 18px rgba(139, 92, 246, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.22) !important;
}

.quick-notes-list-add-button {
  display: inline-flex;
  width: 2rem;
  height: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    filter 180ms ease;
}

.quick-notes-list-add-button:hover,
.quick-notes-add-button:hover,
.quick-notes-editor-create-button:hover,
.quick-notes-empty-create-button:hover {
  transform: translateY(-1px);
  filter: brightness(1.06);
}

.quick-notes-list-add-button:active,
.quick-notes-add-button:active,
.quick-notes-editor-create-button:active,
.quick-notes-empty-create-button:active {
  transform: translateY(0);
}

.quick-notes-list-add-button svg,
.quick-notes-add-button svg,
.quick-notes-editor-create-button svg {
  color: #ffffff !important;
  stroke: currentColor !important;
}

.quick-notes-editor-create-button {
  min-height: 2.4rem;
}

/* Dark mode */
html.dark .quick-notes-drawer-polished,
html[data-theme="dark"] .quick-notes-drawer-polished,
.dark .quick-notes-drawer-polished,
[data-theme="dark"] .quick-notes-drawer-polished {
  background:
    radial-gradient(circle at 0% 0%, rgba(139, 92, 246, 0.16), transparent 36%),
    radial-gradient(circle at 100% 100%, rgba(34, 211, 238, 0.10), transparent 34%),
    #0f172a !important;
  border-left-color: rgba(167, 139, 250, 0.20) !important;
}

html.dark .quick-notes-list-toolbar,
html[data-theme="dark"] .quick-notes-list-toolbar,
.dark .quick-notes-list-toolbar,
[data-theme="dark"] .quick-notes-list-toolbar {
  border-bottom-color: rgba(148, 163, 184, 0.16);
  background:
    radial-gradient(circle at 0% 0%, rgba(139, 92, 246, 0.18), transparent 42%),
    linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.94));
  box-shadow:
    0 12px 28px rgba(0, 0, 0, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

html.dark .quick-notes-list-label,
html[data-theme="dark"] .quick-notes-list-label,
.dark .quick-notes-list-label,
[data-theme="dark"] .quick-notes-list-label {
  color: rgba(226, 232, 240, 0.86);
  text-shadow: 0 0 18px rgba(139, 92, 246, 0.20);
}

html.dark .quick-notes-list-add-button,
html.dark .quick-notes-add-button,
html.dark .quick-notes-editor-create-button,
html.dark .quick-notes-empty-create-button,
html[data-theme="dark"] .quick-notes-list-add-button,
html[data-theme="dark"] .quick-notes-add-button,
html[data-theme="dark"] .quick-notes-editor-create-button,
html[data-theme="dark"] .quick-notes-empty-create-button,
.dark .quick-notes-list-add-button,
.dark .quick-notes-add-button,
.dark .quick-notes-editor-create-button,
.dark .quick-notes-empty-create-button,
[data-theme="dark"] .quick-notes-list-add-button,
[data-theme="dark"] .quick-notes-add-button,
[data-theme="dark"] .quick-notes-editor-create-button,
[data-theme="dark"] .quick-notes-empty-create-button {
  background:
    radial-gradient(circle at 28% 18%, rgba(255, 255, 255, 0.28), transparent 30%),
    linear-gradient(135deg, #c084fc 0%, #8b5cf6 48%, #06b6d4 100%) !important;
  color: #ffffff !important;
  border-color: rgba(216, 180, 254, 0.68) !important;
  box-shadow:
    0 16px 34px rgba(139, 92, 246, 0.30),
    0 0 26px rgba(34, 211, 238, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.18) !important;
}

html.dark .quick-notes-list-add-button:focus-visible,
html.dark .quick-notes-add-button:focus-visible,
html.dark .quick-notes-editor-create-button:focus-visible,
html.dark .quick-notes-empty-create-button:focus-visible,
.dark .quick-notes-list-add-button:focus-visible,
.dark .quick-notes-add-button:focus-visible,
.dark .quick-notes-editor-create-button:focus-visible,
.dark .quick-notes-empty-create-button:focus-visible {
  outline: none !important;
  box-shadow:
    0 0 0 4px rgba(196, 181, 253, 0.32),
    0 16px 34px rgba(139, 92, 246, 0.30),
    0 0 26px rgba(34, 211, 238, 0.14) !important;
}

/* END QUICK NOTES ADD BUTTON POLISH V2 */
'''

css = css.rstrip() + "\n\n" + css_patch.strip() + "\n"

# Real malformed pattern check only. Normal onClick={() => ...} is valid.
bad_patterns = [
    ("className={className={", "double className corruption"),
    ("onClick={() =}", "truly malformed empty onClick"),
]

for pattern, label in bad_patterns:
    if pattern in drawer:
        shutil.copy2(drawer_backup, drawer_path)
        shutil.copy2(css_backup, css_path)
        raise RuntimeError(f"Unsafe pattern detected: {label}. Original restored.")

if "quick-notes-list-toolbar" not in drawer:
    shutil.copy2(drawer_backup, drawer_path)
    shutil.copy2(css_backup, css_path)
    raise RuntimeError("Patch failed. Missing quick-notes-list-toolbar. Original restored.")

if "QUICK NOTES ADD BUTTON POLISH V2" not in css:
    shutil.copy2(drawer_backup, drawer_path)
    shutil.copy2(css_backup, css_path)
    raise RuntimeError("Patch failed. Missing CSS marker. Original restored.")

drawer_path.write_text(drawer)
css_path.write_text(css)

print("Quick Notes plus button polish v2 applied successfully.")
print(f"Updated file: {drawer_path}")
print(f"Backup file:  {drawer_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Added a visible + button to the Quick Notes list column")
print("- Made existing New Note buttons more visually striking")
print("- Added a New Note button to the empty editor state")
print("- Added scoped light/dark styling")
print("")
print("No backend files touched.")
print("No NotesContext data/storage logic changed.")
print("No note saving/deleting/pinning logic changed.")
