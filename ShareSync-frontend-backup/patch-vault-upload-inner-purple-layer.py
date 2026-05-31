from pathlib import Path
from datetime import datetime

FILE_PATH = Path("src/components/views/VaultView.jsx")

if not FILE_PATH.exists():
    raise FileNotFoundError(f"Could not find {FILE_PATH}")

original = FILE_PATH.read_text()

backup_path = FILE_PATH.with_suffix(
    FILE_PATH.suffix + f".backup-upload-inner-purple-layer-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup_path.write_text(original)

old_button = """            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="vault-upload-button relative z-10 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition-all hover:-translate-y-0.5 focus:outline-none"
            >
              <Upload className="h-4 w-4 drop-shadow-sm" />
              <span className="drop-shadow-sm">Upload</span>
            </button>"""

new_button = """            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="vault-upload-button relative z-10 isolate inline-flex items-center gap-2 overflow-hidden rounded-2xl px-5 py-3 text-sm font-black transition-all hover:-translate-y-0.5 focus:outline-none"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.26)',
                }}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-2xl border border-violet-200/90"
              />
              <Upload className="relative z-10 h-4 w-4 text-white drop-shadow-sm" />
              <span className="relative z-10 text-white drop-shadow-sm">Upload</span>
            </button>"""

count = original.count(old_button)

if count != 1:
    raise RuntimeError(
        f"Expected exactly 1 current Upload button block match, but found {count}. "
        f"No changes were written. Backup saved at {backup_path}"
    )

updated = original.replace(old_button, new_button, 1)

FILE_PATH.write_text(updated)

print("Upload inner purple layer patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- Main Upload button JSX")
print("- Added an internal purple paint layer inside the button")
print("")
print("No backend files were touched.")
print("No upload, folder, search, preview, rename, move, or delete logic was changed.")
