from pathlib import Path
from datetime import datetime
import re

jsx_path = Path("src/pages/Profile.jsx")
css_path = Path("src/pages/Profile.css")

jsx = jsx_path.read_text()
css = css_path.read_text()

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
jsx_backup = jsx_path.with_suffix(jsx_path.suffix + f".backup-profile-hero-surface-v6-{stamp}")
css_backup = css_path.with_suffix(css_path.suffix + f".backup-profile-hero-surface-v6-{stamp}")

jsx_backup.write_text(jsx)
css_backup.write_text(css)

# 1) Ensure Profile.css is imported.
if 'import "./Profile.css";' not in jsx and "import './Profile.css';" not in jsx:
    lines = jsx.splitlines()
    import_indexes = [i for i, line in enumerate(lines) if line.strip().startswith("import ")]
    if not import_indexes:
        raise RuntimeError("Could not find import section in Profile.jsx. No changes were written.")
    lines.insert(import_indexes[-1] + 1, 'import "./Profile.css";')
    jsx = "\n".join(lines) + "\n"

# 2) Add root scope if missing.
if "profile-visual-shell" not in jsx:
    jsx, root_count = re.subn(
        r'className="(?=[^"]*\bmin-h-screen\b)(?=[^"]*\bmx-auto\b)([^"]*)"',
        lambda m: f'className="profile-visual-shell {m.group(1)}"',
        jsx,
        count=1,
    )
    if root_count != 1:
        raise RuntimeError("Could not find Profile root wrapper. No changes were written.")

# 3) Replace ONLY the profile header block using the HEADER SECTION comment anchor.
# This avoids fragile class matching.
header_pattern = re.compile(
    r'(\s*\{/\*\s*═══════════════════════════════════════════════════════════════════\s*\n'
    r'\s*HEADER SECTION\s*\n'
    r'\s*═══════════════════════════════════════════════════════════════════\s*\*/\}\s*)'
    r'<section[\s\S]*?</section>',
    re.MULTILINE,
)

new_header = r'''
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="profile-hero-surface flex flex-col items-center mb-16">
        <ProfilePhotoEditor user={user} isOwnProfile={isOwnProfile} onPhotoUpdate={load} />

        <div className="profile-hero-copy text-center mt-8">
          <h1 className="profile-hero-name text-4xl font-semibold text-slate-800 dark:text-white mb-3">
            {name.fullName || user?.email?.split('@')[0] || 'Loading...'}
          </h1>

          <div className="profile-hero-meta flex items-center justify-center gap-3 flex-wrap">
            <span className="text-sm text-slate-500 dark:text-zinc-400">
              ID: {user?.username || user?.handle || user?.email?.split('@')[0] || user?._id?.slice(-8) || "..."}
            </span>

            {/* Core Verified Badge - Teal (#2DD4BF) */}
            <span
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-sm shadow-teal-500/20"
              style={{ background: 'linear-gradient(135deg, #2DD4BF 0%, #14B8A6 100%)' }}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Core Verified
            </span>

            {skillProfile?.archetype?.current && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 text-xs font-medium border border-violet-200 dark:border-violet-500/20">
                <Star className="w-3.5 h-3.5" />
                {skillProfile.archetype.current}
              </span>
            )}
          </div>

          {user?.bio && (
            <p className="profile-hero-bio mt-6 text-slate-600 dark:text-zinc-300 max-w-lg mx-auto leading-relaxed">
              {user.bio}
            </p>
          )}

          {/* Edit button - Blue action */}
          {isOwnProfile && (
            <button
              onClick={handleEditProfile}
              className="profile-hero-cta mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-md shadow-blue-200 dark:shadow-blue-900/20 hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>
      </section>'''

jsx, header_count = header_pattern.subn(new_header, jsx, count=1)

if header_count != 1:
    raise RuntimeError(
        "Could not replace the HEADER SECTION block. No changes were written. "
        "Run: grep -n \"HEADER SECTION\\|ProfilePhotoEditor\\|Edit Profile\" src/pages/Profile.jsx"
    )

css_patch = r'''

/* ═══════════════════════════════════════════════════════════════════════
   PROFILE HERO SURFACE v6
   Styles the existing Profile header only.
   No extra wrapper. No matryoshka border.
   ═══════════════════════════════════════════════════════════════════════ */

.profile-visual-shell {
  position: relative;
  isolation: isolate;
}

.profile-visual-shell::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -2;
  background:
    radial-gradient(circle at 18% 14%, rgba(139, 92, 246, 0.11), transparent 30%),
    radial-gradient(circle at 82% 20%, rgba(34, 211, 238, 0.10), transparent 34%),
    radial-gradient(circle at 80% 90%, rgba(236, 72, 153, 0.065), transparent 28%);
}

.profile-hero-surface {
  width: min(100%, 980px) !important;
  margin-inline: auto !important;
  margin-bottom: 4rem !important;
  padding: 3.25rem 2rem 2.85rem !important;
  position: relative !important;
  overflow: hidden !important;
  border-radius: 2.1rem !important;
  border: 1px solid rgba(255, 255, 255, 0.72) !important;
  background:
    radial-gradient(circle at 50% 12%, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.28) 32%, transparent 55%),
    radial-gradient(circle at 16% 20%, rgba(139, 92, 246, 0.16), transparent 34%),
    radial-gradient(circle at 84% 78%, rgba(45, 212, 191, 0.14), transparent 32%),
    linear-gradient(135deg, #c5cbd5 0%, #e7e9ef 38%, #f9fafb 54%, #d7dde7 100%) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.78),
    inset 0 -1px 0 rgba(255, 255, 255, 0.22),
    0 26px 70px rgba(15, 23, 42, 0.11),
    0 12px 32px rgba(139, 92, 246, 0.10) !important;
  backdrop-filter: blur(10px) saturate(1.08);
  -webkit-backdrop-filter: blur(10px) saturate(1.08);
}

.profile-hero-surface::before {
  content: "" !important;
  display: block !important;
  position: absolute !important;
  inset: 0 0 auto 0 !important;
  height: 4px !important;
  background: linear-gradient(90deg, #8b5cf6 0%, #a78bfa 32%, #67e8f9 68%, #14b8a6 100%) !important;
  opacity: 0.95 !important;
  z-index: 0 !important;
}

.profile-hero-surface::after {
  content: "" !important;
  display: block !important;
  position: absolute !important;
  inset: 0 !important;
  pointer-events: none !important;
  background:
    radial-gradient(circle at 50% 16%, rgba(255, 255, 255, 0.36), transparent 36%),
    linear-gradient(90deg, rgba(255, 255, 255, 0.10), transparent 22%, transparent 78%, rgba(255, 255, 255, 0.16)) !important;
  opacity: 0.95 !important;
  z-index: 0 !important;
}

.profile-hero-surface > * {
  position: relative;
  z-index: 1;
}

.profile-hero-name {
  font-size: clamp(2rem, 2.8vw, 2.85rem) !important;
  line-height: 1.04 !important;
  letter-spacing: -0.045em !important;
  font-weight: 900 !important;
  margin-top: 0.15rem !important;
  margin-bottom: 0.65rem !important;
  background: linear-gradient(135deg, #111827 0%, #4c1d95 52%, #0891b2 100%) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  color: transparent !important;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.34);
}

.profile-hero-meta {
  gap: 0.6rem 0.75rem !important;
  margin-top: 0.2rem !important;
  margin-bottom: 1rem !important;
}

.profile-hero-meta > * {
  position: relative;
  z-index: 1;
}

.profile-hero-meta span {
  box-shadow:
    0 8px 18px rgba(15, 23, 42, 0.055),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.profile-hero-bio {
  margin-top: 1.15rem !important;
  color: #475569 !important;
  font-size: 1rem !important;
  line-height: 1.65 !important;
}

.profile-hero-cta {
  border-radius: 999px !important;
  padding: 0.65rem 1.25rem !important;
  font-weight: 850 !important;
  color: #ffffff !important;
  opacity: 1 !important;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 52%, #2563eb 100%) !important;
  box-shadow:
    0 16px 34px rgba(124, 58, 237, 0.30),
    inset 0 1px 0 rgba(255, 255, 255, 0.32) !important;
  text-shadow: 0 1px 2px rgba(15, 23, 42, 0.25) !important;
}

.profile-hero-cta *,
.profile-hero-cta svg {
  color: #ffffff !important;
  opacity: 1 !important;
}

.profile-hero-cta:hover {
  transform: translateY(-2px);
  box-shadow:
    0 22px 46px rgba(124, 58, 237, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.38) !important;
}

html.dark .profile-hero-surface,
html[data-theme="dark"] .profile-hero-surface,
body.dark .profile-hero-surface {
  border-color: rgba(255, 255, 255, 0.10) !important;
  background:
    radial-gradient(circle at 50% 12%, rgba(255, 255, 255, 0.10), transparent 42%),
    radial-gradient(circle at 16% 20%, rgba(139, 92, 246, 0.22), transparent 34%),
    radial-gradient(circle at 84% 78%, rgba(45, 212, 191, 0.14), transparent 32%),
    linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.94)) !important;
}

html.dark .profile-hero-name,
html[data-theme="dark"] .profile-hero-name,
body.dark .profile-hero-name {
  background: linear-gradient(135deg, #ffffff 0%, #c4b5fd 50%, #67e8f9 100%) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
}

html.dark .profile-hero-bio,
html[data-theme="dark"] .profile-hero-bio,
body.dark .profile-hero-bio {
  color: rgba(226, 232, 240, 0.84) !important;
}

@media (max-width: 768px) {
  .profile-hero-surface {
    width: 100% !important;
    border-radius: 1.55rem !important;
    padding: 2.55rem 1.25rem 2.25rem !important;
  }

  .profile-hero-name {
    font-size: clamp(1.9rem, 8vw, 2.55rem) !important;
  }
}
'''

if "PROFILE HERO SURFACE v6" not in css:
    css = css.rstrip() + "\n" + css_patch + "\n"

jsx_path.write_text(jsx)
css_path.write_text(css)

print("Profile hero surface v6 header-block patch applied successfully.")
print(f"Updated file: {jsx_path}")
print(f"Backup file:  {jsx_backup}")
print(f"Updated file: {css_path}")
print(f"Backup file:  {css_backup}")
print("")
print("Changed only:")
print("- Profile.css import if missing")
print("- One root Profile visual scope class")
print("- Replaced the existing HEADER SECTION block with same logic + class hooks")
print("- Added root-scoped Profile hero CSS")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("No profile loading, editing, upload, analytics, or growth logic changed.")
