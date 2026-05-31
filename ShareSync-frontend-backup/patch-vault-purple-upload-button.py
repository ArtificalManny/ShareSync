from pathlib import Path
from datetime import datetime

FILE_PATH = Path("src/components/views/VaultView.jsx")

if not FILE_PATH.exists():
    raise FileNotFoundError(f"Could not find {FILE_PATH}")

original = FILE_PATH.read_text()

backup_path = FILE_PATH.with_suffix(
    FILE_PATH.suffix + f".backup-purple-upload-button-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup_path.write_text(original)

old_button = """            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="relative z-10 inline-flex items-center gap-2 rounded-2xl border border-violet-300/80 bg-gradient-to-r from-violet-700 via-fuchsia-600 to-rose-500 px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(124,58,237,0.35)] ring-1 ring-violet-200/80 transition-all hover:-translate-y-0.5 hover:from-violet-800 hover:via-fuchsia-700 hover:to-rose-600 hover:shadow-[0_18px_38px_rgba(124,58,237,0.42)] focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-300/70 dark:border-white/20 dark:ring-violet-400/25"
            >
              <Upload className="h-4 w-4 drop-shadow-sm" />
              <span className="drop-shadow-sm">Upload</span>
            </button>"""

new_button = """            <button
              onClick={() => setIsUploadModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 52%, #5b21b6 100%)',
                boxShadow: '0 16px 36px rgba(109, 40, 217, 0.42)',
              }}
              className="relative z-10 inline-flex items-center gap-2 rounded-2xl border border-violet-300/90 px-5 py-3 text-sm font-black !text-white ring-2 ring-violet-200/80 transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_20px_44px_rgba(109,40,217,0.5)] focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-300/80 dark:border-violet-300/30 dark:ring-violet-400/25"
            >
              <Upload className="h-4 w-4 !text-white drop-shadow-sm" />
              <span className="!text-white drop-shadow-sm">Upload</span>
            </button>"""

count = original.count(old_button)

if count != 1:
    raise RuntimeError(
        f"Expected exactly 1 Upload button match, but found {count}. "
        f"No changes were written. Backup saved at {backup_path}"
    )

updated = original.replace(old_button, new_button, 1)

FILE_PATH.write_text(updated)

print("Purple Upload button patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- Main Upload button visual styling")
print("")
print("No backend files were touched.")
print("No upload, folder, search, preview, rename, move, or delete logic was changed.")
