from pathlib import Path
from datetime import datetime
import re

jsx_path = Path("src/pages/Profile.jsx")
css_path = Path("src/pages/Profile.css")

jsx = jsx_path.read_text()
css = css_path.read_text()

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
jsx_backup = jsx_path.with_suffix(jsx_path.suffix + f".backup-profile-edit-button-force-purple-v9-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-profile-edit-button-force-purple-v9-{stamp}")

jsx_backup.write_text(jsx)
css_backup.write_text(css)

# Find the actual Edit Profile button by its onClick handler and label.
button_pattern = re.compile(
    r'<button\s+onClick=\{handleEditProfile\}[\s\S]*?>\s*'
    r'<Edit3\s+className="w-4 h-4"\s*/>\s*'
    r'Edit Profile\s*'
    r'</button>',
    re.MULTILINE,
)

new_button = '''<button
              onClick={handleEditProfile}
              className="profile-hero-cta profile-edit-purple-force mt-6 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-white text-sm font-black transition-all"
              style={{
                background: 'linear-gradient(135deg, #9333EA 0%, #7C3AED 48%, #6D28D9 100%)',
                color: '#FFFFFF',
                WebkitTextFillColor: '#FFFFFF',
                opacity: 1,
                border: '1px solid rgba(221, 214, 254, 0.95)',
                boxShadow:
                  '0 18px 38px rgba(124, 58, 237, 0.38), 0 0 0 5px rgba(139, 92, 246, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.34)',
                textShadow: '0 1px 2px rgba(15, 23, 42, 0.32)',
                filter: 'none',
                mixBlendMode: 'normal',
              }}
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </button>'''

jsx, count = button_pattern.subn(new_button, jsx, count=1)

if count != 1:
    raise RuntimeError(
        "Could not find the Edit Profile button. No changes were written. "
        "Run: grep -n \"handleEditProfile\\|Edit Profile\" src/pages/Profile.jsx"
    )

css_patch = r'''

/* ═══════════════════════════════════════════════════════════════════════
   PROFILE EDIT BUTTON FORCE PURPLE v9
   Extra reinforcement for the inline-styled Edit Profile button.
   ═══════════════════════════════════════════════════════════════════════ */

.profile-edit-purple-force,
.profile-hero-surface .profile-edit-purple-force,
.profile-visual-shell .profile-edit-purple-force {
  background: linear-gradient(135deg, #9333EA 0%, #7C3AED 48%, #6D28D9 100%) !important;
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 1 !important;
  border: 1px solid rgba(221, 214, 254, 0.95) !important;
  border-radius: 999px !important;
  min-height: 44px !important;
  font-weight: 900 !important;
  box-shadow:
    0 18px 38px rgba(124, 58, 237, 0.38),
    0 0 0 5px rgba(139, 92, 246, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.34) !important;
  text-shadow: 0 1px 2px rgba(15, 23, 42, 0.32) !important;
  filter: none !important;
  mix-blend-mode: normal !important;
}

.profile-edit-purple-force *,
.profile-edit-purple-force svg {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 1 !important;
  stroke: currentColor !important;
  filter: none !important;
  mix-blend-mode: normal !important;
}

.profile-edit-purple-force:hover {
  transform: translateY(-2px) !important;
  background: linear-gradient(135deg, #A855F7 0%, #8B5CF6 45%, #7C3AED 100%) !important;
  box-shadow:
    0 24px 52px rgba(124, 58, 237, 0.48),
    0 0 0 6px rgba(139, 92, 246, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.42) !important;
}
'''

if "PROFILE EDIT BUTTON FORCE PURPLE v9" not in css:
    css = css.rstrip() + "\n" + css_patch + "\n"

jsx_path.write_text(jsx)
css_path.write_text(css)

print("Profile Edit Profile force-purple v9 patch applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- The existing Edit Profile button styling")
print("- Added one force-purple CSS class")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No profile loading, editing, upload, analytics, or growth logic changed.")
