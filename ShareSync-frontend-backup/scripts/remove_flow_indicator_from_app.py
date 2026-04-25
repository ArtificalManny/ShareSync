from pathlib import Path
from datetime import datetime
import sys

ROOT = Path.cwd()
APP = ROOT / "src/App.jsx"

FLOW_LAZY_BLOCK = """// ⭐ PHASE 6: Flow State Indicator
const FlowIndicator = lazy(() =>
  import("./components/flow/FlowIndicator").then((m) => ({ default: m.default }))
);

"""

FLOW_USAGE_BLOCK = """                                      <Suspense fallback={null}>
                                        <FlowIndicator position="bottom-left" />
                                      </Suspense>
"""

def fail(message):
    print(f"\\n[remove_flow_indicator_from_app] ERROR: {message}\\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[remove_flow_indicator_from_app] starting")

    if not APP.exists():
        fail(f"Could not find {APP}")

    source = APP.read_text(encoding="utf-8")
    original = source

    required_before = [
        "function AuthenticatedApp",
        "FlowStateProvider",
        "ContextIndicator",
        "FlowIndicator",
        "FocusProvider",
        "AppRoutes",
    ]

    for marker in required_before:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}. No changes were written.")

    if FLOW_LAZY_BLOCK not in source:
        fail("Could not find exact FlowIndicator lazy import block. No changes were written.")

    usage_count = source.count(FLOW_USAGE_BLOCK)
    if usage_count != 2:
        fail(f"Expected exactly 2 FlowIndicator render blocks, found {usage_count}. No changes were written.")

    source = source.replace(FLOW_LAZY_BLOCK, "", 1)
    source = source.replace(FLOW_USAGE_BLOCK, "", 2)

    forbidden_after = [
        "const FlowIndicator = lazy",
        'import("./components/flow/FlowIndicator")',
        "<FlowIndicator",
    ]

    for marker in forbidden_after:
        if marker in source:
            fail(f"Safety check failed. FlowIndicator marker still exists in App.jsx: {marker}")

    required_after = [
        "FlowStateProvider",
        "ContextIndicator",
        "FocusProvider",
        "ContextPreservationProvider",
        "MomentumProvider",
        "BreakReminder",
        "AppRoutes",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed. Important app marker missing after patch: {marker}")

    backup = APP.with_suffix(APP.suffix + f".bak-remove-flow-indicator-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    backup.write_text(original, encoding="utf-8")
    print(f"[remove_flow_indicator_from_app] backup created: {backup}")

    APP.write_text(source, encoding="utf-8")
    print(f"[remove_flow_indicator_from_app] patched: {APP}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"FlowIndicator|BuildingIndicator|InFlowIndicator|components/flow/FlowIndicator|flow/FlowIndicator\" src/App.jsx src/main.jsx src/layouts src/components src/pages")
    print("  git diff -- src/App.jsx")

if __name__ == "__main__":
    main()
