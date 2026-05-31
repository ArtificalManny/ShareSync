from pathlib import Path
from datetime import datetime

FILE_PATH = Path("src/components/views/VaultView.jsx")

if not FILE_PATH.exists():
    raise FileNotFoundError(f"Could not find {FILE_PATH}")

text = FILE_PATH.read_text()

backup_path = FILE_PATH.with_suffix(
    FILE_PATH.suffix + f".backup-vault-contrast-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup_path.write_text(text)

old_image_badge = """        <div className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/85 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600 shadow-sm backdrop-blur-xl dark:border-white/[0.08] dark:bg-black/35 dark:text-zinc-200">
          {fileType}
        </div>"""

new_image_badge = """        <div className="absolute left-3 top-3 rounded-full border border-white/40 bg-slate-950/85 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-[0_8px_22px_rgba(15,23,42,0.35)] ring-1 ring-black/10 backdrop-blur-xl dark:border-white/30 dark:bg-black/80 dark:text-white">
          {fileType}
        </div>"""

old_upload_button = """            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="relative z-10 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 via-fuchsia-500 to-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-rose-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/30"
            >
              <Upload className="h-4 w-4" />
              <span>Upload</span>
            </button>"""

new_upload_button = """            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="relative z-10 inline-flex items-center gap-2 rounded-2xl border border-white/45 bg-gradient-to-r from-violet-700 via-fuchsia-600 to-rose-600 px-5 py-3 text-sm font-black text-white shadow-[0_16px_38px_rgba(124,58,237,0.38)] ring-2 ring-violet-200/70 transition-all hover:-translate-y-0.5 hover:from-violet-800 hover:via-fuchsia-700 hover:to-rose-700 hover:shadow-[0_20px_48px_rgba(124,58,237,0.48)] focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-300/80 dark:border-white/20 dark:ring-violet-400/25"
            >
              <Upload className="h-4 w-4 drop-shadow-sm" />
              <span className="drop-shadow-sm">Upload</span>
            </button>"""

replacements = [
    ("image badge", old_image_badge, new_image_badge),
    ("upload button", old_upload_button, new_upload_button),
]

updated = text

for label, old, new in replacements:
    count = updated.count(old)

    if count != 1:
        raise RuntimeError(
            f"Expected exactly 1 match for {label}, but found {count}. "
            f"No changes were written. Backup remains at {backup_path}"
        )

    updated = updated.replace(old, new, 1)

FILE_PATH.write_text(updated)

print("Vault contrast patch completed successfully.")
print(f"Updated: {FILE_PATH}")
print(f"Backup:  {backup_path}")
print("")
print("Changed only:")
print("1. File type badge contrast on file preview cards.")
print("2. Main Upload button contrast/readability.")
print("")
print("No backend files were touched.")
