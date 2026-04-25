from pathlib import Path
import sys
from datetime import datetime

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"

BAD_CLOSE = """          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS BAR — Compact social proof"""

GOOD_CLOSE = """          </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS BAR — Compact social proof"""

def fail(message):
    print(f"\n[fix_profile_glass_hero_closing_div] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[fix_profile_glass_hero_closing_div] starting")

    if not PROFILE.exists():
        fail(f"Could not find {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    required = [
        "HEADER SECTION",
        "backdrop-blur-xl",
        "radial-gradient(circle_at_50%_12%",
        "ProfilePhotoEditor",
        "Edit Profile",
        "STATS BAR — Compact social proof",
    ]

    for marker in required:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}. No changes were written.")

    if GOOD_CLOSE in source:
        print("[fix_profile_glass_hero_closing_div] closing div structure already appears fixed")
        return

    if BAD_CLOSE not in source:
        fail("Could not find the exact broken header closing block. No changes were written.")

    source = source.replace(BAD_CLOSE, GOOD_CLOSE, 1)

    required_after = [
        "backdrop-blur-xl",
        "radial-gradient(circle_at_50%_12%",
        "ProfilePhotoEditor",
        "Edit Profile",
        "STATS BAR — Compact social proof",
        GOOD_CLOSE,
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    backup = PROFILE.with_suffix(PROFILE.suffix + f".bak-fix-glass-hero-closing-div-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    backup.write_text(original, encoding="utf-8")
    print(f"[fix_profile_glass_hero_closing_div] backup created: {backup}")

    PROFILE.write_text(source, encoding="utf-8")
    print(f"[fix_profile_glass_hero_closing_div] patched: {PROFILE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"HEADER SECTION|backdrop-blur-xl|ProfilePhotoEditor|Edit Profile|STATS BAR\" src/pages/Profile.jsx -C 8")
    print("  git diff -- src/pages/Profile.jsx")

if __name__ == "__main__":
    main()
