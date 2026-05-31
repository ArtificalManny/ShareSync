from pathlib import Path
from datetime import datetime

FILE_PATH = Path("src/components/views/VaultView.jsx")

if not FILE_PATH.exists():
    raise FileNotFoundError(f"Could not find {FILE_PATH}")

original = FILE_PATH.read_text()

backup_path = FILE_PATH.with_suffix(
    FILE_PATH.suffix + f".backup-force-purple-upload-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup_path.write_text(original)

old_block = """          <div className="relative flex flex-col group">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 52%, #5b21b6 100%)',
                boxShadow: '0 16px 36px rgba(109, 40, 217, 0.42)',
              }}
              className="relative z-10 inline-flex items-center gap-2 rounded-2xl border border-violet-300/90 px-5 py-3 text-sm font-black !text-white ring-2 ring-violet-200/80 transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_20px_44px_rgba(109,40,217,0.5)] focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-300/80 dark:border-violet-300/30 dark:ring-violet-400/25"
            >
              <Upload className="h-4 w-4 !text-white drop-shadow-sm" />
              <span className="!text-white drop-shadow-sm">Upload</span>
            </button>

            <div
              className="absolute -bottom-1.5 left-2 right-2 h-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"
              title={`${formatBytes(data.storage.usedBytes)} / ${formatBytes(data.storage.limitBytes)} used`}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  usagePercentage > 90
                    ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                    : usagePercentage > 75
                      ? 'bg-amber-400'
                      : 'bg-white/70'
                }`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
          </div>"""

new_block = """          <div className="relative flex flex-col group">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="relative z-10 inline-flex items-center gap-2 rounded-2xl border border-purple-500 !bg-purple-700 px-5 py-3 text-sm font-black !text-white shadow-[0_16px_36px_rgba(126,34,206,0.42)] ring-2 ring-purple-200/80 transition-all hover:-translate-y-0.5 hover:!bg-purple-800 hover:shadow-[0_20px_44px_rgba(126,34,206,0.52)] focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-300/80 dark:border-purple-300/30 dark:!bg-purple-600 dark:hover:!bg-purple-500"
            >
              <Upload className="h-4 w-4 !text-white drop-shadow-sm" />
              <span className="!text-white drop-shadow-sm">Upload</span>
            </button>
          </div>"""

count = original.count(old_block)

if count != 1:
    raise RuntimeError(
        f"Expected exactly 1 Upload control block match, but found {count}. "
        f"No changes were written. Backup saved at {backup_path}"
    )

updated = original.replace(old_block, new_block, 1)

FILE_PATH.write_text(updated)

print("Forced purple Upload button patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- Main Upload button styling")
print("- Removed tiny storage underline under Upload button")
print("")
print("No backend files were touched.")
print("No upload, folder, search, preview, rename, move, or delete logic was changed.")
