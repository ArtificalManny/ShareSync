from pathlib import Path
from datetime import datetime

FILE_PATH = Path("src/components/insights/WeeklyMomentumReport.jsx")

if not FILE_PATH.exists():
    raise FileNotFoundError(f"Could not find {FILE_PATH}")

original = FILE_PATH.read_text()

backup_path = FILE_PATH.with_suffix(
    FILE_PATH.suffix + f".backup-save-image-button-visibility-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup_path.write_text(original)

updated = original

old_embedded_button = """            <button
              onClick={handleExport} disabled={exporting}
              className="weekly-save-button flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 transition-all shadow-sm hover:shadow-violet-500/20"
            >
              {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {exporting ? 'Exporting...' : 'Save as Image'}
            </button>"""

new_embedded_button = """            <button
              onClick={handleExport}
              disabled={exporting}
              className="weekly-save-button relative isolate flex items-center gap-2 overflow-hidden rounded-xl px-4 py-2.5 text-xs font-black text-white transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-100 hover:-translate-y-0.5"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-xl"
                style={{
                  background: exporting
                    ? 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 52%, #7c3aed 100%)'
                    : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%)',
                  boxShadow: exporting
                    ? 'inset 0 1px 0 rgba(255,255,255,0.22), 0 10px 24px rgba(109,40,217,0.22)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.26), 0 16px 36px rgba(109,40,217,0.38)',
                }}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-xl border border-violet-200/80"
              />
              {exporting ? (
                <Loader2 className="relative z-10 w-3.5 h-3.5 animate-spin text-white drop-shadow-sm" />
              ) : (
                <Download className="relative z-10 w-3.5 h-3.5 text-white drop-shadow-sm" />
              )}
              <span className="relative z-10 text-white drop-shadow-sm">
                {exporting ? 'Exporting...' : 'Save as Image'}
              </span>
            </button>"""

old_modal_button = """          <button
            onClick={handleExport} disabled={exporting}
            className="weekly-save-button flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm disabled:opacity-50 transition-all border border-white/10"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Save as Image
          </button>"""

new_modal_button = """          <button
            onClick={handleExport}
            disabled={exporting}
            className="weekly-save-button relative isolate flex items-center gap-2 overflow-hidden rounded-xl px-4 py-2.5 text-sm font-black text-white backdrop-blur-sm transition-all border border-white/10 disabled:cursor-not-allowed disabled:opacity-100 hover:-translate-y-0.5"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-xl"
              style={{
                background: exporting
                  ? 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 52%, #7c3aed 100%)'
                  : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%)',
                boxShadow: exporting
                  ? 'inset 0 1px 0 rgba(255,255,255,0.22), 0 10px 24px rgba(109,40,217,0.22)'
                  : 'inset 0 1px 0 rgba(255,255,255,0.26), 0 16px 36px rgba(109,40,217,0.38)',
              }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-xl border border-violet-200/80"
            />
            {exporting ? (
              <Loader2 className="relative z-10 w-4 h-4 animate-spin text-white drop-shadow-sm" />
            ) : (
              <Download className="relative z-10 w-4 h-4 text-white drop-shadow-sm" />
            )}
            <span className="relative z-10 text-white drop-shadow-sm">
              Save as Image
            </span>
          </button>"""

replacements = [
    ("embedded Save as Image button", old_embedded_button, new_embedded_button),
    ("modal Save as Image button", old_modal_button, new_modal_button),
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

print("Weekly Save as Image button visibility patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- Embedded Insights Save as Image button visual structure")
print("- Modal Save as Image button visual structure")
print("- Added internal purple paint layers and forced readable white text")
print("")
print("No backend files were touched.")
print("No export logic was changed.")
print("No report data, refresh logic, state logic, or API calls were changed.")
