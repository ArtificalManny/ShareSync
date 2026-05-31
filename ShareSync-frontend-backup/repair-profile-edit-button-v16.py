from pathlib import Path
from datetime import datetime
import re

jsx_path = Path("src/pages/Profile.jsx")
css_path = Path("src/pages/Profile.css")

jsx = jsx_path.read_text()
css = css_path.read_text()

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
jsx_backup = jsx_path.with_suffix(jsx_path.suffix + f".backup-profile-edit-button-v16-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-profile-edit-button-v16-{stamp}")

jsx_backup.write_text(jsx)
css_backup.write_text(css)

# 1) Remove the bad broad v14 block that caused the giant purple blob.
css = re.sub(
    r'\n?/\* ═+\s*\n\s*PROFILE EDIT BUTTON FILL v14[\s\S]*?(?=\n/\* ═+|\Z)',
    '\n',
    css,
    count=1
)

# 2) Find JSX opening tag end safely.
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

# 3) Collect real button/motion.button blocks containing "Edit Profile".
candidates = []

for open_token, close_token in [
    ("<motion.button", "</motion.button>"),
    ("<button", "</button>"),
]:
    pos = 0
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

        if "Edit Profile" in block:
            score = 0
            if "handleEditProfile" in block:
                score += 100
            if "Edit3" in block:
                score += 50
            if "profile" in block.lower():
                score += 10
            candidates.append((score, start, open_end, block_end, open_token, close_token, block))

        pos = block_end

if not candidates:
    raise RuntimeError(
        'Could not find any real <button> or <motion.button> block containing "Edit Profile". '
        'Run: grep -n "Edit Profile\\|handleEditProfile\\|motion.button" src/pages/Profile.jsx'
    )

# Prefer the button that has handleEditProfile/Edit3.
candidates.sort(reverse=True, key=lambda x: x[0])
score, start, open_end, block_end, open_token, close_token, block = candidates[0]

opening = jsx[start:open_end]

if 'data-profile-edit-real-v16="true"' not in opening:
    new_opening = opening.replace(
        open_token,
        f'{open_token} data-profile-edit-real-v16="true"',
        1
    )
    jsx = jsx[:start] + new_opening + jsx[open_end:]

# 4) Add narrow CSS. Do NOT use ::before. Do NOT target all hero buttons.
css_patch = r'''

/* ═══════════════════════════════════════════════════════════════════════
   PROFILE EDIT REAL PURPLE v16
   Narrow fix:
   - Removes broad v14 blob behavior
   - Fills only the actual Edit Profile button marked by data-profile-edit-real-v16
   ═══════════════════════════════════════════════════════════════════════ */

html body [data-profile-edit-real-v16="true"] {
  background: linear-gradient(135deg, #a855f7 0%, #7c3aed 48%, #6d28d9 100%) !important;
  background-color: #7c3aed !important;
  background-image: linear-gradient(135deg, #a855f7 0%, #7c3aed 48%, #6d28d9 100%) !important;
  background-blend-mode: normal !important;

  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;

  border-color: rgba(221, 214, 254, 0.98) !important;
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

html body [data-profile-edit-real-v16="true"] *,
html body [data-profile-edit-real-v16="true"] svg {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 1 !important;
  stroke: currentColor !important;
  filter: none !important;
  mix-blend-mode: normal !important;
}

html body [data-profile-edit-real-v16="true"]::before,
html body [data-profile-edit-real-v16="true"]::after {
  content: none !important;
  display: none !important;
}

html body [data-profile-edit-real-v16="true"]:hover {
  background: linear-gradient(135deg, #c084fc 0%, #8b5cf6 45%, #7c3aed 100%) !important;
  background-color: #8b5cf6 !important;
  box-shadow:
    0 24px 54px rgba(124, 58, 237, 0.50),
    0 0 0 6px rgba(139, 92, 246, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.44) !important;
}
'''

if "PROFILE EDIT REAL PURPLE v16" not in css:
    css = css.rstrip() + "\n" + css_patch + "\n"

jsx_path.write_text(jsx)
css_path.write_text(css)

print("Profile Edit Profile button v16 repair applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Matched button score:", score)
print("")
print("Changed only:")
print("- Removed bad broad v14 CSS block if present")
print("- Added data-profile-edit-real-v16 to the real Edit Profile button")
print("- Styled only [data-profile-edit-real-v16='true']")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No profile save/edit logic changed.")
