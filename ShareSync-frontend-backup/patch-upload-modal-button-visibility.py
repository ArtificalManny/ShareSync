from pathlib import Path
from datetime import datetime
import re

CANDIDATES = [
    Path("src/components/vault/UploadModal.jsx"),
    Path("src/components/vault/UploadModal.tsx"),
    Path("src/components/vault/UploadModal.js"),
    Path("src/components/vault/UploadModal.ts"),
]

FILE_PATH = next((path for path in CANDIDATES if path.exists()), None)

if FILE_PATH is None:
    raise FileNotFoundError(
        "Could not find UploadModal in src/components/vault/. "
        "Expected one of: UploadModal.jsx, UploadModal.tsx, UploadModal.js, UploadModal.ts"
    )

original = FILE_PATH.read_text()

if "Upload File" not in original:
    raise RuntimeError(
        f"{FILE_PATH} was found, but it does not appear to contain the Upload File modal. "
        "No changes were written."
    )

backup_path = FILE_PATH.with_suffix(
    FILE_PATH.suffix + f".backup-upload-modal-button-visibility-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup_path.write_text(original)

button_blocks = list(re.finditer(r"<button\b[\s\S]*?</button>", original))

matches = []

for match in button_blocks:
    block = match.group(0)

    is_upload_action_button = (
        "<Upload" in block
        and re.search(r">\s*Upload\s*<|>\s*Upload\s*</button>|Upload\s*</button>", block)
        and "Click to upload" not in block
    )

    if is_upload_action_button:
        matches.append(match)

if len(matches) != 1:
    raise RuntimeError(
        f"Expected exactly 1 modal Upload action button, but found {len(matches)}. "
        f"No changes were written. Backup saved at {backup_path}"
    )

match = matches[0]
button_block = match.group(0)

opening_match = re.search(r"<button\b[\s\S]*?>", button_block)

if not opening_match:
    raise RuntimeError(
        f"Could not find opening button tag. No changes were written. Backup saved at {backup_path}"
    )

opening_tag = opening_match.group(0)

if "style=" in opening_tag:
    raise RuntimeError(
        f"The Upload button already has a style prop. No changes were written to avoid overwriting it. "
        f"Backup saved at {backup_path}"
    )

style_prop = """
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%)',
                color: '#ffffff',
                borderColor: 'rgba(124, 58, 237, 0.95)',
                boxShadow: '0 14px 32px rgba(109, 40, 217, 0.36)',
                opacity: 1,
              }}"""

new_opening_tag = opening_tag.replace(">", f"{style_prop}\n            >")

new_button_block = button_block.replace(opening_tag, new_opening_tag, 1)

new_button_block = new_button_block.replace(
    '<Upload className="',
    '<Upload className="text-white '
)

new_button_block = new_button_block.replace(
    '<span className="',
    '<span className="text-white '
)

updated = original[:match.start()] + new_button_block + original[match.end():]

FILE_PATH.write_text(updated)

print("Upload modal button visibility patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- The Upload action button inside the Upload File modal")
print("- Added an inline purple gradient, white text, stronger shadow, and full opacity")
print("")
print("No backend files were touched.")
print("No upload logic was changed.")
print("No folder logic was changed.")
print("No modal open/close logic was changed.")
