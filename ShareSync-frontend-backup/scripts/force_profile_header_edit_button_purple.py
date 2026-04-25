from pathlib import Path
import re
import sys
from datetime import datetime

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"

def fail(message):
    print(f"\n[force_profile_header_edit_button_purple] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

NEW_BLOCK = """          {/* Edit button - Purple primary action */}
          {isOwnProfile && (
            <button 
              type="button"
              onClick={handleEditProfile}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white border border-violet-300 shadow-xl shadow-violet-500/35 ring-2 ring-violet-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-violet-500/45 focus:outline-none focus:ring-4 focus:ring-violet-300"
              style={{ backgroundColor: '#7C3AED', color: '#FFFFFF' }}
            >
              <Edit3 className="w-4 h-4 text-white" />
              <span className="text-white">Edit Profile</span>
            </button>
          )}"""

def main():
    print("[force_profile_header_edit_button_purple] starting")

    if not PROFILE.exists():
        fail(f"Could not find {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    start_match = re.search(
        r'\n\s*\{/\*\s*Edit button[^*]*\*/\}\s*\n\s*\{isOwnProfile\s*&&\s*\(\s*\n\s*<button[\s\S]*?Edit Profile[\s\S]*?\n\s*\)\}',
        source,
        re.MULTILINE,
    )

    if not start_match:
        fail("Could not find the profile-header Edit Profile block. No changes were written.")

    old_block = start_match.group(0)

    required_old = [
        "isOwnProfile",
        "handleEditProfile",
        "Edit Profile",
    ]

    for marker in required_old:
        if marker not in old_block:
            fail(f"Matched block is missing expected marker: {marker}. No changes were written.")

    patched = source[:start_match.start()] + "\n" + NEW_BLOCK + source[start_match.end():]

    verify_start = patched.find("Edit button - Purple primary action")
    verify_end = patched.find("          )}", verify_start)

    if verify_start == -1 or verify_end == -1:
        fail("Could not verify new purple Edit Profile block after patch.")

    verify_block = patched[verify_start:verify_end + len("          )}")]

    required_after = [
        "type=\"button\"",
        "onClick={handleEditProfile}",
        "backgroundColor: '#7C3AED'",
        "color: '#FFFFFF'",
        "shadow-violet-500/35",
        "ring-violet-200/80",
        "<span className=\"text-white\">Edit Profile</span>",
    ]

    for marker in required_after:
        if marker not in verify_block:
            fail(f"Safety check failed. New button block missing marker: {marker}")

    forbidden_after = [
        "shadow-blue",
        "#3B82F6",
        "#2563EB",
    ]

    for marker in forbidden_after:
        if marker in verify_block:
            fail(f"Safety check failed. New button block still contains old marker: {marker}")

    backup = PROFILE.with_suffix(PROFILE.suffix + f".bak-force-header-edit-purple-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    backup.write_text(original, encoding="utf-8")
    print(f"[force_profile_header_edit_button_purple] backup created: {backup}")

    PROFILE.write_text(patched, encoding="utf-8")
    print(f"[force_profile_header_edit_button_purple] patched: {PROFILE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"Edit button|Edit Profile|handleEditProfile|backgroundColor: '#7C3AED'|shadow-violet|shadow-blue|3B82F6|2563EB\" src/pages/Profile.jsx -C 5")
    print("  git diff -- src/pages/Profile.jsx")

if __name__ == "__main__":
    main()
