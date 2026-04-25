from pathlib import Path
import re
import sys
from datetime import datetime

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"

def fail(message):
    print(f"\n[force_visible_edit_profile_button] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[force_visible_edit_profile_button] starting")

    if not PROFILE.exists():
        fail(f"Could not find {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    required = [
        "handleEditProfile",
        "Edit Profile",
        "onClick={handleEditProfile}",
    ]

    for marker in required:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}. No changes were written.")

    edit_idx = source.find("Edit Profile")
    if edit_idx == -1:
        fail("Could not find Edit Profile text. No changes were written.")

    # Find the exact button wrapping Edit Profile.
    button_start = source.rfind("<button", 0, edit_idx)
    button_end = source.find("</button>", edit_idx)

    if button_start == -1 or button_end == -1:
        fail("Could not find button wrapper around Edit Profile. No changes were written.")

    button_end += len("</button>")
    button_block = source[button_start:button_end]

    if "handleEditProfile" not in button_block:
        fail("Selected button does not contain handleEditProfile. No changes were written.")

    new_class = (
        "mt-6 inline-flex items-center justify-center gap-2 rounded-full "
        "bg-violet-600 px-6 py-3 text-sm font-bold text-white "
        "border border-violet-400/70 shadow-xl shadow-violet-500/35 "
        "ring-2 ring-violet-200/80 transition-all duration-200 "
        "hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-2xl hover:shadow-violet-500/45 "
        "focus:outline-none focus:ring-4 focus:ring-violet-300 "
        "dark:bg-violet-500 dark:border-violet-300/40 dark:ring-violet-400/30 dark:hover:bg-violet-400"
    )

    # Replace className.
    patched_button, class_count = re.subn(
        r'className="[^"]*"',
        f'className="{new_class}"',
        button_block,
        count=1,
    )

    if class_count != 1:
        fail("Could not replace Edit Profile button className. No changes were written.")

    # Remove inline background style from this button if present. Tailwind bg-violet-600 is more reliable here.
    patched_button = re.sub(
        r'\n\s*style=\{\{\s*background:\s*[\'"][^\'"]+[\'"]\s*\}\}',
        "",
        patched_button,
        count=1,
    )

    source = source[:button_start] + patched_button + source[button_end:]

    verify_idx = source.find("Edit Profile")
    verify_start = source.rfind("<button", 0, verify_idx)
    verify_end = source.find("</button>", verify_idx) + len("</button>")
    verify_block = source[verify_start:verify_end]

    required_after = [
        "handleEditProfile",
        "Edit Profile",
        "bg-violet-600",
        "px-6 py-3",
        "font-bold",
        "shadow-violet-500/35",
        "ring-2 ring-violet-200/80",
    ]

    for marker in required_after:
        if marker not in verify_block:
            fail(f"Safety check failed. Edit Profile button missing marker: {marker}")

    forbidden_in_button = [
        "shadow-blue",
        "#3B82F6",
        "#2563EB",
    ]

    for marker in forbidden_in_button:
        if marker in verify_block:
            fail(f"Safety check failed. Edit Profile button still contains old marker: {marker}")

    if source == original:
        print("[force_visible_edit_profile_button] no changes needed")
        return

    backup = PROFILE.with_suffix(PROFILE.suffix + f".bak-force-visible-edit-profile-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    backup.write_text(original, encoding="utf-8")
    print(f"[force_visible_edit_profile_button] backup created: {backup}")

    PROFILE.write_text(source, encoding="utf-8")
    print(f"[force_visible_edit_profile_button] patched: {PROFILE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"Edit Profile|handleEditProfile|bg-violet-600|shadow-violet-500/35|ring-violet-200|shadow-blue|3B82F6|2563EB\" src/pages/Profile.jsx -C 5")
    print("  git diff -- src/pages/Profile.jsx")

if __name__ == "__main__":
    main()
