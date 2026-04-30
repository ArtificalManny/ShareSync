#!/usr/bin/env python3
from pathlib import Path
import shutil
import sys

ROOT = Path.cwd()
TARGET = ROOT / "src/index.css"
BACKUP = ROOT / "src/index.css.bak.before-global-dark-shell-overrides"


def fail(message: str) -> None:
    print(f"\n[add_global_dark_shell_overrides] ERROR: {message}")
    sys.exit(1)


def main() -> None:
    print("[add_global_dark_shell_overrides] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")

    marker = "GLOBAL DARK SHELL OVERRIDES"
    if marker in source:
        fail("src/index.css already appears to contain global dark shell overrides. Refusing to patch twice.")

    addition = r'''

/* ═══════════════════════════════════════════════════════════════════════════════
   GLOBAL DARK SHELL OVERRIDES
   ═══════════════════════════════════════════════════════════════════════════════

   Purpose:
   - The older "Gallery Walk" section intentionally forced several app-shell
     surfaces toward light mode.
   - That worked for the original light gallery aesthetic, but it creates white
     patches when the user selects Dark mode.
   - These overrides only activate under `.dark`, preserving light mode while
     making the shared app shell coherent in dark mode.

   Scope:
   - App shell / page canvas
   - Sidebar shell
   - Top/header shell
   - Shared CSS variables used by pages like Profile.jsx
   ═══════════════════════════════════════════════════════════════════════════════ */

.dark {
  --gallery-bg: #09090B;
  --gallery-border: rgba(255, 255, 255, 0.08);
  --bg-page: radial-gradient(circle at top, rgba(139, 92, 246, 0.14), transparent 32%),
    linear-gradient(180deg, #09090B 0%, #0F0F14 48%, #09090B 100%);
}

/* Main app canvas */
.dark .app-layout,
.dark .main-layout {
  background:
    radial-gradient(circle at top, rgba(139, 92, 246, 0.12), transparent 34%),
    linear-gradient(180deg, #09090B 0%, #0F0F14 48%, #09090B 100%);
  color: #F8FAFC;
}

/* Sidebar: override Gallery Walk white enforcement */
.dark #app-sidebar {
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 28, 0.98) 100%) !important;
  border-right-color: rgba(255, 255, 255, 0.08) !important;
  color: #E5E7EB;
  box-shadow: 18px 0 55px rgba(0, 0, 0, 0.28);
}

/* Reduce the pale sidebar wash when the sidebar is expanded */
.dark #app-sidebar::before,
.dark #app-sidebar::after {
  opacity: 0.18;
}

/* Top navigation / app header surfaces */
.dark .app-layout header,
.dark .main-layout header,
.dark .app-layout nav,
.dark .main-layout nav,
.dark [role="banner"] {
  background-color: rgba(9, 9, 11, 0.82);
  border-color: rgba(255, 255, 255, 0.08);
  color: #F8FAFC;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

/* Common shell children that were previously forced by Gallery Walk */
.dark .app-layout > div,
.dark .main-layout > div {
  border-color: rgba(255, 255, 255, 0.08);
}

/* Native form controls inside the app shell */
.dark .app-layout input,
.dark .app-layout select,
.dark .app-layout textarea,
.dark .main-layout input,
.dark .main-layout select,
.dark .main-layout textarea {
  color-scheme: dark;
}

/* Guardrail for pages using var(--bg-page) inline */
.dark [style*="--bg-page"],
.dark [style*="var(--bg-page"] {
  color: #F8FAFC;
}
'''

    edited = source.rstrip() + "\n" + addition + "\n"

    required_markers = [
        "GLOBAL DARK SHELL OVERRIDES",
        "--gallery-bg: #09090B",
        "--bg-page: radial-gradient",
        ".dark #app-sidebar",
        ".dark .app-layout header",
        "color-scheme: dark",
    ]

    for required in required_markers:
        if required not in edited:
            fail(f"Prewrite verification failed. Missing marker: {required}")

    if not BACKUP.exists():
        shutil.copy2(TARGET, BACKUP)
        print(f"[add_global_dark_shell_overrides] backup created: {BACKUP}")
    else:
        print(f"[add_global_dark_shell_overrides] backup already exists, preserved: {BACKUP}")

    TARGET.write_text(edited, encoding="utf-8")

    updated = TARGET.read_text(encoding="utf-8")
    for required in required_markers:
        if required not in updated:
            fail(f"Post-edit verification failed. Missing marker after write: {required}")

    print("\n[add_global_dark_shell_overrides] complete")
    print("\nNext checks:")
    print("  npm run build")
    print("  rg -n \"GLOBAL DARK SHELL OVERRIDES|--gallery-bg: #09090B|--bg-page: radial-gradient|dark #app-sidebar|color-scheme: dark|Gallery Walk\" src/index.css -C 6")
    print("  git diff -- src/index.css")


if __name__ == "__main__":
    main()
