from pathlib import Path
from datetime import datetime
import shutil

TARGET = Path("src/utils/predictionEngine.js")

def require_once(text: str, needle: str, label: str) -> None:
    count = text.count(needle)
    if count != 1:
        raise SystemExit(
            f"[disable_social_prediction_popups] ERROR: {label}: expected 1 occurrence, found {count}"
        )

def main():
    print("[disable_social_prediction_popups] starting")

    if not TARGET.exists():
        raise SystemExit(f"[disable_social_prediction_popups] ERROR: missing file: {TARGET}")

    text = TARGET.read_text()

    old_promise_block = """    const [
      timePatterns,
      sequencePatterns,
      contextPatterns,
      socialPatterns,
    ] = await Promise.all([
      analyzeTimeBasedPatterns(),
      analyzeSequenceBasedPatterns(),
      analyzeContextBasedPatterns(),
      analyzeSocialBasedPatterns(),
    ]);"""

    new_promise_block = """    const [
      timePatterns,
      sequencePatterns,
      contextPatterns,
    ] = await Promise.all([
      analyzeTimeBasedPatterns(),
      analyzeSequenceBasedPatterns(),
      analyzeContextBasedPatterns(),
    ]);"""

    old_predictions_block = """    const allPredictions = [
      ...timePatterns,
      ...sequencePatterns,
      ...contextPatterns,
      ...socialPatterns,
    ];"""

    new_predictions_block = """    const allPredictions = [
      ...timePatterns,
      ...sequencePatterns,
      ...contextPatterns,
    ];"""

    require_once(text, old_promise_block, "prediction Promise.all block")
    require_once(text, old_predictions_block, "allPredictions social spread block")

    updated = text.replace(old_promise_block, new_promise_block)
    updated = updated.replace(old_predictions_block, new_predictions_block)

    function_start_marker = "async function analyzeSocialBasedPatterns() {"
    helper_marker = "\n// ====================================================================\n// HELPER FUNCTIONS\n// ===================================================================="

    if function_start_marker not in updated:
        raise SystemExit("[disable_social_prediction_popups] ERROR: social prediction function start not found")

    function_start = updated.index(function_start_marker)
    helper_start = updated.index(helper_marker, function_start)

    new_social_function = """async function analyzeSocialBasedPatterns() {
  // Social/team prediction popups are intentionally disabled.
  // This prevents generated teammate nudges such as "Sarah shipped..."
  // from appearing as bottom-screen prediction/toast prompts.
  return [];
}

"""

    updated = updated[:function_start] + new_social_function + updated[helper_start:]

    backup = TARGET.with_suffix(
        TARGET.suffix + f".bak.before-disable-social-predictions-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    )
    shutil.copy2(TARGET, backup)

    TARGET.write_text(updated)

    print(f"[disable_social_prediction_popups] backup created: {backup}")
    print("[disable_social_prediction_popups] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "socialPatterns|analyzeSocialBasedPatterns|Sarah|teammate-trigger|team-activity|shipped → you usually review" src/utils/predictionEngine.js -C 6')
    print("  git diff -- src/utils/predictionEngine.js")

if __name__ == "__main__":
    main()
