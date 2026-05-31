from pathlib import Path
from datetime import datetime
import re

FILE_PATH = Path("src/components/views/ThreadsView.jsx")

if not FILE_PATH.exists():
    raise FileNotFoundError(f"Could not find {FILE_PATH}")

original = FILE_PATH.read_text()
updated = original

timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup_path = FILE_PATH.with_suffix(FILE_PATH.suffix + f".backup-discussion-buttons-visible-v2-{timestamp}")
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
        + ". No changes were written. This patch expects the previous Discussion visual patch to have added these hooks."
    )

style_block = """
        <style className="discussion-button-visibility-v2-style">
          {`
            .discussion-primary-button,
            .discussion-modal-create-button {
              position: relative !important;
              isolation: isolate !important;
              overflow: hidden !important;
              border: 1px solid rgba(196, 181, 253, 0.92) !important;
              background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
              box-shadow:
                0 16px 34px rgba(124, 58, 237, 0.38),
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
                radial-gradient(circle at 18% 18%, rgba(255, 255, 255, 0.36), transparent 34%),
                linear-gradient(135deg, rgba(255, 255, 255, 0.18), transparent 58%) !important;
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
              text-shadow: 0 1px 8px rgba(15, 23, 42, 0.24) !important;
            }

            .discussion-primary-button:hover:not(:disabled),
            .discussion-modal-create-button:hover:not(:disabled) {
              background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 48%, #5b21b6 100%) !important;
              box-shadow:
                0 20px 42px rgba(124, 58, 237, 0.48),
                0 0 0 1px rgba(255, 255, 255, 0.42) inset !important;
              transform: translateY(-1px) !important;
            }

            .discussion-primary-button:disabled,
            .discussion-modal-create-button:disabled {
              background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 52%, #7c3aed 100%) !important;
              border-color: rgba(216, 180, 254, 0.95) !important;
              opacity: 0.88 !important;
              cursor: not-allowed !important;
              box-shadow:
                0 12px 28px rgba(124, 58, 237, 0.24),
                0 0 0 1px rgba(255, 255, 255, 0.34) inset !important;
            }

            .discussion-primary-button:disabled *,
            .discussion-modal-create-button:disabled * {
              color: #ffffff !important;
              -webkit-text-fill-color: #ffffff !important;
              opacity: 0.96 !important;
            }

            .dark .discussion-primary-button,
            .dark .discussion-modal-create-button {
              border-color: rgba(196, 181, 253, 0.46) !important;
              background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
              box-shadow:
                0 18px 42px rgba(124, 58, 237, 0.44),
                0 0 0 1px rgba(255, 255, 255, 0.16) inset !important;
            }

            .dark .discussion-primary-button:disabled,
            .dark .discussion-modal-create-button:disabled {
              background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 55%, #5b21b6 100%) !important;
              opacity: 0.78 !important;
            }
          `}
        </style>
"""

existing_style_pattern = re.compile(
    r"\n\s*<style className=\"discussion-button-visibility-v2-style\">.*?</style>",
    re.DOTALL,
)

if existing_style_pattern.search(updated):
    updated = existing_style_pattern.sub("\n" + style_block, updated, count=1)
else:
    anchor = '<style className="discussion-visual-scope">'
    if anchor not in updated:
        raise RuntimeError(
            "Could not find discussion-visual-scope style anchor. No changes were written."
        )

    updated = updated.replace(
        anchor,
        style_block + "\n        " + anchor,
        1,
    )

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

print("Discussion button visibility v2 patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- New Discussion button visibility")
print("- Create Discussion modal button visibility")
print("- Added scoped CSS overrides for these two buttons only")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No thread fetching, filtering, messaging, modal state, or create-discussion logic was changed.")
