from pathlib import Path
from datetime import datetime
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

jsx_backup = JSX_PATH.with_suffix(JSX_PATH.suffix + f".backup-edit-cta-v2-{STAMP}")
css_backup = CSS_PATH.with_suffix(CSS_PATH.suffix + f".backup-edit-cta-v2-{STAMP}")

shutil.copy2(JSX_PATH, jsx_backup)
shutil.copy2(CSS_PATH, css_backup)

jsx = jsx_original
css = css_original

# ─────────────────────────────────────────────────────────────
# 1. Ensure Profile.css is imported.
# ─────────────────────────────────────────────────────────────
if 'import "./Profile.css";' not in jsx and "import './Profile.css';" not in jsx:
    import_anchor = 'import { useAnalytics } from "../contexts/AnalyticsContext";'

    if import_anchor in jsx:
        jsx = jsx.replace(import_anchor, import_anchor + '\nimport "./Profile.css";', 1)
    else:
        lines = jsx.splitlines()
        last_import_idx = None

        for i, line in enumerate(lines):
          if line.startswith("import "):
              last_import_idx = i

        if last_import_idx is None:
            JSX_PATH.write_text(jsx_original)
            CSS_PATH.write_text(css_original)
            raise RuntimeError("Could not find import section. Original restored.")

        lines.insert(last_import_idx + 1, 'import "./Profile.css";')
        jsx = "\n".join(lines) + "\n"

# ─────────────────────────────────────────────────────────────
# 2. Find the HERO Edit Profile button only.
#    We start after HEADER SECTION so we do not touch modal title/buttons.
# ─────────────────────────────────────────────────────────────
header_idx = jsx.find("HEADER SECTION")

if header_idx == -1:
    header_idx = jsx.find("<ProfilePhotoEditor")

if header_idx == -1:
    JSX_PATH.write_text(jsx_original)
    CSS_PATH.write_text(css_original)
    raise RuntimeError("Could not locate Profile hero/header area. Original restored.")

edit_idx = jsx.find("Edit Profile", header_idx)

if edit_idx == -1:
    JSX_PATH.write_text(jsx_original)
    CSS_PATH.write_text(css_original)
    raise RuntimeError("Could not find hero Edit Profile text. Original restored.")

button_start = jsx.rfind("<button", header_idx, edit_idx)
button_end = jsx.find("</button>", edit_idx)

if button_start == -1 or button_end == -1:
    JSX_PATH.write_text(jsx_original)
    CSS_PATH.write_text(css_original)
    raise RuntimeError("Could not isolate hero Edit Profile button. Original restored.")

button_end += len("</button>")
old_button = jsx[button_start:button_end]

if "Edit Profile" not in old_button:
    JSX_PATH.write_text(jsx_original)
    CSS_PATH.write_text(css_original)
    raise RuntimeError("Safety check failed: selected block is not the Edit Profile button. Original restored.")

# Use the existing handleEditProfile function from Profile.jsx.
new_button = '''<button
              type="button"
              onClick={handleEditProfile}
              data-profile-action="edit-profile"
              data-profile-edit-real-v18="true"
              className="profile-edit-cta mt-6 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all duration-200"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>'''

jsx = jsx[:button_start] + new_button + jsx[button_end:]

# ─────────────────────────────────────────────────────────────
# 3. Append final high-specificity CSS.
#    Do not remove old CSS. Let this final block win by being last.
# ─────────────────────────────────────────────────────────────
FINAL_MARKER = "PROFILE EDIT CTA FINAL v18"

if FINAL_MARKER in css:
    start = css.find(f"/* ═══════════════════════════════════════════════════════════════════════\n   {FINAL_MARKER}")
    if start != -1:
        css = css[:start].rstrip()

final_css = r'''
/* ═══════════════════════════════════════════════════════════════════════
   PROFILE EDIT CTA FINAL v18
   Purpose:
   - Make the real hero Edit Profile button a visible purple pill
   - Avoid broad selectors that accidentally affect the modal close button
   - Keep this scoped to the unique data attribute and class
   ═══════════════════════════════════════════════════════════════════════ */

html body button.profile-edit-cta[data-profile-edit-real-v18="true"],
html body .profile-visual-shell button.profile-edit-cta[data-profile-edit-real-v18="true"],
html body .profile-hero-surface button.profile-edit-cta[data-profile-edit-real-v18="true"] {
  appearance: none !important;
  -webkit-appearance: none !important;

  position: relative !important;
  z-index: 10 !important;
  isolation: isolate !important;
  overflow: hidden !important;

  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0.5rem !important;

  min-width: 152px !important;
  min-height: 46px !important;
  padding: 0.78rem 1.65rem !important;

  border-radius: 999px !important;
  border: 1px solid rgba(221, 214, 254, 0.98) !important;

  background-color: #7c3aed !important;
  background-image: linear-gradient(135deg, #a855f7 0%, #7c3aed 52%, #6d28d9 100%) !important;
  background-blend-mode: normal !important;
  background-clip: padding-box !important;

  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;

  font-size: 0.95rem !important;
  font-weight: 900 !important;
  line-height: 1 !important;
  letter-spacing: -0.01em !important;
  text-align: center !important;
  text-shadow: 0 1px 2px rgba(15, 23, 42, 0.36) !important;

  opacity: 1 !important;
  visibility: visible !important;
  cursor: pointer !important;

  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.36),
    0 18px 42px rgba(124, 58, 237, 0.42),
    0 0 0 5px rgba(139, 92, 246, 0.13) !important;

  filter: none !important;
  mix-blend-mode: normal !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

html body button.profile-edit-cta[data-profile-edit-real-v18="true"] *,
html body button.profile-edit-cta[data-profile-edit-real-v18="true"] span,
html body button.profile-edit-cta[data-profile-edit-real-v18="true"] svg {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 1 !important;
  stroke: currentColor !important;
  fill: none !important;
  filter: none !important;
  mix-blend-mode: normal !important;
}

html body button.profile-edit-cta[data-profile-edit-real-v18="true"]::before,
html body button.profile-edit-cta[data-profile-edit-real-v18="true"]::after {
  content: none !important;
  display: none !important;
}

html body button.profile-edit-cta[data-profile-edit-real-v18="true"]:hover {
  transform: translateY(-2px) !important;
  background-color: #8b5cf6 !important;
  background-image: linear-gradient(135deg, #c084fc 0%, #8b5cf6 46%, #7c3aed 100%) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.44),
    0 24px 54px rgba(124, 58, 237, 0.50),
    0 0 0 6px rgba(139, 92, 246, 0.18) !important;
}

html body button.profile-edit-cta[data-profile-edit-real-v18="true"]:active {
  transform: translateY(0) !important;
}

html body button.profile-edit-cta[data-profile-edit-real-v18="true"]:focus-visible {
  outline: none !important;
  box-shadow:
    0 0 0 4px rgba(196, 181, 253, 0.58),
    0 18px 42px rgba(124, 58, 237, 0.42) !important;
}
'''

css = css.rstrip() + "\n\n" + final_css.strip() + "\n"

# ─────────────────────────────────────────────────────────────
# 4. Validate only what this script changed.
#    Do NOT scan the whole JSX file for old unrelated patterns.
# ─────────────────────────────────────────────────────────────
if 'data-profile-edit-real-v18="true"' not in jsx:
    JSX_PATH.write_text(jsx_original)
    CSS_PATH.write_text(css_original)
    raise RuntimeError("New hero Edit Profile marker was not added. Original restored.")

if "PROFILE EDIT CTA FINAL v18" not in css:
    JSX_PATH.write_text(jsx_original)
    CSS_PATH.write_text(css_original)
    raise RuntimeError("Final CSS block was not added. Original restored.")

if "onClick={() =" in new_button:
    JSX_PATH.write_text(jsx_original)
    CSS_PATH.write_text(css_original)
    raise RuntimeError("New button contains unsafe JSX. Original restored.")

JSX_PATH.write_text(jsx)
CSS_PATH.write_text(css)

print("Profile hero Edit Profile button purple fix applied successfully.")
print(f"Updated file: {JSX_PATH}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {CSS_PATH}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Imported Profile.css if missing")
print("- Replaced only the hero Edit Profile button")
print("- Added a unique data-profile-edit-real-v18 marker")
print("- Appended one final high-specificity purple button CSS block")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No profile loading, save, upload, modal, analytics, or growth logic changed.")
