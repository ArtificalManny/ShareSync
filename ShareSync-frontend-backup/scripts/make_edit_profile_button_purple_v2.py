from pathlib import Path
import re
import sys
from datetime import datetime

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"

def fail(message):
    print(f"\n[make_edit_profile_button_purple_v2] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def find_edit_profile_button(source):
    edit_idx = source.find("Edit Profile")
    if edit_idx == -1:
        return None, None, None

    button_start = source.rfind("<button", 0, edit_idx)
    button_end = source.find("</button>", edit_idx)

    if button_start == -1 or button_end == -1:
        return None, None, None

    button_end = button_end + len("</button>")
    block = source[button_start:button_end]

    if "Edit Profile" not in block or "handleEditProfile" not in block:
        return None, None, None

    return button_start, button_end, block

def main():
    print("[make_edit_profile_button_purple_v2] starting")

    if not PROFILE.exists():
        fail(f"Could not find {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    required = [
        "export default function Profile",
        "handleEditProfile",
        "Edit Profile",
    ]

    for marker in required:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}. No changes were written.")

    button_start, button_end, button_block = find_edit_profile_button(source)

    if button_block is None:
        fail("Could not safely find the Edit Profile button using handleEditProfile. No changes were written.")

    new_class = (
        "mt-6 inline-flex items-center justify-center gap-2 rounded-full "
        "px-5 py-2.5 text-sm font-semibold text-white "
        "shadow-lg shadow-violet-500/25 ring-1 ring-violet-500/20 "
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/30 "
        "focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 "
        "dark:focus:ring-violet-300"
    )

    patched_button, class_count = re.subn(
        r'className="[^"]*"',
        f'className="{new_class}"',
        button_block,
        count=1,
    )

    if class_count != 1:
        fail("Could not replace className on Edit Profile button. No changes were written.")

    patched_button, style_count = re.subn(
        r"style=\{\{\s*background:\s*'linear-gradient\(135deg,[^']+'\s*\}\}",
        "style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 52%, #6D28D9 100%)' }}",
        patched_button,
        count=1,
    )

    if style_count != 1:
        fail("Could not replace gradient style on Edit Profile button. No changes were written.")

    source = source[:button_start] + patched_button + source[button_end:]

    _, _, verify_block = find_edit_profile_button(source)

    if verify_block is None:
        fail("Safety check failed: Edit Profile button missing after patch.")

    required_in_button = [
        "handleEditProfile",
        "Edit Profile",
        "rounded-full",
        "shadow-violet-500/25",
        "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 52%, #6D28D9 100%)",
    ]

    for marker in required_in_button:
        if marker not in verify_block:
            fail(f"Safety check failed. Edit Profile button missing marker: {marker}")

    forbidden_in_button = [
        "#3B82F6",
        "#2563EB",
        "shadow-blue",
    ]

    for marker in forbidden_in_button:
        if marker in verify_block:
            fail(f"Safety check failed. Edit Profile button still contains old blue marker: {marker}")

    if source == original:
        print("[make_edit_profile_button_purple_v2] no changes needed")
        return

    backup = PROFILE.with_suffix(PROFILE.suffix + f".bak-edit-profile-purple-v2-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    backup.write_text(original, encoding="utf-8")
    print(f"[make_edit_profile_button_purple_v2] backup created: {backup}")

    PROFILE.write_text(source, encoding="utf-8")
    print(f"[make_edit_profile_button_purple_v2] patched: {PROFILE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"Edit Profile|handleEditProfile|8B5CF6|7C3AED|6D28D9|shadow-violet|rounded-full|shadow-blue|3B82F6|2563EB\" src/pages/Profile.jsx -C 5")
    print("  git diff -- src/pages/Profile.jsx")

if __name__ == "__main__":
    main()
