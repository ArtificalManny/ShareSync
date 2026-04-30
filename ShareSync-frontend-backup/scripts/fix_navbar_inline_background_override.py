#!/usr/bin/env python3
from pathlib import Path
import shutil
import sys

ROOT = Path.cwd()
TARGET = ROOT / "src/components/Navbar.jsx"
BACKUP = ROOT / "src/components/Navbar.jsx.bak.before-inline-bg-override-fix"


def fail(message: str) -> None:
    print(f"\n[fix_navbar_inline_background_override] ERROR: {message}")
    sys.exit(1)


def main() -> None:
    print("[fix_navbar_inline_background_override] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")

    if "NAVBAR INLINE BACKGROUND FIX" in source:
        fail("Navbar.jsx already appears to contain the inline background fix. Refusing to patch twice.")

    start_marker = "  const navbarGlowStyle = useMemo(() => {"
    end_marker = "  }, [glowLevel, isDarkMode, isFireMode]);"

    start = source.find(start_marker)
    if start == -1:
        fail("Could not find navbarGlowStyle start marker")

    end = source.find(end_marker, start)
    if end == -1:
        fail("Could not find navbarGlowStyle dependency marker")

    end += len(end_marker)

    old_block = source[start:end]

    if "background:" not in old_block:
        fail("navbarGlowStyle block does not appear to contain inline background anymore")

    new_block = """  // NAVBAR INLINE BACKGROUND FIX
  // Do not set `background` here. Inline background styles override Tailwind's
  // `dark:` classes. The navbar surface is controlled by className so it follows
  // the actual app theme reliably.
  const navbarGlowStyle = useMemo(() => {
    if (isFireMode) {
      return {
        boxShadow:
          "0 1px 0 rgba(249, 115, 22, 0.16), 0 4px 20px rgba(249, 115, 22, 0.10)",
        borderColor: "rgba(249, 115, 22, 0.18)",
      };
    }

    if (glowLevel >= 4) {
      return {
        boxShadow:
          "0 1px 0 rgba(139, 92, 246, 0.14), 0 4px 20px rgba(139, 92, 246, 0.10)",
        borderColor: "rgba(139, 92, 246, 0.16)",
      };
    }

    if (glowLevel >= 3) {
      return {
        boxShadow: "0 1px 0 rgba(139, 92, 246, 0.08)",
      };
    }

    return {};
  }, [glowLevel, isFireMode]);"""

    edited = source[:start] + new_block + source[end:]

    edited = edited.replace(
        'className="navbar navbar-dark-surface-refined sticky top-0 z-40 h-14 border-b border-slate-200/70 bg-white/85 px-4 text-slate-900 backdrop-blur-xl transition-all duration-500 dark:border-white/[0.08] dark:bg-[#09090B]/90 dark:text-zinc-100 lg:px-6"',
        'className="navbar navbar-dark-surface-refined sticky top-0 z-40 h-14 border-b border-slate-200/70 bg-white/85 px-4 text-slate-900 backdrop-blur-xl transition-all duration-500 dark:border-white/[0.08] dark:!bg-[#09090B]/92 dark:text-zinc-100 lg:px-6"'
    )

    required_markers = [
        "NAVBAR INLINE BACKGROUND FIX",
        "Do not set `background` here.",
        "dark:!bg-[#09090B]/92",
        "}, [glowLevel, isFireMode]);",
    ]

    for marker in required_markers:
        if marker not in edited:
            fail(f"Prewrite verification failed. Missing marker: {marker}")

    new_glow_block = edited[edited.find(start_marker):edited.find("  return (", edited.find(start_marker))]
    if "background:" in new_glow_block:
        fail("Prewrite verification failed: inline background still exists in navbarGlowStyle block")

    if not BACKUP.exists():
        shutil.copy2(TARGET, BACKUP)
        print(f"[fix_navbar_inline_background_override] backup created: {BACKUP}")
    else:
        print(f"[fix_navbar_inline_background_override] backup already exists, preserved: {BACKUP}")

    TARGET.write_text(edited, encoding="utf-8")

    updated = TARGET.read_text(encoding="utf-8")
    for marker in required_markers:
        if marker not in updated:
            fail(f"Post-edit verification failed. Missing marker after write: {marker}")

    print("\n[fix_navbar_inline_background_override] complete")
    print("\nNext checks:")
    print("  npm run build")
    print("  rg -n \"NAVBAR INLINE BACKGROUND FIX|navbar-dark-surface-refined|dark:!bg|navbarGlowStyle|background:\" src/components/Navbar.jsx -C 6")
    print("  git diff -- src/components/Navbar.jsx")


if __name__ == "__main__":
    main()
