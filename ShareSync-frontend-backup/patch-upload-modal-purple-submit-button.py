from pathlib import Path
from datetime import datetime

FILE_PATH = Path("src/components/vault/UploadModal.jsx")

if not FILE_PATH.exists():
    raise FileNotFoundError(f"Could not find {FILE_PATH}")

original = FILE_PATH.read_text()

backup_path = FILE_PATH.with_suffix(
    FILE_PATH.suffix + f".backup-purple-submit-button-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup_path.write_text(original)

old_return_start = """  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 dark:bg-black/65 backdrop-blur-md p-4 animate-in fade-in duration-200">"""

new_return_start = """  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 dark:bg-black/65 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <style>
        {`
          .upload-modal-submit-button {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
            color: #ffffff !important;
            border: 1px solid rgba(124, 58, 237, 0.92) !important;
            box-shadow: 0 14px 32px rgba(109, 40, 217, 0.34) !important;
            opacity: 1 !important;
          }

          .upload-modal-submit-button:hover:not(:disabled) {
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 48%, #5b21b6 100%) !important;
            box-shadow: 0 18px 40px rgba(109, 40, 217, 0.46) !important;
            transform: translateY(-1px);
          }

          .upload-modal-submit-button:disabled {
            background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 52%, #7c3aed 100%) !important;
            color: #ffffff !important;
            opacity: 0.88 !important;
            cursor: not-allowed !important;
            box-shadow: 0 10px 24px rgba(109, 40, 217, 0.22) !important;
          }

          .upload-modal-submit-button,
          .upload-modal-submit-button span,
          .upload-modal-submit-button svg {
            color: #ffffff !important;
            stroke: #ffffff !important;
          }
        `}
      </style>"""

old_button = """            <button
              type="button"
              onClick={handleSubmit}
              disabled={isUploading || !file}
              className="
                px-6 py-2.5 rounded-xl
                text-sm font-semibold text-white
                bg-gradient-to-r from-violet-600 to-indigo-600
                hover:from-violet-500 hover:to-indigo-500
                shadow-lg shadow-violet-900/20
                transition-all
                disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none
                flex items-center gap-2
              "
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UploadCloud className="w-4 h-4" />
              )}
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>"""

new_button = """            <button
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

updated = original

replacements = [
    ("modal return wrapper", old_return_start, new_return_start),
    ("modal upload submit button", old_button, new_button),
]

for label, old, new in replacements:
    count = updated.count(old)

    if count != 1:
        raise RuntimeError(
            f"Expected exactly 1 match for {label}, but found {count}. "
            f"No changes were written. Backup saved at {backup_path}"
        )

    updated = updated.replace(old, new, 1)

FILE_PATH.write_text(updated)

print("Upload modal purple submit button patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- UploadModal submit button visibility")
print("- Added scoped CSS for the modal Upload button only")
print("")
print("No backend files were touched.")
print("No upload logic was changed.")
print("No disabled logic was changed.")
print("No modal open/close logic was changed.")
