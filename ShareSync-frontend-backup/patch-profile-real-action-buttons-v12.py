from pathlib import Path
from datetime import datetime

jsx_path = Path("src/pages/Profile.jsx")
css_path = Path("src/pages/Profile.css")

jsx = jsx_path.read_text()
css = css_path.read_text()

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
jsx_backup = jsx_path.with_suffix(jsx_path.suffix + f".backup-real-action-buttons-v12-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-real-action-buttons-v12-{stamp}")

jsx_backup.write_text(jsx)
css_backup.write_text(css)

def find_open_tag_end(source, start):
    quote = None
    brace_depth = 0
    i = start

    while i < len(source):
        ch = source[i]

        if quote:
            if ch == "\\":
                i += 2
                continue
            if ch == quote:
                quote = None
        else:
            if ch in ("'", '"', "`"):
                quote = ch
            elif ch == "{":
                brace_depth += 1
            elif ch == "}":
                brace_depth = max(0, brace_depth - 1)
            elif ch == ">" and brace_depth == 0:
                return i

        i += 1

    return -1

def inject_data_attr_into_button_with_label(source, label, attr_value):
    tag_types = [
        ("<button", "</button>"),
        ("<motion.button", "</motion.button>"),
    ]

    candidates = []

    for open_token, close_token in tag_types:
        search_from = 0
        while True:
            start = source.find(open_token, search_from)
            if start == -1:
                break

            open_end = find_open_tag_end(source, start)
            if open_end == -1:
                raise RuntimeError(f"Could not parse opening tag for {open_token} near index {start}.")

            close = source.find(close_token, open_end)
            if close == -1:
                search_from = open_end + 1
                continue

            block = source[start:close + len(close_token)]

            if label in block:
                candidates.append((start, open_end, close + len(close_token), open_token, block))

            search_from = close + len(close_token)

    if not candidates:
        raise RuntimeError(
            f"Could not find a real button containing label: {label}. "
            f"Run: grep -n \"{label}\" src/pages/Profile.jsx"
        )

    # Use the first real button containing the label.
    start, open_end, block_end, open_token, block = candidates[0]
    opening = source[start:open_end]

    if f'data-profile-action="{attr_value}"' in opening:
        return source

    new_opening = opening.replace(
        open_token,
        f'{open_token} data-profile-action="{attr_value}"',
        1,
    )

    return source[:start] + new_opening + source[open_end:]

jsx = inject_data_attr_into_button_with_label(jsx, "Edit Profile", "edit-profile")
jsx = inject_data_attr_into_button_with_label(jsx, "Save Changes", "save-profile")

css_patch = r'''

/* ═══════════════════════════════════════════════════════════════════════
   PROFILE REAL ACTION BUTTONS v12
   These selectors target the actual buttons by data-profile-action.
   This bypasses the older washed-out Profile button styling.
   ═══════════════════════════════════════════════════════════════════════ */

/* Real Edit Profile hero button */
html body .profile-visual-shell.profile-visual-shell
.profile-hero-surface.profile-hero-surface
button[data-profile-action="edit-profile"][data-profile-action="edit-profile"],
html body button[data-profile-action="edit-profile"][data-profile-action="edit-profile"] {
  all: unset !important;
  box-sizing: border-box !important;

  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0.55rem !important;

  min-width: 150px !important;
  min-height: 46px !important;
  margin-top: 1.5rem !important;
  padding: 0.78rem 1.65rem !important;

  border-radius: 999px !important;
  border: 1px solid rgba(221, 214, 254, 0.98) !important;

  background: linear-gradient(135deg, #a855f7 0%, #7c3aed 48%, #6d28d9 100%) !important;
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;

  font-size: 0.95rem !important;
  font-weight: 900 !important;
  line-height: 1 !important;
  letter-spacing: -0.01em !important;
  text-align: center !important;
  text-shadow: 0 1px 2px rgba(15, 23, 42, 0.38) !important;

  opacity: 1 !important;
  visibility: visible !important;
  cursor: pointer !important;

  box-shadow:
    0 18px 42px rgba(124, 58, 237, 0.42),
    0 0 0 5px rgba(139, 92, 246, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.38) !important;

  filter: none !important;
  mix-blend-mode: normal !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

html body button[data-profile-action="edit-profile"][data-profile-action="edit-profile"] *,
html body button[data-profile-action="edit-profile"][data-profile-action="edit-profile"] svg {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 1 !important;
  stroke: currentColor !important;
  filter: none !important;
  mix-blend-mode: normal !important;
}

html body button[data-profile-action="edit-profile"][data-profile-action="edit-profile"]:hover {
  transform: translateY(-2px) !important;
  background: linear-gradient(135deg, #c084fc 0%, #8b5cf6 45%, #7c3aed 100%) !important;
  box-shadow:
    0 24px 54px rgba(124, 58, 237, 0.52),
    0 0 0 6px rgba(139, 92, 246, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.46) !important;
}

/* Real Save Changes modal button */
html body button[data-profile-action="save-profile"][data-profile-action="save-profile"] {
  box-sizing: border-box !important;

  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0.55rem !important;

  min-height: 44px !important;
  padding: 0.72rem 1.45rem !important;

  border-radius: 999px !important;
  border: 1px solid rgba(221, 214, 254, 0.95) !important;

  background: linear-gradient(135deg, #9333ea 0%, #7c3aed 48%, #6d28d9 100%) !important;
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;

  font-weight: 900 !important;
  text-shadow: 0 1px 2px rgba(15, 23, 42, 0.38) !important;

  opacity: 1 !important;
  visibility: visible !important;

  box-shadow:
    0 16px 34px rgba(124, 58, 237, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.32) !important;

  filter: none !important;
  mix-blend-mode: normal !important;
}

html body button[data-profile-action="save-profile"][data-profile-action="save-profile"] *,
html body button[data-profile-action="save-profile"][data-profile-action="save-profile"] svg {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 1 !important;
  stroke: currentColor !important;
  filter: none !important;
  mix-blend-mode: normal !important;
}

/* Disabled save button: still readable, but visibly inactive */
html body button[data-profile-action="save-profile"][data-profile-action="save-profile"]:disabled {
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 48%, #7c3aed 100%) !important;
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 0.78 !important;
  cursor: not-allowed !important;
  border-color: rgba(221, 214, 254, 0.82) !important;

  box-shadow:
    0 10px 24px rgba(124, 58, 237, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.28) !important;
}
'''

if "PROFILE REAL ACTION BUTTONS v12" not in css:
    css = css.rstrip() + "\n" + css_patch + "\n"

jsx_path.write_text(jsx)
css_path.write_text(css)

print("Profile real action buttons v12 patch applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Added data-profile-action to the REAL Edit Profile button")
print("- Added data-profile-action to the REAL Save Changes button")
print("- Added final CSS selectors targeting those real buttons")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No profile loading, editing, upload, analytics, or save logic changed.")
