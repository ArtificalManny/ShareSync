from pathlib import Path
from datetime import datetime
import re

FILE_PATH = Path("src/components/views/ThreadsView.jsx")

if not FILE_PATH.exists():
    raise FileNotFoundError(f"Could not find {FILE_PATH}")

original = FILE_PATH.read_text()
updated = original

timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup_path = FILE_PATH.with_suffix(
    FILE_PATH.suffix + f".backup-discussion-buttons-visible-v3-{timestamp}"
)
backup_path.write_text(original)

required_hooks = [
    "discussion-primary-button",
    "discussion-modal-create-button",
]

missing_hooks = [hook for hook in required_hooks if hook not in original]

if missing_hooks:
    raise RuntimeError(
        "Missing expected class hook(s): "
        + ", ".join(missing_hooks)
        + ". No changes were written."
    )

style_block = """
        <style className="discussion-button-visibility-v3-style">
          {`
            .discussion-primary-button,
            .discussion-modal-create-button {
              position: relative !important;
              isolation: isolate !important;
              overflow: hidden !important;
              border: 1px solid rgba(216, 180, 254, 0.96) !important;
              background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
              box-shadow:
                0 18px 40px rgba(124, 58, 237, 0.42),
                0 0 0 1px rgba(255, 255, 255, 0.38) inset !important;
              opacity: 1 !important;
              filter: none !important;
              mix-blend-mode: normal !important;
            }

            .discussion-primary-button::before,
            .discussion-modal-create-button::before {
              content: "" !important;
              position: absolute !important;
              inset: 1px !important;
              z-index: -1 !important;
              border-radius: inherit !important;
              background:
                radial-gradient(circle at 18% 18%, rgba(255, 255, 255, 0.42), transparent 34%),
                linear-gradient(135deg, rgba(255, 255, 255, 0.20), transparent 62%) !important;
              pointer-events: none !important;
            }

            .discussion-primary-button,
            .discussion-primary-button *,
            .discussion-primary-button span,
            .discussion-primary-button svg,
            .discussion-modal-create-button,
            .discussion-modal-create-button *,
            .discussion-modal-create-button span,
            .discussion-modal-create-button svg {
              color: #ffffff !important;
              -webkit-text-fill-color: #ffffff !important;
              opacity: 1 !important;
              filter: none !important;
              mix-blend-mode: normal !important;
              text-shadow: 0 1px 8px rgba(15, 23, 42, 0.32) !important;
            }

            .discussion-primary-button:hover:not(:disabled),
            .discussion-modal-create-button:hover:not(:disabled) {
              background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 48%, #5b21b6 100%) !important;
              box-shadow:
                0 22px 48px rgba(124, 58, 237, 0.52),
                0 0 0 1px rgba(255, 255, 255, 0.44) inset !important;
              transform: translateY(-1px) !important;
            }

            .discussion-primary-button:disabled,
            .discussion-modal-create-button:disabled {
              background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 50%, #7c3aed 100%) !important;
              border-color: rgba(221, 214, 254, 0.98) !important;
              opacity: 0.92 !important;
              cursor: not-allowed !important;
              box-shadow:
                0 14px 32px rgba(124, 58, 237, 0.30),
                0 0 0 1px rgba(255, 255, 255, 0.36) inset !important;
            }

            .discussion-primary-button:disabled *,
            .discussion-modal-create-button:disabled * {
              color: #ffffff !important;
              -webkit-text-fill-color: #ffffff !important;
              opacity: 1 !important;
              text-shadow: 0 1px 8px rgba(15, 23, 42, 0.28) !important;
            }
          `}
        </style>
"""

existing_v3_pattern = re.compile(
    r"\n\s*<style className=\"discussion-button-visibility-v3-style\">.*?</style>",
    re.DOTALL,
)

if existing_v3_pattern.search(updated):
    updated = existing_v3_pattern.sub("\n" + style_block, updated, count=1)
else:
    hook_index = updated.find(".discussion-primary-button")

    if hook_index == -1:
        raise RuntimeError(
            "Could not find existing .discussion-primary-button CSS. No changes were written."
        )

    style_start = updated.rfind("<style", 0, hook_index)
    style_end = updated.find("</style>", hook_index)

    if style_start == -1 or style_end == -1:
        raise RuntimeError(
            "Could not locate the existing style block around discussion-primary-button. No changes were written."
        )

    insert_at = style_end + len("</style>")
    updated = updated[:insert_at] + "\n" + style_block + updated[insert_at:]

unsafe_patterns = [
    "onClick={() = className=",
    "onClick={()= className=",
    "className==",
]

for bad in unsafe_patterns:
    if bad in updated:
        FILE_PATH.write_text(original)
        raise RuntimeError(
            f"Unsafe JSX corruption pattern detected: {bad}. Original file restored. Backup saved at {backup_path}"
        )

if updated == original:
    raise RuntimeError("No changes were made. Backup was still saved.")

FILE_PATH.write_text(updated)

print("Discussion button visibility v3 patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- New Discussion button visibility")
print("- Create Discussion modal button visibility")
print("- Added scoped CSS overrides for those button hooks only")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No thread fetching, filtering, messaging, modal state, or create-discussion logic was changed.")
