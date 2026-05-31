from pathlib import Path
from datetime import datetime
import re
import shutil

JSX_PATH = Path("src/pages/Profile.jsx")
CSS_PATH = Path("src/pages/Profile.css")

STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")

if not JSX_PATH.exists():
    raise FileNotFoundError(f"Missing file: {JSX_PATH}")

if not CSS_PATH.exists():
    raise FileNotFoundError(f"Missing file: {CSS_PATH}")

jsx_original = JSX_PATH.read_text()
css_original = CSS_PATH.read_text()

jsx_backup = JSX_PATH.with_suffix(JSX_PATH.suffix + f".backup-edit-cta-final-{STAMP}")
css_backup = CSS_PATH.with_suffix(CSS_PATH.suffix + f".backup-edit-cta-final-{STAMP}")

shutil.copy2(JSX_PATH, jsx_backup)
shutil.copy2(CSS_PATH, css_backup)

jsx = jsx_original
css = css_original

# ─────────────────────────────────────────────────────────────
# 1. Ensure Profile.css is imported
# ─────────────────────────────────────────────────────────────
if 'import "./Profile.css";' not in jsx and "import './Profile.css';" not in jsx:
    import_anchor = 'import { useAnalytics } from "../contexts/AnalyticsContext";'
    if import_anchor in jsx:
        jsx = jsx.replace(import_anchor, import_anchor + '\nimport "./Profile.css";', 1)
    else:
        # Safe fallback: place after last import line.
        lines = jsx.splitlines()
        last_import_idx = None
        for i, line in enumerate(lines):
            if line.startswith("import "):
                last_import_idx = i
        if last_import_idx is None:
            raise RuntimeError("Could not find import section in Profile.jsx. No changes were written.")
        lines.insert(last_import_idx + 1, 'import "./Profile.css";')
        jsx = "\n".join(lines) + "\n"

# ─────────────────────────────────────────────────────────────
# 2. Replace the real HERO Edit Profile button only
#    This avoids regex-patching onClick bodies.
# ─────────────────────────────────────────────────────────────
header_idx = jsx.find("HEADER SECTION")
if header_idx == -1:
    # Fallback: use first ProfilePhotoEditor occurrence as the hero area.
    header_idx = jsx.find("<ProfilePhotoEditor")

if header_idx == -1:
    raise RuntimeError("Could not locate the Profile hero/header area. No changes were written.")

# Find the Edit Profile text inside the hero area, not the modal title.
edit_text_idx = jsx.find("Edit Profile", header_idx)
if edit_text_idx == -1:
    raise RuntimeError("Could not find the hero Edit Profile text. No changes were written.")

button_start = jsx.rfind("<button", header_idx, edit_text_idx)
if button_start == -1:
    raise RuntimeError("Could not find the opening <button> for the hero Edit Profile button. No changes were written.")

button_end = jsx.find("</button>", edit_text_idx)
if button_end == -1:
    raise RuntimeError("Could not find the closing </button> for the hero Edit Profile button. No changes were written.")

button_end += len("</button>")
old_button = jsx[button_start:button_end]

if "Edit Profile" not in old_button:
    raise RuntimeError("Safety check failed: selected button does not contain Edit Profile. No changes were written.")

# Preserve your current click handler if it exists.
onclick_match = re.search(r'onClick=\{([^}]+)\}', old_button)
if onclick_match:
    onclick_attr = f"onClick={{{onclick_match.group(1)}}}"
elif "handleEditProfile" in jsx:
    onclick_attr = "onClick={handleEditProfile}"
else:
    onclick_attr = "onClick={() => setShowEditModal(true)}"

new_button = f'''<button
              type="button"
              {onclick_attr}
              className="profile-edit-cta inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold transition-all duration-200"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>'''

jsx = jsx[:button_start] + new_button + jsx[button_end:]

# ─────────────────────────────────────────────────────────────
# 3. Remove older conflicting Profile button CSS patches
# ─────────────────────────────────────────────────────────────
old_markers = [
    "PROFILE EDIT BUTTON PURPLE v8",
    "PROFILE EDIT BUTTON FORCE PURPLE v9",
    "PROFILE ACTION BUTTONS v10",
    "PROFILE BUTTON FINAL v11",
    "PROFILE REAL ACTION BUTTONS v12",
    "PROFILE BUTTON PURPLE FILL v13",
    "PROFILE EDIT REAL PURPLE v16",
    "PROFILE EDIT CTA FINAL v17",
    "Real Profile Hero \"Edit Profile\" button",
]

def remove_block_by_marker(text, marker):
    idx = text.find(marker)
    while idx != -1:
        # Go back to the start of the comment block.
        start = text.rfind("/*", 0, idx)
        if start == -1:
            start = idx

        # Find the next large CSS comment after this block.
        next_a = text.find("\n/* ═", idx + len(marker))
        next_b = text.find("\n/* ===", idx + len(marker))
        next_c = text.find("\n/* ─", idx + len(marker))

        candidates = [x for x in [next_a, next_b, next_c] if x != -1]
        end = min(candidates) if candidates else len(text)

        text = text[:start].rstrip() + "\n\n" + text[end:].lstrip()
        idx = text.find(marker)
    return text

for marker in old_markers:
    css = remove_block_by_marker(css, marker)

# Also remove any prior standalone .profile-edit-cta block if one exists.
css = re.sub(
    r'\n/\* =========================================================\n\s*Real Profile Hero "Edit Profile" button\n[\s\S]*?\n\.profile-edit-cta:focus-visible \{[\s\S]*?\n\}\n',
    "\n",
    css,
)

final_css = r'''
/* =========================================================
   Real Profile Hero "Edit Profile" button
   ========================================================= */

.profile-edit-cta {
  background: linear-gradient(135deg, #a855f7 0%, #7c3aed 55%, #6d28d9 100%) !important;
  color: #ffffff !important;
  border: 1px solid rgba(139, 92, 246, 0.95) !important;
  box-shadow:
    0 14px 32px rgba(124, 58, 237, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.18) !important;
  opacity: 1 !important;
}

.profile-edit-cta,
.profile-edit-cta span,
.profile-edit-cta svg {
  color: #ffffff !important;
  fill: none;
  stroke: currentColor;
  opacity: 1 !important;
}

.profile-edit-cta:hover {
  background: linear-gradient(135deg, #c084fc 0%, #8b5cf6 50%, #7c3aed 100%) !important;
  transform: translateY(-1px);
  box-shadow:
    0 18px 36px rgba(124, 58, 237, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.22) !important;
}

.profile-edit-cta:active {
  transform: translateY(0);
}

.profile-edit-cta:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 4px rgba(196, 181, 253, 0.55),
    0 14px 32px rgba(124, 58, 237, 0.28) !important;
}
'''

css = css.rstrip() + "\n\n" + final_css.strip() + "\n"

# ─────────────────────────────────────────────────────────────
# 4. Safety checks before writing
# ─────────────────────────────────────────────────────────────
bad_patterns = [
    "onClick={() =",
    "onClick={(}",
    "className={}",
]

for bad in bad_patterns:
    if bad in jsx:
        JSX_PATH.write_text(jsx_original)
        CSS_PATH.write_text(css_original)
        raise RuntimeError(f"Unsafe JSX corruption pattern detected: {bad}. Original restored. No changes were written.")

if jsx.count("profile-edit-cta") < 1:
    JSX_PATH.write_text(jsx_original)
    CSS_PATH.write_text(css_original)
    raise RuntimeError("profile-edit-cta was not added to Profile.jsx. Original restored.")

if css.count(".profile-edit-cta") < 1:
    JSX_PATH.write_text(jsx_original)
    CSS_PATH.write_text(css_original)
    raise RuntimeError("profile-edit-cta CSS was not added to Profile.css. Original restored.")

JSX_PATH.write_text(jsx)
CSS_PATH.write_text(css)

print("Profile Edit Profile CTA fix applied successfully.")
print(f"Updated file: {JSX_PATH}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {CSS_PATH}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Imported Profile.css if it was missing")
print("- Replaced the real hero Edit Profile button with a unique profile-edit-cta class")
print("- Removed older conflicting Profile button CSS blocks")
print("- Appended one clean final purple Edit Profile CTA style")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No profile loading, editing, upload, analytics, or save logic was changed.")
