from pathlib import Path
import re
import sys
from datetime import datetime

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"

def fail(message):
    print(f"\n[make_edit_profile_button_visible_v2] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[make_edit_profile_button_visible_v2] starting")

    if not PROFILE.exists():
        fail(f"Could not find {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    required = [
        "export default function Profile",
        "Edit Profile",
    ]

    for marker in required:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}. No changes were written.")

    if "bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white" in source:
        print("[make_edit_profile_button_visible_v2] Edit Profile button already appears upgraded")
        return

    edit_text_idx = source.find("Edit Profile")
    if edit_text_idx == -1:
        fail("Could not find Edit Profile text. No changes were written.")

    # Find nearest opening <button ...> before "Edit Profile".
    button_start = source.rfind("<button", 0, edit_text_idx)
    button_end = source.find("</button>", edit_text_idx)

    if button_start == -1 or button_end == -1:
        fail("Could not safely find button wrapper around Edit Profile. No changes were written.")

    button_block = source[button_start:button_end + len("</button>")]

    if "Edit Profile" not in button_block:
        fail("Safety check failed: selected button does not contain Edit Profile. No changes were written.")

    if "className=" not in button_block:
        fail("Selected Edit Profile button has no className to replace. No changes were written.")

    new_classes = (
        "inline-flex items-center justify-center gap-2 rounded-full "
        "bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white "
        "shadow-lg shadow-violet-500/25 ring-1 ring-violet-500/20 "
        "transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-700 "
        "hover:shadow-xl hover:shadow-violet-500/30 "
        "focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 "
        "dark:bg-violet-500 dark:hover:bg-violet-400 dark:focus:ring-violet-300"
    )

    patched_button, count = re.subn(
        r'className="[^"]*"',
        f'className="{new_classes}"',
        button_block,
        count=1,
    )

    if count != 1:
        fail("Could not replace Edit Profile button className. No changes were written.")

    source = source[:button_start] + patched_button + source[button_end + len("</button>"):]

    required_after = [
        "Edit Profile",
        "bg-violet-600",
        "text-white",
        "shadow-violet-500/25",
        "hover:bg-violet-700",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed. Missing marker after patch: {marker}")

    backup = PROFILE.with_suffix(PROFILE.suffix + f".bak-edit-profile-button-visible-v2-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    backup.write_text(original, encoding="utf-8")
    print(f"[make_edit_profile_button_visible_v2] backup created: {backup}")

    PROFILE.write_text(source, encoding="utf-8")
    print(f"[make_edit_profile_button_visible_v2] patched: {PROFILE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"Edit Profile|bg-violet-600|shadow-violet-500|hover:bg-violet-700\" src/pages/Profile.jsx -C 5")
    print("  git diff -- src/pages/Profile.jsx")

if __name__ == "__main__":
    main()
