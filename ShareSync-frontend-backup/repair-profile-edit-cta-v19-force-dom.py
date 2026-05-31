from pathlib import Path
from datetime import datetime
import shutil

JSX_PATH = Path("src/pages/Profile.jsx")
CSS_PATH = Path("src/pages/Profile.css")

STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")

jsx_original = JSX_PATH.read_text()
css_original = CSS_PATH.read_text()

jsx_backup = JSX_PATH.with_suffix(JSX_PATH.suffix + f".backup-edit-cta-v19-{STAMP}")
css_backup = CSS_PATH.with_suffix(CSS_PATH.suffix + f".backup-edit-cta-v19-{STAMP}")

shutil.copy2(JSX_PATH, jsx_backup)
shutil.copy2(CSS_PATH, css_backup)

jsx = jsx_original
css = css_original

# 1. Ensure Profile.css is imported.
if 'import "./Profile.css";' not in jsx and "import './Profile.css';" not in jsx:
    lines = jsx.splitlines()
    last_import_idx = None

    for i, line in enumerate(lines):
        if line.startswith("import "):
            last_import_idx = i

    if last_import_idx is None:
        raise RuntimeError("Could not find import section in Profile.jsx. No changes written.")

    lines.insert(last_import_idx + 1, 'import "./Profile.css";')
    jsx = "\n".join(lines) + "\n"


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


# 2. Find the real button/motion.button that contains visible "Edit Profile".
header_idx = jsx.find("HEADER SECTION")
if header_idx == -1:
    header_idx = jsx.find("<ProfilePhotoEditor")
if header_idx == -1:
    header_idx = 0

candidates = []

for open_token, close_token in [
    ("<motion.button", "</motion.button>"),
    ("<button", "</button>"),
]:
    pos = header_idx

    while True:
        start = jsx.find(open_token, pos)
        if start == -1:
            break

        open_end = find_open_tag_end(jsx, start)
        if open_end == -1:
            pos = start + len(open_token)
            continue

        close = jsx.find(close_token, open_end)
        if close == -1:
            pos = open_end + 1
            continue

        block_end = close + len(close_token)
        block = jsx[start:block_end]

        if "Edit Profile" in block and "Save Changes" not in block:
            score = 0
            if "handleEditProfile" in block:
                score += 100
            if "setShowEditModal" in block:
                score += 80
            if "Edit3" in block:
                score += 40
            if "profile-edit" in block:
                score += 20
            if start > header_idx:
                score += 10

            candidates.append((score, start, block_end, block))

        pos = block_end

if not candidates:
    raise RuntimeError(
        'Could not find a real button block containing "Edit Profile". '
        'Run: grep -n "Edit Profile\\|handleEditProfile\\|setShowEditModal\\|Edit3" src/pages/Profile.jsx'
    )

candidates.sort(reverse=True, key=lambda item: item[0])
score, button_start, button_end, old_button = candidates[0]

if "handleEditProfile" in jsx:
    onclick_line = "onClick={handleEditProfile}"
elif "setShowEditModal" in jsx:
    onclick_line = "onClick={() => setShowEditModal(true)}"
else:
    raise RuntimeError("Could not find handleEditProfile or setShowEditModal. No changes written.")

new_button = f'''<button
              type="button"
              {onclick_line}
              data-profile-edit-real-v19="true"
              className="profile-edit-cta-force-v19 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-black transition-all duration-200"
              ref={{(node) => {{
                if (!node) return;

                node.style.setProperty("appearance", "none", "important");
                node.style.setProperty("-webkit-appearance", "none", "important");
                node.style.setProperty("background", "linear-gradient(135deg, #a855f7 0%, #7c3aed 52%, #6d28d9 100%)", "important");
                node.style.setProperty("background-color", "#7c3aed", "important");
                node.style.setProperty("background-image", "linear-gradient(135deg, #a855f7 0%, #7c3aed 52%, #6d28d9 100%)", "important");
                node.style.setProperty("color", "#ffffff", "important");
                node.style.setProperty("-webkit-text-fill-color", "#ffffff", "important");
                node.style.setProperty("border", "1px solid rgba(221, 214, 254, 0.98)", "important");
                node.style.setProperty("opacity", "1", "important");
                node.style.setProperty("visibility", "visible", "important");
                node.style.setProperty("box-shadow", "0 18px 42px rgba(124, 58, 237, 0.42), 0 0 0 5px rgba(139, 92, 246, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.38)", "important");
                node.style.setProperty("filter", "none", "important");
                node.style.setProperty("mix-blend-mode", "normal", "important");
                node.style.setProperty("backdrop-filter", "none", "important");
                node.style.setProperty("-webkit-backdrop-filter", "none", "important");

                node.querySelectorAll("*").forEach((child) => {{
                  child.style.setProperty("color", "#ffffff", "important");
                  child.style.setProperty("-webkit-text-fill-color", "#ffffff", "important");
                  child.style.setProperty("opacity", "1", "important");
                  child.style.setProperty("filter", "none", "important");
                  child.style.setProperty("mix-blend-mode", "normal", "important");
                }});
              }}}}
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>'''

jsx = jsx[:button_start] + new_button + jsx[button_end:]


# 3. Add backup CSS. The ref above is the main force-fix.
css_marker = "PROFILE EDIT CTA FORCE DOM v19"

css_patch = r'''
/* ═══════════════════════════════════════════════════════════════════════
   PROFILE EDIT CTA FORCE DOM v19
   Backup CSS for the real hero Edit Profile button.
   Main force happens in Profile.jsx via ref + style.setProperty important.
   ═══════════════════════════════════════════════════════════════════════ */

html body button.profile-edit-cta-force-v19[data-profile-edit-real-v19="true"] {
  appearance: none !important;
  -webkit-appearance: none !important;
  background: linear-gradient(135deg, #a855f7 0%, #7c3aed 52%, #6d28d9 100%) !important;
  background-color: #7c3aed !important;
  background-image: linear-gradient(135deg, #a855f7 0%, #7c3aed 52%, #6d28d9 100%) !important;
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  border: 1px solid rgba(221, 214, 254, 0.98) !important;
  opacity: 1 !important;
  visibility: visible !important;
  box-shadow:
    0 18px 42px rgba(124, 58, 237, 0.42),
    0 0 0 5px rgba(139, 92, 246, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.38) !important;
  filter: none !important;
  mix-blend-mode: normal !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

html body button.profile-edit-cta-force-v19[data-profile-edit-real-v19="true"] *,
html body button.profile-edit-cta-force-v19[data-profile-edit-real-v19="true"] svg,
html body button.profile-edit-cta-force-v19[data-profile-edit-real-v19="true"] span {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 1 !important;
  stroke: currentColor !important;
  fill: none !important;
  filter: none !important;
  mix-blend-mode: normal !important;
}

html body button.profile-edit-cta-force-v19[data-profile-edit-real-v19="true"]::before,
html body button.profile-edit-cta-force-v19[data-profile-edit-real-v19="true"]::after {
  content: none !important;
  display: none !important;
}

html body button.profile-edit-cta-force-v19[data-profile-edit-real-v19="true"]:hover {
  transform: translateY(-2px) !important;
  background: linear-gradient(135deg, #c084fc 0%, #8b5cf6 46%, #7c3aed 100%) !important;
}
'''

if css_marker not in css:
    css = css.rstrip() + "\n\n" + css_patch.strip() + "\n"


# 4. Validate only the new button, not unrelated old file content.
if 'data-profile-edit-real-v19="true"' not in jsx:
    JSX_PATH.write_text(jsx_original)
    CSS_PATH.write_text(css_original)
    raise RuntimeError("v19 marker was not added. Original restored.")

if "PROFILE EDIT CTA FORCE DOM v19" not in css:
    JSX_PATH.write_text(jsx_original)
    CSS_PATH.write_text(css_original)
    raise RuntimeError("v19 CSS was not added. Original restored.")

JSX_PATH.write_text(jsx)
CSS_PATH.write_text(css)

print("Profile hero Edit Profile v19 force-DOM patch applied successfully.")
print(f"Updated file: {JSX_PATH}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {CSS_PATH}")
print(f"Backup file:  {css_backup}")
print("")
print("Matched button score:", score)
print("")
print("Changed only:")
print("- Replaced the real hero Edit Profile button")
print("- Added a unique v19 data marker")
print("- Forced button fill using ref + style.setProperty(..., important)")
print("- Added backup CSS for the same exact button")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No profile loading, save, upload, modal, analytics, or growth logic changed.")
