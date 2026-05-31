from pathlib import Path
from datetime import datetime

FILE_PATH = Path("src/components/suggestions/SuggestionForm.jsx")

if not FILE_PATH.exists():
    raise FileNotFoundError(f"Could not find {FILE_PATH}")

original = FILE_PATH.read_text()

backup_path = FILE_PATH.with_suffix(
    FILE_PATH.suffix + f".backup-action-dock-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup_path.write_text(original)

updated = original

def replace_one_of(text, candidates, new, label):
    matches = [(old, text.count(old)) for old in candidates]
    valid = [(old, count) for old, count in matches if count == 1]

    if len(valid) != 1:
        details = ", ".join([f"{count} matches" for _, count in matches])
        raise RuntimeError(
            f"Expected exactly one usable match for {label}, but got: {details}. "
            f"No changes were written. Backup saved at {backup_path}"
        )

    old, _ = valid[0]
    return text.replace(old, new, 1)

# 1) Give the modal a little more breathing room.
updated = replace_one_of(
    updated,
    [
        """      <div className="suggestion-form-modal relative flex w-full max-w-lg max-h-[calc(100vh-6rem)] flex-col rounded-2xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-[#1f1f23] shadow-2xl overflow-hidden">""",
        """      <div className="suggestion-form-modal relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-[#1f1f23] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">""",
    ],
    """      <div className="suggestion-form-modal relative flex w-full max-w-xl max-h-[calc(100vh-7rem)] flex-col rounded-2xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-[#1f1f23] shadow-2xl overflow-hidden">""",
    "modal shell",
)

# 2) Keep the scroll area, but make it less cramped.
updated = replace_one_of(
    updated,
    [
        """        <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-4">""",
        """        <div className="p-5 space-y-4">""",
    ],
    """        <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-5">""",
    "modal body spacing",
)

# 3) Replace the sticky bottom bar with a normal polished action dock.
updated = replace_one_of(
    updated,
    [
        """          <div className="suggestion-form-actions sticky bottom-0 z-20 -mx-5 -mb-5 mt-2 flex gap-3 border-t border-slate-200/70 bg-white/88 px-5 py-4 backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-950/82">""",
        """          <div className="flex gap-3 pt-2">""",
    ],
    """          <div className="suggestion-form-actions mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200/70 bg-white/88 p-3 backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-950/72 sm:grid-cols-[0.72fr_1fr]">""",
    "action dock wrapper",
)

# 4) Make Cancel match the new dock shape.
updated = replace_one_of(
    updated,
    [
        """              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/[0.10] transition-colors\"""",
    ],
    """              className="min-h-[48px] rounded-xl px-5 text-sm font-bold bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/[0.10] transition-colors\"""",
    "Cancel button class",
)

# 5) Make Submit Suggestion wider/taller and prevent text compression.
updated = replace_one_of(
    updated,
    [
        """              className="suggestion-submit-button relative isolate flex-1 overflow-hidden py-2.5 rounded-xl text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-100 transition-all flex items-center justify-center gap-2 shadow-sm hover:-translate-y-0.5\"""",
        """              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40 transition-colors flex items-center justify-center gap-2 shadow-sm\"""",
    ],
    """              className="suggestion-submit-button relative isolate min-h-[48px] overflow-hidden rounded-xl px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-100 transition-all flex items-center justify-center gap-2 shadow-sm hover:-translate-y-0.5 whitespace-nowrap\"""",
    "Submit Suggestion button class",
)

# 6) Refine action dock CSS if the previous style block exists.
old_css = """          .suggestion-form-actions {
            box-shadow:
              0 -18px 40px rgba(15, 23, 42, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.72);
          }

          .dark .suggestion-form-actions {
            box-shadow:
              0 -18px 44px rgba(0, 0, 0, 0.34),
              inset 0 1px 0 rgba(255, 255, 255, 0.06);
          }

          .suggestion-submit-button {
            min-height: 44px;
          }"""

new_css = """          .suggestion-form-actions {
            box-shadow:
              0 18px 42px rgba(15, 23, 42, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.72);
          }

          .dark .suggestion-form-actions {
            box-shadow:
              0 18px 46px rgba(0, 0, 0, 0.30),
              inset 0 1px 0 rgba(255, 255, 255, 0.06);
          }

          .suggestion-submit-button {
            min-height: 48px;
          }"""

if old_css in updated:
    updated = updated.replace(old_css, new_css, 1)

FILE_PATH.write_text(updated)

print("Suggestion form action dock patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- Submit Suggestion modal width/spacing")
print("- Submit Suggestion action dock layout")
print("- Cancel and Submit button sizing")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No suggestion state, upload, attachment, validation, or submit logic was changed.")
