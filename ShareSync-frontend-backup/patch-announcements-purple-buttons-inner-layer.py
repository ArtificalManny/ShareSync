from pathlib import Path
from datetime import datetime

FILE_PATH = Path("src/components/views/AnnouncementsView.jsx")

if not FILE_PATH.exists():
    raise FileNotFoundError(f"Could not find {FILE_PATH}")

original = FILE_PATH.read_text()

backup_path = FILE_PATH.with_suffix(
    FILE_PATH.suffix + f".backup-purple-buttons-inner-layer-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup_path.write_text(original)

updated = original

old_post_button = """            <button
              onClick={() => setShowCreate(true)}
              className="announcements-primary-button inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-xl shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-violet-500/40"
            >
              <Plus className="h-5 w-5" />
              Post Update
            </button>"""

new_post_button = """            <button
              onClick={() => setShowCreate(true)}
              className="announcements-primary-button relative isolate inline-flex items-center gap-2 overflow-hidden rounded-2xl px-5 py-3 text-sm font-black text-white shadow-xl shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-violet-500/40"
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
                className="pointer-events-none absolute inset-0 rounded-2xl border border-violet-200/80"
              />
              <Plus className="relative z-10 h-5 w-5 text-white drop-shadow-sm" />
              <span className="relative z-10 text-white drop-shadow-sm">
                Post Update
              </span>
            </button>"""

old_broadcast_button = """              <button
                onClick={handleCreate}
                disabled={!title.trim() || !message.trim() || posting || anyUploading}
                className="announcements-primary-button flex items-center gap-2 rounded-2xl bg-violet-600 px-8 py-3 text-sm font-black text-white shadow-xl shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {posting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Transmitting...
                  </>
                ) : anyUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Broadcast Update
                  </>
                )}
              </button>"""

new_broadcast_button = """              <button
                onClick={handleCreate}
                disabled={!title.trim() || !message.trim() || posting || anyUploading}
                className="announcements-primary-button relative isolate flex items-center gap-2 overflow-hidden rounded-2xl px-8 py-3 text-sm font-black text-white shadow-xl shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-100"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-2xl"
                  style={{
                    background:
                      title.trim() && message.trim() && !posting && !anyUploading
                        ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%)'
                        : 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 52%, #7c3aed 100%)',
                    boxShadow:
                      title.trim() && message.trim() && !posting && !anyUploading
                        ? 'inset 0 1px 0 rgba(255, 255, 255, 0.26), 0 16px 36px rgba(109, 40, 217, 0.34)'
                        : 'inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 10px 24px rgba(109, 40, 217, 0.20)',
                  }}
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-2xl border border-violet-200/80"
                />

                {posting ? (
                  <>
                    <Loader2 className="relative z-10 h-4 w-4 animate-spin text-white" />
                    <span className="relative z-10 text-white drop-shadow-sm">
                      Transmitting...
                    </span>
                  </>
                ) : anyUploading ? (
                  <>
                    <Loader2 className="relative z-10 h-4 w-4 animate-spin text-white" />
                    <span className="relative z-10 text-white drop-shadow-sm">
                      Uploading...
                    </span>
                  </>
                ) : (
                  <>
                    <Send className="relative z-10 h-4 w-4 text-white drop-shadow-sm" />
                    <span className="relative z-10 text-white drop-shadow-sm">
                      Broadcast Update
                    </span>
                  </>
                )}
              </button>"""

replacements = [
    ("hero Post Update button", old_post_button, new_post_button),
    ("modal Broadcast Update button", old_broadcast_button, new_broadcast_button),
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

print("Announcements purple button inner-layer patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- Post Update button visual structure")
print("- Broadcast Update button visual structure")
print("- Added internal purple paint layers so text stays readable")
print("")
print("No backend files were touched.")
print("No announcement logic was changed.")
print("No create, upload, comment, like, pin, delete, refresh, or modal logic was changed.")
