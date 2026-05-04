from pathlib import Path
from datetime import datetime

TARGET = Path("src/components/ui/GlobalPulseBar.jsx")

def replace_exact(text, old, new, label, expected=1):
    count = text.count(old)
    if count != expected:
        raise SystemExit(
            f"[disable_global_pulse_demo_popup] ERROR: {label}: expected {expected}, found {count}"
        )
    return text.replace(old, new, expected)

def main():
    print("[disable_global_pulse_demo_popup] starting")

    if not TARGET.exists():
        raise SystemExit(f"[disable_global_pulse_demo_popup] ERROR: missing {TARGET}")

    text = TARGET.read_text()
    original = text

    old = """  // Demo: Random pulse every 30-60 seconds (remove in production)
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.85) { // 15% chance
        triggerPulse({
          user: 'Sarah',
          action: 'shipped',
          target: 'API v2 endpoint',
        });
      }
    }, 45000);

    return () => clearInterval(interval);
  }, [triggerPulse]);"""

    new = """  // Demo pulse disabled.
  // This used to randomly show fake bottom-screen popups such as:
  // "Sarah shipped API v2 endpoint".
  // Keep real event-driven pulses above, but do not generate fake demo activity.
  useEffect(() => {
    return undefined;
  }, []);"""

    text = replace_exact(
        text,
        old,
        new,
        "remove Sarah/API v2 demo pulse interval",
    )

    if text == original:
        raise SystemExit("[disable_global_pulse_demo_popup] ERROR: no changes made")

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = TARGET.with_suffix(f".jsx.bak.before-disable-demo-pulse-{timestamp}")
    backup.write_text(original)

    TARGET.write_text(text)

    updated = TARGET.read_text()

    forbidden = [
        "Sarah",
        "API v2 endpoint",
        "Math.random() > 0.85",
        "setInterval(() =>",
    ]

    for marker in forbidden:
        if marker in updated:
            raise SystemExit(
                f"[disable_global_pulse_demo_popup] ERROR: forbidden demo marker still present: {marker}"
            )

    required = [
        "Demo pulse disabled.",
        "Keep real event-driven pulses above",
        "window.addEventListener('team-ship', handleShipEvent);",
        "window.addEventListener('global-pulse', handleShipEvent);",
    ]

    for marker in required:
        if marker not in updated:
            raise SystemExit(
                f"[disable_global_pulse_demo_popup] ERROR: verification marker missing: {marker}"
            )

    print(f"[disable_global_pulse_demo_popup] backup created: {backup}")
    print("[disable_global_pulse_demo_popup] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "Sarah|API v2 endpoint|Demo pulse disabled|setInterval|team-ship|global-pulse" src/components/ui/GlobalPulseBar.jsx -C 6')
    print("  git diff -- src/components/ui/GlobalPulseBar.jsx")

if __name__ == "__main__":
    main()
