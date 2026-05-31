from pathlib import Path
from datetime import datetime

jsx_path = Path("src/pages/Profile.jsx")
css_path = Path("src/pages/Profile.css")

jsx = jsx_path.read_text()
css = css_path.read_text()

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
jsx_backup = jsx_path.with_suffix(jsx_path.suffix + f".backup-profile-edit-button-v15-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-profile-edit-button-v15-{stamp}")

jsx_backup.write_text(jsx)
css_backup.write_text(css)

# 1) Remove the bad broad v14 CSS block that created the giant purple blob.
marker = "PROFILE EDIT BUTTON FILL v14"
idx = css.find(marker)
if idx != -1:
    start = css.rfind("/*", 0, idx)
    end = css.find("/* ═", idx + len(marker))
    if start != -1:
        if end == -1:
            css = css[:start].rstrip() + "\n"
        else:
            css = css[:start].rstrip() + "\n\n" + css[end:].lstrip()

# 2) Remove wrongly attached edit-profile data attributes/classes from earlier attempts.
jsx = jsx.replace(' data-profile-action="edit-profile"', '')
jsx = jsx.replace(" profile-edit-purple-force", "")
jsx = jsx.replace(" profile-edit-real-purple", "")

# 3) Find the real small Edit Profile button by locating the button block containing the label.
label_index = jsx.find("Edit Profile")
if label_index == -1:
    raise RuntimeError('Could not find "Edit Profile" text in Profile.jsx.')

button_start = jsx.rfind("<button", 0, label_index)
button_end = jsx.find(">", button_start)

if button_start == -1 or button_end == -1:
    raise RuntimeError("Could not find the opening <button> for Edit Profile.")

opening = jsx[button_start:button_end + 1]

# Safety: make sure this is actually a button opening tag, not a huge section.
if len(opening) > 1200:
    raise RuntimeError("Edit Profile button opening tag looked unexpectedly huge. No changes written.")

# Add a unique class to this exact button.
if "className=" in opening:
    if "profile-edit-real-purple" not in opening:
        if 'className="' in opening:
            opening2 = opening.replace('className="', 'className="profile-edit-real-purple ', 1)
        elif "className='" in opening:
            opening2 = opening.replace("className='", "className='profile-edit-real-purple ", 1)
        elif "className={`" in opening:
            opening2 = opening.replace("className={`", "className={`profile-edit-real-purple ", 1)
        else:
            raise RuntimeError("Found className, but could not safely insert class.")
    else:
        opening2 = opening
else:
    opening2 = opening[:-1] + ' className="profile-edit-real-purple">'

jsx = jsx[:button_start] + opening2 + jsx[button_end + 1:]

# 4) Add a narrow final CSS rule for ONLY that real Edit Profile button.
css_patch = r'''

/* ═══════════════════════════════════════════════════════════════════════
   PROFILE EDIT REAL PURPLE v15
   Narrow fix:
   - Removes the v14 oversized fill issue
   - Styles only the actual small Edit Profile button
   ═══════════════════════════════════════════════════════════════════════ */

html body button.profile-edit-real-purple {
  appearance: none !important;
  -webkit-appearance: none !important;

  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0.55rem !important;

  min-width: 150px !important;
  min-height: 46px !important;
  padding: 0.78rem 1.65rem !important;
  border-radius: 999px !important;

  background: linear-gradient(135deg, #a855f7 0%, #7c3aed 48%, #6d28d9 100%) !important;
  background-color: #7c3aed !important;

  border: 1px solid rgba(221, 214, 254, 0.98) !important;
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;

  opacity: 1 !important;
  visibility: visible !important;
  cursor: pointer !important;

  font-size: 0.95rem !important;
  font-weight: 900 !important;
  line-height: 1 !important;
  text-shadow: 0 1px 2px rgba(15, 23, 42, 0.36) !important;

  box-shadow:
    0 18px 42px rgba(124, 58, 237, 0.42),
    0 0 0 5px rgba(139, 92, 246, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.38) !important;

  filter: none !important;
  mix-blend-mode: normal !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

/* Kill bad pseudo-fill layers from previous attempts on this button only */
html body button.profile-edit-real-purple::before,
html body button.profile-edit-real-purple::after {
  content: none !important;
  display: none !important;
}

html body button.profile-edit-real-purple *,
html body button.profile-edit-real-purple svg {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 1 !important;
  stroke: currentColor !important;
  filter: none !important;
  mix-blend-mode: normal !important;
}

html body button.profile-edit-real-purple:hover {
  transform: translateY(-2px) !important;
  background: linear-gradient(135deg, #c084fc 0%, #8b5cf6 45%, #7c3aed 100%) !important;
  box-shadow:
    0 24px 54px rgba(124, 58, 237, 0.50),
    0 0 0 6px rgba(139, 92, 246, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.44) !important;
}
'''

if "PROFILE EDIT REAL PURPLE v15" not in css:
    css = css.rstrip() + "\n" + css_patch + "\n"

jsx_path.write_text(jsx)
css_path.write_text(css)

print("Profile Edit Profile button v15 repair applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Removed bad broad v14 CSS block")
print("- Added one narrow class to the real Edit Profile button")
print("- Styled only button.profile-edit-real-purple")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No profile save/edit logic changed.")
