from pathlib import Path
from datetime import datetime
import re

FILE_PATH = Path("src/components/views/ThreadsView.jsx")

if not FILE_PATH.exists():
    raise FileNotFoundError(f"Could not find {FILE_PATH}")

original = FILE_PATH.read_text()
timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup_path = FILE_PATH.with_suffix(
    FILE_PATH.suffix + f".backup-discussion-buttons-visible-final-css-{timestamp}"
)
backup_path.write_text(original)

updated = original

marker = "discussion-buttons-hard-final-css"
if marker in updated:
    print("Final discussion button CSS already exists. No duplicate inserted.")
    print(f"File: {FILE_PATH}")
    raise SystemExit(0)

css = r"""

        /* discussion-buttons-hard-final-css */
        button.discussion-primary-button,
        button.discussion-modal-create-button,
        .discussion-primary-button,
        .discussion-modal-create-button {
          position: relative !important;
          isolation: isolate !important;
          background-color: #7c3aed !important;
          background-image: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          opacity: 1 !important;
          visibility: visible !important;
          border: 1px solid rgba(221, 214, 254, 0.98) !important;
          box-shadow:
            0 18px 44px rgba(124, 58, 237, 0.46),
            0 0 0 1px rgba(255, 255, 255, 0.28) inset,
            inset 0 1px 0 rgba(255, 255, 255, 0.38) !important;
          text-shadow: 0 1px 2px rgba(15, 23, 42, 0.42) !important;
          filter: none !important;
          mix-blend-mode: normal !important;
          backdrop-filter: none !important;
          transform: translateZ(0) !important;
        }

        button.discussion-primary-button::before,
        button.discussion-primary-button::after,
        button.discussion-modal-create-button::before,
        button.discussion-modal-create-button::after,
        .discussion-primary-button::before,
        .discussion-primary-button::after,
        .discussion-modal-create-button::before,
        .discussion-modal-create-button::after {
          content: none !important;
          display: none !important;
          opacity: 0 !important;
        }

        button.discussion-primary-button *,
        button.discussion-modal-create-button *,
        .discussion-primary-button *,
        .discussion-modal-create-button *,
        .discussion-primary-button span,
        .discussion-modal-create-button span,
        .discussion-primary-button svg,
        .discussion-modal-create-button svg {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          opacity: 1 !important;
          stroke: currentColor !important;
          filter: none !important;
          mix-blend-mode: normal !important;
        }

        button.discussion-primary-button:disabled,
        button.discussion-modal-create-button:disabled,
        .discussion-primary-button:disabled,
        .discussion-modal-create-button:disabled,
        .discussion-primary-button[disabled],
        .discussion-modal-create-button[disabled] {
          background-color: #7c3aed !important;
          background-image: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 45%, #7c3aed 100%) !important;
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          opacity: 1 !important;
          border-color: rgba(221, 214, 254, 1) !important;
          box-shadow:
            0 14px 34px rgba(124, 58, 237, 0.34),
            inset 0 1px 0 rgba(255, 255, 255, 0.4) !important;
          cursor: not-allowed !important;
        }

        button.discussion-primary-button:hover:not(:disabled),
        button.discussion-modal-create-button:hover:not(:disabled),
        .discussion-primary-button:hover:not(:disabled),
        .discussion-modal-create-button:hover:not(:disabled) {
          background-color: #6d28d9 !important;
          background-image: linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%) !important;
          box-shadow:
            0 22px 52px rgba(124, 58, 237, 0.54),
            0 0 0 1px rgba(255, 255, 255, 0.34) inset,
            inset 0 1px 0 rgba(255, 255, 255, 0.42) !important;
        }
"""

# Insert into the LAST existing JSX style block, right before its closing `}</style>.
matches = list(re.finditer(r"`\s*}\s*</style>", updated))

if not matches:
    FILE_PATH.write_text(original)
    raise RuntimeError("Could not find an existing JSX <style>{`...`}</style> block. No changes were written.")

last = matches[-1]
updated = updated[:last.start()] + css + "\n" + updated[last.start():]

# Safety checks.
bad_patterns = [
    "onClick={() =",
    "background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;\n          color",
]

for bad in bad_patterns:
    if bad in updated and bad not in original:
        FILE_PATH.write_text(original)
        raise RuntimeError(f"Unsafe JSX/CSS corruption pattern detected: {bad}. Original restored.")

FILE_PATH.write_text(updated)

print("Discussion button hard final CSS patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- Added final CSS override for New Discussion")
print("- Added final CSS override for Create Discussion")
print("- Forced readable disabled-state contrast")
print("- Disabled pseudo-element washout on those buttons only")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No thread fetching, filtering, messaging, modal state, or create-discussion logic was changed.")
