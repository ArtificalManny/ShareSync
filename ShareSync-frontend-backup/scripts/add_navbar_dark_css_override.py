#!/usr/bin/env python3
from pathlib import Path
import shutil
import sys

ROOT = Path.cwd()
TARGET = ROOT / "src/index.css"
BACKUP = ROOT / "src/index.css.bak.before-navbar-dark-css-override"


def fail(message: str) -> None:
    print(f"\n[add_navbar_dark_css_override] ERROR: {message}")
    sys.exit(1)


def main() -> None:
    print("[add_navbar_dark_css_override] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")

    marker = "NAVBAR DARK SURFACE CSS OVERRIDE"
    if marker in source:
        fail("src/index.css already appears to contain the navbar dark CSS override. Refusing to patch twice.")

    addition = r'''

/* ═══════════════════════════════════════════════════════════════════════════════
   NAVBAR DARK SURFACE CSS OVERRIDE
   ═══════════════════════════════════════════════════════════════════════════════

   Purpose:
   - Navbar.jsx is the correct component, but the older Gallery Walk CSS can keep
     shared shell surfaces visually light.
   - This override only activates in dark mode.
   - It targets the navbar shell and its search field without changing light mode.
   ═══════════════════════════════════════════════════════════════════════════════ */

html.dark header.navbar,
html.dark .navbar.navbar-dark-surface-refined,
html[data-theme="dark"] header.navbar,
html[data-theme="dark"] .navbar.navbar-dark-surface-refined,
.dark header.navbar,
.dark .navbar.navbar-dark-surface-refined,
[data-theme="dark"] header.navbar,
[data-theme="dark"] .navbar.navbar-dark-surface-refined {
  background: linear-gradient(
    90deg,
    rgba(9, 9, 11, 0.96) 0%,
    rgba(15, 15, 20, 0.94) 50%,
    rgba(9, 9, 11, 0.96) 100%
  ) !important;
  background-color: #09090B !important;
  border-bottom-color: rgba(255, 255, 255, 0.08) !important;
  color: #F8FAFC !important;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.04),
    0 14px 34px rgba(0, 0, 0, 0.22) !important;
  backdrop-filter: blur(18px) !important;
  -webkit-backdrop-filter: blur(18px) !important;
}

html.dark header.navbar input,
html.dark .navbar .navbar-dark-search,
html[data-theme="dark"] header.navbar input,
html[data-theme="dark"] .navbar .navbar-dark-search,
.dark header.navbar input,
.dark .navbar .navbar-dark-search,
[data-theme="dark"] header.navbar input,
[data-theme="dark"] .navbar .navbar-dark-search {
  background: rgba(255, 255, 255, 0.045) !important;
  border-color: rgba(255, 255, 255, 0.09) !important;
  color: #F8FAFC !important;
}

html.dark header.navbar input::placeholder,
html[data-theme="dark"] header.navbar input::placeholder,
.dark header.navbar input::placeholder,
[data-theme="dark"] header.navbar input::placeholder {
  color: rgba(212, 212, 216, 0.58) !important;
}

html.dark header.navbar svg,
html[data-theme="dark"] header.navbar svg,
.dark header.navbar svg,
[data-theme="dark"] header.navbar svg {
  color: inherit;
}
'''

    edited = source.rstrip() + "\n" + addition + "\n"

    required_markers = [
        "NAVBAR DARK SURFACE CSS OVERRIDE",
        "html.dark header.navbar",
        'html[data-theme="dark"] header.navbar',
        ".navbar.navbar-dark-surface-refined",
        "background-color: #09090B !important",
        ".navbar .navbar-dark-search",
    ]

    for marker_text in required_markers:
        if marker_text not in edited:
            fail(f"Prewrite verification failed. Missing marker: {marker_text}")

    if not BACKUP.exists():
        shutil.copy2(TARGET, BACKUP)
        print(f"[add_navbar_dark_css_override] backup created: {BACKUP}")
    else:
        print(f"[add_navbar_dark_css_override] backup already exists, preserved: {BACKUP}")

    TARGET.write_text(edited, encoding="utf-8")

    updated = TARGET.read_text(encoding="utf-8")
    for marker_text in required_markers:
        if marker_text not in updated:
            fail(f"Post-edit verification failed. Missing marker after write: {marker_text}")

    print("\n[add_navbar_dark_css_override] complete")
    print("\nNext checks:")
    print("  npm run build")
    print("  rg -n \"NAVBAR DARK SURFACE CSS OVERRIDE|navbar-dark-surface-refined|html.dark header.navbar|data-theme=\\\"dark\\\"|navbar-dark-search|background-color: #09090B\" src/index.css -C 6")
    print("  git diff -- src/index.css")


if __name__ == "__main__":
    main()
