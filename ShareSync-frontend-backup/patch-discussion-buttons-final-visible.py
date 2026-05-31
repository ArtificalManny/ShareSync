from pathlib import Path
from datetime import datetime

FILE_PATH = Path("src/components/views/ThreadsView.jsx")

if not FILE_PATH.exists():
    raise FileNotFoundError(f"Could not find {FILE_PATH}")

original = FILE_PATH.read_text()
timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")

backup_path = FILE_PATH.with_suffix(
    FILE_PATH.suffix + f".backup-discussion-buttons-final-visible-{timestamp}"
)
backup_path.write_text(original)

final_css = r"""
        /* FINAL visibility override: Discussion buttons only */
        .discussion-primary-button,
        .discussion-modal-create-button {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
          color: #ffffff !important;
          opacity: 1 !important;
          border: 1px solid rgba(196, 181, 253, 0.95) !important;
          box-shadow:
            0 18px 42px rgba(124, 58, 237, 0.42),
            inset 0 1px 0 rgba(255, 255, 255, 0.34) !important;
          text-shadow: 0 1px 2px rgba(15, 23, 42, 0.35) !important;
          filter: none !important;
          mix-blend-mode: normal !important;
          backdrop-filter: none !important;
        }

        .discussion-primary-button *,
        .discussion-primary-button span,
        .discussion-primary-button svg,
        .discussion-modal-create-button *,
        .discussion-modal-create-button span,
        .discussion-modal-create-button svg {
          color: #ffffff !important;
          stroke: #ffffff !important;
          fill: none;
          opacity: 1 !important;
          filter: none !important;
          mix-blend-mode: normal !important;
        }

        .discussion-primary-button:hover:not(:disabled),
        .discussion-modal-create-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 48%, #5b21b6 100%) !important;
          box-shadow:
            0 22px 54px rgba(124, 58, 237, 0.52),
            inset 0 1px 0 rgba(255, 255, 255, 0.38) !important;
          transform: translateY(-1px);
        }

        .discussion-primary-button:disabled,
        .discussion-modal-create-button:disabled {
          background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 48%, #7c3aed 100%) !important;
          color: #ffffff !important;
          opacity: 0.92 !important;
          cursor: not-allowed !important;
          box-shadow:
            0 14px 34px rgba(124, 58, 237, 0.34),
            inset 0 1px 0 rgba(255, 255, 255, 0.32) !important;
        }

        .discussion-primary-button:disabled *,
        .discussion-primary-button:disabled span,
        .discussion-primary-button:disabled svg,
        .discussion-modal-create-button:disabled *,
        .discussion-modal-create-button:disabled span,
        .discussion-modal-create-button:disabled svg {
          color: #ffffff !important;
          stroke: #ffffff !important;
          opacity: 1 !important;
        }
"""

if "FINAL visibility override: Discussion buttons only" in original:
    updated = original
else:
    marker = "</style>"
    last_style_index = original.rfind(marker)

    if last_style_index == -1:
        raise RuntimeError(
            "Could not find an existing </style> block in ThreadsView.jsx. "
            "No changes were written."
        )

    updated = (
        original[:last_style_index]
        + final_css
        + "\n"
        + original[last_style_index:]
    )

# Very narrow corruption checks only.
unsafe_patterns = [
    "onClick={() = className=",
    "onClick={()= className=",
    "onClick={className=",
    "className==",
]

for bad in unsafe_patterns:
    if bad in updated:
        FILE_PATH.write_text(original)
        raise RuntimeError(
            f"Unsafe JSX corruption pattern detected: {bad}. Original restored. Backup saved at {backup_path}"
        )

FILE_PATH.write_text(updated)

print("Final discussion button visibility patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- Final scoped CSS override for New Discussion")
print("- Final scoped CSS override for Create Discussion")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No thread fetching, filtering, messaging, modal state, or create-discussion logic was changed.")
