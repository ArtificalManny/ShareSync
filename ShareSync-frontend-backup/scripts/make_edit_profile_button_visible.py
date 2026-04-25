from pathlib import Path
import re
import sys
from datetime import datetime

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"

def fail(message):
    print(f"\n[make_edit_profile_button_visible] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[make_edit_profile_button_visible] starting")

    if not PROFILE.exists():
        fail(f"Could not find {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    required = [
        "export default function Profile",
        "Edit Profile",
        "setIsEditing(true)",
    ]

    for marker in required:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}. No changes were written.")

    if "bg-violet-600 text-white shadow-lg shadow-violet-500/25" in source:
        print("[make_edit_profile_button_visible] Edit Profile button already appears upgraded")
        return

    # Match the button that contains Edit Profile and opens the edit modal.
    pattern = re.compile(
        r'(<button\s+[^>]*onClick=\{\(\)\s*=>\s*setIsEditing\(true\)\}[^>]*className=")([^"]*)("[\s\S]*?>[\s\S]*?Edit Profile[\s\S]*?</button>)',
        re.MULTILINE,
    )

    match = pattern.search(source)

    if not match:
        fail("Could not find the Edit Profile button with setIsEditing(true). No changes were written.")

    old_classes = match.group(2)

    new_classes = (
        "inline-flex items-center justify-center gap-2 rounded-full "
        "bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white "
        "shadow-lg shadow-violet-500/25 ring-1 ring-violet-500/20 "
        "transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-700 "
        "hover:shadow-xl hover:shadow-violet-500/30 "
        "focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 "
        "dark:bg-violet-500 dark:hover:bg-violet-400 dark:focus:ring-violet-300"
    )

    source = source[:match.start(2)] + new_classes + source[match.end(2):]

    if old_classes == new_classes:
        print("[make_edit_profile_button_visible] no class change needed")
        return

    required_after = [
        "Edit Profile",
        "bg-violet-600",
        "text-white",
        "shadow-violet-500/25",
        "hover:bg-violet-700",
        "setIsEditing(true)",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed. Missing marker after patch: {marker}")

    backup = PROFILE.with_suffix(PROFILE.suffix + f".bak-edit-profile-button-visible-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    backup.write_text(original, encoding="utf-8")
    print(f"[make_edit_profile_button_visible] backup created: {backup}")

    PROFILE.write_text(source, encoding="utf-8")
    print(f"[make_edit_profile_button_visible] patched: {PROFILE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"Edit Profile|bg-violet-600|shadow-violet-500|setIsEditing\\(true\\)\" src/pages/Profile.jsx -C 4")
    print("  git diff -- src/pages/Profile.jsx")

if __name__ == "__main__":
    main()
