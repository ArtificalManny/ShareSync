from pathlib import Path
from datetime import datetime

css_path = Path("src/pages/Profile.css")
css = css_path.read_text()

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = css_path.with_suffix(css_path.suffix + f".backup-profile-hero-cleanup-v4-{stamp}")
backup.write_text(css)

cleanup_patch = r'''

/* ═══════════════════════════════════════════════════════════════════════════════
   PROFILE HERO CLEANUP v4
   Fixes:
   - Removes outer "matryoshka" hero border/background
   - Keeps the existing silver profile card as the main hero surface
   - Reduces oversized profile name
   - Restores Edit Profile button readability
   ═══════════════════════════════════════════════════════════════════════════════ */

/* Remove the extra outer card created by the previous root-scoped visual patch */
.profile-visual-shell > section:first-of-type {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  overflow: visible !important;
}

/* Remove the extra top stripe and glow blob from the outer wrapper */
.profile-visual-shell > section:first-of-type::before,
.profile-visual-shell > section:first-of-type::after {
  display: none !important;
  content: none !important;
}

/* Reduce the profile name so it feels premium, not oversized */
.profile-visual-shell > section:first-of-type h1 {
  font-size: clamp(2.05rem, 3vw, 3rem) !important;
  line-height: 1.05 !important;
  letter-spacing: -0.04em !important;
}

/* Keep the original inner silver hero card visually clean and intentional */
.profile-visual-shell > section:first-of-type [class*="rounded"] {
  border-color: rgba(226, 232, 240, 0.92);
}

/* Restore Edit Profile button visibility if previous styling made it too faint */
.profile-visual-shell > section:first-of-type button[class*="text-white"],
.profile-visual-shell > section:first-of-type a[class*="text-white"] {
  color: #ffffff !important;
  opacity: 1 !important;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 52%, #6d28d9 100%) !important;
  box-shadow:
    0 14px 30px rgba(124, 58, 237, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.28) !important;
  text-shadow: 0 1px 2px rgba(15, 23, 42, 0.28) !important;
}

.profile-visual-shell > section:first-of-type button[class*="text-white"] *,
.profile-visual-shell > section:first-of-type a[class*="text-white"] * {
  color: #ffffff !important;
  opacity: 1 !important;
}

/* Mobile name sizing */
@media (max-width: 768px) {
  .profile-visual-shell > section:first-of-type h1 {
    font-size: clamp(1.9rem, 8vw, 2.65rem) !important;
  }
}
'''

if "PROFILE HERO CLEANUP v4" not in css:
    css = css.rstrip() + "\n" + cleanup_patch + "\n"

css_path.write_text(css)

print("Profile hero cleanup v4 applied successfully.")
print(f"Updated file: {css_path}")
print(f"Backup file:  {backup}")
print("")
print("Changed only:")
print("- Profile.css")
print("- Removed outer nested hero-card visual effect")
print("- Reduced profile name size")
print("- Reinforced Edit Profile button readability")
print("")
print("No JSX touched.")
print("No backend files touched.")
print("No API calls changed.")
print("No profile loading, editing, upload, analytics, or growth logic changed.")
