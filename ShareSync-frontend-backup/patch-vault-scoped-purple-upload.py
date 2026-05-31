from pathlib import Path
from datetime import datetime

FILE_PATH = Path("src/components/views/VaultView.jsx")

if not FILE_PATH.exists():
    raise FileNotFoundError(f"Could not find {FILE_PATH}")

original = FILE_PATH.read_text()

backup_path = FILE_PATH.with_suffix(
    FILE_PATH.suffix + f".backup-scoped-purple-upload-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup_path.write_text(original)

old_button = """            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="relative z-10 inline-flex items-center gap-2 rounded-2xl border border-purple-500 !bg-purple-700 px-5 py-3 text-sm font-black !text-white shadow-[0_16px_36px_rgba(126,34,206,0.42)] ring-2 ring-purple-200/80 transition-all hover:-translate-y-0.5 hover:!bg-purple-800 hover:shadow-[0_20px_44px_rgba(126,34,206,0.52)] focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-300/80 dark:border-purple-300/30 dark:!bg-purple-600 dark:hover:!bg-purple-500"
            >
              <Upload className="h-4 w-4 !text-white drop-shadow-sm" />
              <span className="!text-white drop-shadow-sm">Upload</span>
            </button>"""

new_button = """            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="vault-upload-button relative z-10 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition-all hover:-translate-y-0.5 focus:outline-none"
            >
              <Upload className="h-4 w-4 drop-shadow-sm" />
              <span className="drop-shadow-sm">Upload</span>
            </button>"""

old_return_start = """  return (
    <div className="relative mx-auto max-w-[1500px] px-4 py-8 pb-32 sm:px-6 lg:px-10">"""

new_return_start = """  return (
    <div className="relative mx-auto max-w-[1500px] px-4 py-8 pb-32 sm:px-6 lg:px-10">
      <style>
        {`
          .vault-upload-button {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
            color: #ffffff !important;
            border: 1px solid rgba(124, 58, 237, 0.95) !important;
            box-shadow: 0 16px 36px rgba(109, 40, 217, 0.38) !important;
            opacity: 1 !important;
            filter: none !important;
            mix-blend-mode: normal !important;
            isolation: isolate !important;
          }

          .vault-upload-button:hover {
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 48%, #5b21b6 100%) !important;
            box-shadow: 0 20px 44px rgba(109, 40, 217, 0.5) !important;
          }

          .vault-upload-button,
          .vault-upload-button span,
          .vault-upload-button svg {
            color: #ffffff !important;
            stroke: #ffffff !important;
          }
        `}
      </style>"""

updated = original

checks = [
    ("Upload button block", old_button, new_button),
    ("return wrapper", old_return_start, new_return_start),
]

for label, old, new in checks:
    count = updated.count(old)

    if count != 1:
        raise RuntimeError(
            f"Expected exactly 1 match for {label}, but found {count}. "
            f"No changes were written. Backup saved at {backup_path}"
        )

    updated = updated.replace(old, new, 1)

FILE_PATH.write_text(updated)

print("Scoped purple Upload button patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- Main Upload button class")
print("- Added scoped CSS inside VaultView.jsx for this button only")
print("")
print("No backend files were touched.")
print("No upload, folder, search, preview, rename, move, or delete logic was changed.")
