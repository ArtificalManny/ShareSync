from pathlib import Path
import sys
from datetime import datetime

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"

OLD_BLOCK = """          {/* Edit button - Blue action */}
          {isOwnProfile && (
            <button 
              onClick={handleEditProfile}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-md shadow-blue-200 dark:shadow-blue-900/20 hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </button>
          )}"""

NEW_BLOCK = """          {/* Edit button - Purple primary action */}
          {isOwnProfile && (
            <button 
              onClick={handleEditProfile}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 ring-1 ring-violet-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/30 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 dark:focus:ring-violet-300"
              style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 52%, #6D28D9 100%)' }}
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </button>
          )}"""

def fail(message):
    print(f"\\n[make_profile_edit_button_purple_current] ERROR: {message}\\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[make_profile_edit_button_purple_current] starting")

    if not PROFILE.exists():
        fail(f"Could not find {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    required_before = [
        "export default function Profile",
        "const handleEditProfile = () => {",
        "setIsEditing(true);",
        "Edit button - Blue action",
        "onClick={handleEditProfile}",
        "Edit Profile",
        "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
    ]

    for marker in required_before:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}. No changes were written.")

    if OLD_BLOCK not in source:
        fail("Could not find the exact current blue Edit Profile button block. No changes were written.")

    source = source.replace(OLD_BLOCK, NEW_BLOCK, 1)

    required_after = [
        "Edit button - Purple primary action",
        "onClick={handleEditProfile}",
        "Edit Profile",
        "rounded-full",
        "shadow-violet-500/25",
        "hover:shadow-violet-500/30",
        "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 52%, #6D28D9 100%)",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if OLD_BLOCK in source:
        fail("Safety check failed: old blue Edit Profile button block still exists after patch.")

    backup = PROFILE.with_suffix(PROFILE.suffix + f".bak-edit-profile-purple-current-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    backup.write_text(original, encoding="utf-8")
    print(f"[make_profile_edit_button_purple_current] backup created: {backup}")

    PROFILE.write_text(source, encoding="utf-8")
    print(f"[make_profile_edit_button_purple_current] patched: {PROFILE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"Edit button|Edit Profile|handleEditProfile|8B5CF6|7C3AED|6D28D9|shadow-violet|rounded-full|shadow-blue|3B82F6|2563EB\" src/pages/Profile.jsx -C 5")
    print("  git diff -- src/pages/Profile.jsx")

if __name__ == "__main__":
    main()
