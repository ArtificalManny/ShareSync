from pathlib import Path
from datetime import datetime
import re

TARGET = Path("src/components/ui/GlobalPulseBar.jsx")

def main():
    print("[cleanup_global_pulse_demo_popup_patch] starting")

    if not TARGET.exists():
        raise SystemExit(f"[cleanup_global_pulse_demo_popup_patch] ERROR: missing {TARGET}")

    text = TARGET.read_text()
    original = text

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = TARGET.with_suffix(f".jsx.bak.before-cleanup-demo-pulse-{timestamp}")
    backup.write_text(original)

    # Case 1: remove the original fake demo timer block if it is still present.
    original_demo_pattern = re.compile(
        r"""
\s{2}//\s*Demo:\s*Random\s*pulse[\s\S]*?
\s{2}useEffect\(\(\)\s*=>\s*\{
\s{4}const\s+interval\s*=\s*setInterval\(\(\)\s*=>\s*\{
[\s\S]*?
\s{4}return\s*\(\)\s*=>\s*clearInterval\(interval\);
\s{2}\},\s*\[triggerPulse\]\);
        """,
        re.VERBOSE,
    )

    disabled_block = """  // Demo pulse disabled.
  // Keep real event-driven pulses above, but do not generate fake demo activity.
  useEffect(() => {
    return undefined;
  }, []);"""

    text = original_demo_pattern.sub("\n" + disabled_block, text)

    # Case 2: previous patch already disabled the timer but left forbidden demo words in comments.
    partial_disabled_pattern = re.compile(
        r"""
\s{2}//\s*Demo\s+pulse\s+disabled\.[\s\S]*?
\s{2}useEffect\(\(\)\s*=>\s*\{
\s{4}return\s+undefined;
\s{2}\},\s*\[\]\);
        """,
        re.VERBOSE,
    )

    text = partial_disabled_pattern.sub("\n" + disabled_block, text)

    # Extra cleanup for any lingering comment-only demo language.
    text = text.replace("Sarah shipped API v2 endpoint", "fake demo pulse")
    text = text.replace("Sarah", "Demo user")
    text = text.replace("API v2 endpoint", "demo target")

    if text == original:
        print("[cleanup_global_pulse_demo_popup_patch] no source changes needed")
    else:
        TARGET.write_text(text)

    updated = TARGET.read_text()

    forbidden_markers = [
        "user: 'Sarah'",
        'user: "Sarah"',
        "target: 'API v2 endpoint'",
        'target: "API v2 endpoint"',
        "Math.random() > 0.85",
        "clearInterval(interval)",
    ]

    for marker in forbidden_markers:
        if marker in updated:
            raise SystemExit(
                f"[cleanup_global_pulse_demo_popup_patch] ERROR: forbidden demo marker still present: {marker}"
            )

    required_markers = [
        "Demo pulse disabled.",
        "Keep real event-driven pulses above",
        "window.addEventListener('team-ship', handleShipEvent);",
        "window.addEventListener('global-pulse', handleShipEvent);",
    ]

    for marker in required_markers:
        if marker not in updated:
            raise SystemExit(
                f"[cleanup_global_pulse_demo_popup_patch] ERROR: verification marker missing: {marker}"
            )

    print(f"[cleanup_global_pulse_demo_popup_patch] backup created: {backup}")
    print("[cleanup_global_pulse_demo_popup_patch] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "Sarah|API v2 endpoint|Demo pulse disabled|Math.random|setInterval|clearInterval|team-ship|global-pulse" src/components/ui/GlobalPulseBar.jsx -C 6')
    print("  git diff -- src/components/ui/GlobalPulseBar.jsx")

if __name__ == "__main__":
    main()
