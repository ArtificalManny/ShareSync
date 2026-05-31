from pathlib import Path
from datetime import datetime

FILE_PATH = Path("src/components/vault/UploadModal.jsx")

if not FILE_PATH.exists():
    raise FileNotFoundError(f"Could not find {FILE_PATH}")

original = FILE_PATH.read_text()

backup_path = FILE_PATH.with_suffix(
    FILE_PATH.suffix + f".backup-inner-purple-layer-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup_path.write_text(original)

old_button = """            <button
              type="button"
              onClick={handleSubmit}
              disabled={isUploading || !file}
              className="
                upload-modal-submit-button
                px-6 py-2.5 rounded-xl
                text-sm font-black text-white
                transition-all
                flex items-center gap-2
              "
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UploadCloud className="w-4 h-4 text-white" />
              )}
              <span className="text-white">
                {isUploading ? 'Uploading...' : 'Upload'}
              </span>
            </button>"""

new_button = """            <button
              type="button"
              onClick={handleSubmit}
              disabled={isUploading || !file}
              className="
                upload-modal-submit-button
                relative isolate overflow-hidden
                px-6 py-2.5 rounded-xl
                text-sm font-black text-white
                transition-all
                flex items-center gap-2
                disabled:cursor-not-allowed disabled:opacity-100
              "
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-xl"
                style={{
                  background: file
                    ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%)'
                    : 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 52%, #7c3aed 100%)',
                  boxShadow: file
                    ? '0 14px 32px rgba(109, 40, 217, 0.34)'
                    : '0 10px 24px rgba(109, 40, 217, 0.22)',
                }}
              />

              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-xl border border-violet-200/90"
              />

              {isUploading ? (
                <div className="relative z-10 w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UploadCloud className="relative z-10 w-4 h-4 text-white" />
              )}

              <span className="relative z-10 text-white drop-shadow-sm">
                {isUploading ? 'Uploading...' : 'Upload'}
              </span>
            </button>"""

count = original.count(old_button)

if count != 1:
    raise RuntimeError(
        f"Expected exactly 1 UploadModal submit button match, but found {count}. "
        f"No changes were written. Backup saved at {backup_path}"
    )

updated = original.replace(old_button, new_button, 1)

FILE_PATH.write_text(updated)

print("UploadModal inner purple layer patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- UploadModal submit button JSX")
print("- Added an internal purple paint layer")
print("")
print("No backend files were touched.")
print("No upload logic was changed.")
print("No disabled logic was changed.")
print("No modal open/close logic was changed.")
