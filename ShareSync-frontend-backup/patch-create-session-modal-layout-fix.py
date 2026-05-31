from pathlib import Path
from datetime import datetime

FILE_PATH = Path("src/calendar/CreateSessionModal.jsx")

if not FILE_PATH.exists():
    raise FileNotFoundError(f"Could not find {FILE_PATH}. Run this from the frontend project root.")

original = FILE_PATH.read_text()

timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup_path = FILE_PATH.with_suffix(FILE_PATH.suffix + f".backup-session-modal-layout-{timestamp}")
backup_path.write_text(original)

updated = original

# 1) Lower the modal slightly so the top header does not feel clipped.
old_overlay = 'className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 px-4 pt-10 pb-6 backdrop-blur-md sm:px-5 sm:pt-12 sm:pb-8"'
new_overlay = 'className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 px-4 pt-14 pb-6 backdrop-blur-md sm:px-5 sm:pt-16 sm:pb-8"'

if old_overlay not in updated:
    raise RuntimeError("Could not find the expected outer modal overlay class. No changes were written.")

updated = updated.replace(old_overlay, new_overlay, 1)

# 2) Slightly reduce modal max height to account for the lower top offset.
old_shell = 'className="relative flex h-auto max-h-[calc(100dvh-7rem)] w-full max-w-md flex-col overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/92 shadow-[0_22px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 dark:border-white/[0.08] dark:bg-[#101827]/95 dark:shadow-black/40"'
new_shell = 'className="relative flex h-auto max-h-[calc(100dvh-8rem)] w-full max-w-md flex-col overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/92 shadow-[0_22px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 dark:border-white/[0.08] dark:bg-[#101827]/95 dark:shadow-black/40"'

if old_shell not in updated:
    raise RuntimeError("Could not find the expected modal shell class. No changes were written.")

updated = updated.replace(old_shell, new_shell, 1)

# 3) Give the form an ID so the footer submit button can live outside the scrollable body.
old_form_open = '<form onSubmit={handleSubmit} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4 overscroll-contain">'
new_form_open = '<form id="create-session-form" onSubmit={handleSubmit} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4 pb-6 overscroll-contain">'

if old_form_open not in updated:
    raise RuntimeError("Could not find the expected form opening tag. No changes were written.")

updated = updated.replace(old_form_open, new_form_open, 1)

# 4) Move footer actions OUTSIDE the scrollable form.
# This fixes the hovering/overlapping footer problem.
old_footer_block = '''            {/* Footer Actions */}
            <div className="sticky bottom-0 -mx-5 flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200/70 bg-white/95 px-5 pt-3 pb-2 backdrop-blur-md dark:border-white/[0.06] dark:bg-[#101827]/95 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-5 py-3 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900 dark:text-white/45 dark:hover:text-white"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-violet-300 bg-violet-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-violet-500/35 focus:outline-none focus:ring-4 focus:ring-violet-200 dark:border-violet-400/30 dark:focus:ring-violet-500/20"
              >
                <Zap className="h-4 w-4" />
                Add Session
              </button>
            </div>
          </form>'''

new_footer_block = '''          </form>

          {/* Footer Actions */}
          <div className="relative z-10 shrink-0 border-t border-slate-200/70 bg-white/95 px-5 py-3 backdrop-blur-md dark:border-white/[0.06] dark:bg-[#101827]/95">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-5 py-3 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-white/45 dark:hover:bg-white/[0.06] dark:hover:text-white"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="create-session-form"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-violet-300 bg-violet-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-violet-500/35 focus:outline-none focus:ring-4 focus:ring-violet-200 dark:border-violet-400/30 dark:focus:ring-violet-500/20"
              >
                <Zap className="h-4 w-4" />
                Add Session
              </button>
            </div>
          </div>'''

if old_footer_block not in updated:
    raise RuntimeError("Could not find the expected sticky footer block. No changes were written.")

updated = updated.replace(old_footer_block, new_footer_block, 1)

# Safety checks
bad_patterns = [
    "onClick={() =",
    "className==",
    "form==",
    "<form id=\"create-session-form\" id=",
]

for bad in bad_patterns:
    if bad in updated:
        raise RuntimeError(f"Unsafe JSX corruption pattern detected: {bad}. No changes were written.")

if updated.count('id="create-session-form"') != 1:
    raise RuntimeError("Expected exactly one create-session-form id. No changes were written.")

if updated.count('form="create-session-form"') != 1:
    raise RuntimeError("Expected exactly one submit button linked to create-session-form. No changes were written.")

if "sticky bottom-0 -mx-5" in updated:
    raise RuntimeError("Old sticky footer class still exists. No changes were written.")

FILE_PATH.write_text(updated)

print("CreateSessionModal layout patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- Lowered the modal slightly from the top")
print("- Reduced max modal height to fit the viewport better")
print("- Moved the Cancel/Add Session footer outside the scrollable form")
print("- Connected the Add Session button back to the form using form='create-session-form'")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No session creation logic was changed.")
print("No modal open/close logic was changed.")
