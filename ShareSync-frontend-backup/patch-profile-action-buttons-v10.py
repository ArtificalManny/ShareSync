from pathlib import Path
from datetime import datetime
import re

jsx_path = Path("src/pages/Profile.jsx")
css_path = Path("src/pages/Profile.css")

jsx = jsx_path.read_text()
css = css_path.read_text()

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
jsx_backup = jsx_path.with_suffix(jsx_path.suffix + f".backup-profile-action-buttons-v10-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-profile-action-buttons-v10-{stamp}")

jsx_backup.write_text(jsx)
css_backup.write_text(css)

def add_data_attr_to_button_with_label(source, label, attr_value):
    pattern = re.compile(r'(<button\b[\s\S]*?>[\s\S]*?' + re.escape(label) + r'[\s\S]*?</button>)', re.MULTILINE)

    def repl(match):
        block = match.group(1)
        if f'data-profile-action="{attr_value}"' in block:
            return block

        # Add attribute to opening button tag only.
        return re.sub(
            r'<button\b',
            f'<button data-profile-action="{attr_value}"',
            block,
            count=1
        )

    new_source, count = pattern.subn(repl, source, count=1)
    if count != 1:
        raise RuntimeError(f"Could not find the '{label}' button. No changes were written.")
    return new_source

jsx = add_data_attr_to_button_with_label(jsx, "Edit Profile", "edit-profile")
jsx = add_data_attr_to_button_with_label(jsx, "Save Changes", "save-profile")

css_patch = r'''

/* ═══════════════════════════════════════════════════════════════════════
   PROFILE ACTION BUTTONS v10
   Fixes:
   - Edit Profile button visibility
   - Save Changes button visibility inside Edit Profile modal
   Uses data attributes so this does not depend on fragile Tailwind class names.
   ═══════════════════════════════════════════════════════════════════════ */

button[data-profile-action="edit-profile"],
.profile-visual-shell button[data-profile-action="edit-profile"] {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0.55rem !important;

  min-height: 46px !important;
  padding: 0.78rem 1.6rem !important;
  border-radius: 999px !important;

  background: linear-gradient(135deg, #9333ea 0%, #7c3aed 48%, #6d28d9 100%) !important;
  border: 1px solid rgba(221, 214, 254, 0.95) !important;

  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 1 !important;

  font-weight: 900 !important;
  letter-spacing: -0.01em !important;
  text-shadow: 0 1px 2px rgba(15, 23, 42, 0.34) !important;

  box-shadow:
    0 18px 42px rgba(124, 58, 237, 0.42),
    0 0 0 5px rgba(139, 92, 246, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.36) !important;

  filter: none !important;
  mix-blend-mode: normal !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

button[data-profile-action="edit-profile"] *,
button[data-profile-action="edit-profile"] svg {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 1 !important;
  stroke: currentColor !important;
  filter: none !important;
  mix-blend-mode: normal !important;
}

button[data-profile-action="edit-profile"]:hover {
  transform: translateY(-2px) !important;
  background: linear-gradient(135deg, #a855f7 0%, #8b5cf6 45%, #7c3aed 100%) !important;
  box-shadow:
    0 24px 54px rgba(124, 58, 237, 0.50),
    0 0 0 6px rgba(139, 92, 246, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.42) !important;
}

/* Save Changes inside Edit Profile modal */
button[data-profile-action="save-profile"],
.profile-visual-shell button[data-profile-action="save-profile"] {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0.55rem !important;

  min-height: 44px !important;
  padding: 0.72rem 1.45rem !important;
  border-radius: 999px !important;

  background: linear-gradient(135deg, #9333ea 0%, #7c3aed 48%, #6d28d9 100%) !important;
  border: 1px solid rgba(221, 214, 254, 0.92) !important;

  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 1 !important;

  font-weight: 900 !important;
  text-shadow: 0 1px 2px rgba(15, 23, 42, 0.34) !important;

  box-shadow:
    0 16px 34px rgba(124, 58, 237, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.32) !important;

  filter: none !important;
  mix-blend-mode: normal !important;
}

button[data-profile-action="save-profile"] *,
button[data-profile-action="save-profile"] svg {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 1 !important;
  stroke: currentColor !important;
  filter: none !important;
  mix-blend-mode: normal !important;
}

/* Disabled state should still be readable, just visually softer */
button[data-profile-action="save-profile"]:disabled,
.profile-visual-shell button[data-profile-action="save-profile"]:disabled {
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 48%, #7c3aed 100%) !important;
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 0.72 !important;
  cursor: not-allowed !important;
  border-color: rgba(221, 214, 254, 0.78) !important;
  box-shadow:
    0 10px 24px rgba(124, 58, 237, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.28) !important;
}

button[data-profile-action="save-profile"]:not(:disabled):hover {
  transform: translateY(-2px) !important;
  background: linear-gradient(135deg, #a855f7 0%, #8b5cf6 45%, #7c3aed 100%) !important;
  box-shadow:
    0 22px 48px rgba(124, 58, 237, 0.46),
    inset 0 1px 0 rgba(255, 255, 255, 0.40) !important;
}
'''

if "PROFILE ACTION BUTTONS v10" not in css:
    css = css.rstrip() + "\n" + css_patch + "\n"

jsx_path.write_text(jsx)
css_path.write_text(css)

print("Profile action buttons v10 patch applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Added data-profile-action attributes to Edit Profile and Save Changes buttons")
print("- Added CSS to make both buttons readable purple")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No profile loading, editing, upload, analytics, or save logic changed.")
