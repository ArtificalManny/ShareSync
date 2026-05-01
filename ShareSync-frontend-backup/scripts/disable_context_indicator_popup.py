from pathlib import Path
from datetime import datetime
import shutil

TARGET = Path("src/components/context/ContextIndicator.jsx")

def require_once(text, needle, label):
    count = text.count(needle)
    if count != 1:
        raise SystemExit(
            f"[disable_context_indicator_popup] ERROR: {label}: expected 1 occurrence, found {count}"
        )

def main():
    print("[disable_context_indicator_popup] starting")

    if not TARGET.exists():
        raise SystemExit(f"[disable_context_indicator_popup] ERROR: missing file: {TARGET}")

    text = TARGET.read_text()

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = TARGET.with_suffix(f".jsx.bak.before-disable-context-indicator-{timestamp}")
    shutil.copy2(TARGET, backup)

    updated = text

    # 1) Add a single local kill switch above the component.
    if "CONTEXT_INDICATOR_VISUALS_ENABLED" not in updated:
        require_once(
            updated,
            "const ContextIndicator = () => {",
            "ContextIndicator component declaration",
        )

        updated = updated.replace(
            "const ContextIndicator = () => {",
            "// CONTEXT INDICATOR POPUP DISABLED\n"
            "// Keeps the component import-safe while preventing the bottom-right\n"
            "// \"Syncing...\" / \"Synced\" micro-toast from appearing.\n"
            "const CONTEXT_INDICATOR_VISUALS_ENABLED = false;\n\n"
            "const ContextIndicator = () => {",
            1,
        )

    # 2) Stop registering the window event listeners when the indicator is disabled.
    listener_anchor = (
        "  useEffect(() => {\n"
        "    window.addEventListener('context-saving', handleContextSaving);"
    )

    if listener_anchor in updated and "if (!CONTEXT_INDICATOR_VISUALS_ENABLED)" not in updated.split(listener_anchor, 1)[1][:220]:
        updated = updated.replace(
            listener_anchor,
            "  useEffect(() => {\n"
            "    if (!CONTEXT_INDICATOR_VISUALS_ENABLED) {\n"
            "      return undefined;\n"
            "    }\n\n"
            "    window.addEventListener('context-saving', handleContextSaving);",
            1,
        )

    # 3) Render nothing while disabled, but keep hooks above this point stable.
    render_anchor = (
        "  return (\n"
        "    <AnimatePresence mode=\"wait\">"
    )

    if "return null;" not in updated.split(render_anchor, 1)[0] if render_anchor in updated else True:
        require_once(updated, render_anchor, "ContextIndicator return block")

        updated = updated.replace(
            render_anchor,
            "  if (!CONTEXT_INDICATOR_VISUALS_ENABLED) {\n"
            "    return null;\n"
            "  }\n\n"
            "  return (\n"
            "    <AnimatePresence mode=\"wait\">",
            1,
        )

    # Verification
    required_markers = [
        "CONTEXT INDICATOR POPUP DISABLED",
        "const CONTEXT_INDICATOR_VISUALS_ENABLED = false;",
        "if (!CONTEXT_INDICATOR_VISUALS_ENABLED) {",
        "return null;",
    ]

    for marker in required_markers:
        if marker not in updated:
            raise SystemExit(
                f"[disable_context_indicator_popup] ERROR: verification failed, missing marker: {marker}"
            )

    TARGET.write_text(updated)

    print(f"[disable_context_indicator_popup] backup created: {backup}")
    print("[disable_context_indicator_popup] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "CONTEXT INDICATOR POPUP DISABLED|CONTEXT_INDICATOR_VISUALS_ENABLED|context-saving|context-saved|context-error|Synced|Syncing" src/components/context/ContextIndicator.jsx -C 6')
    print("  git diff -- src/components/context/ContextIndicator.jsx")

if __name__ == "__main__":
    main()
