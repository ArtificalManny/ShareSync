from pathlib import Path
from datetime import datetime

PANEL_PATH = Path("src/components/suggestions/SuggestionsPanel.jsx")
FORM_PATH = Path("src/components/suggestions/SuggestionForm.jsx")

for path in [PANEL_PATH, FORM_PATH]:
    if not path.exists():
        raise FileNotFoundError(f"Could not find {path}")

def backup(path):
    original = path.read_text()
    backup_path = path.with_suffix(
        path.suffix + f".backup-next-moves-button-modal-fix-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    )
    backup_path.write_text(original)
    return original, backup_path

def replace_once(text, old, new, label, backup_path):
    count = text.count(old)
    if count != 1:
        raise RuntimeError(
            f"Expected exactly 1 match for {label}, but found {count}. "
            f"No changes were written. Backup saved at {backup_path}"
        )
    return text.replace(old, new, 1)

panel, panel_backup = backup(PANEL_PATH)
form, form_backup = backup(FORM_PATH)

# ─────────────────────────────────────────────────────────────────────────────
# 1) SuggestionsPanel.jsx — make top-right Suggest button clearly visible
# ─────────────────────────────────────────────────────────────────────────────

old_suggest_button = """          <button
            onClick={() => setShowForm(true)}
            className="suggestions-primary-button px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-black transition-all flex items-center gap-2 shadow-sm hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Suggest</span>
          </button>"""

new_suggest_button = """          <button
            onClick={() => setShowForm(true)}
            className="suggestions-primary-button relative isolate flex items-center gap-2 overflow-hidden rounded-xl px-5 py-2.5 text-sm font-black text-white shadow-sm transition-all hover:-translate-y-0.5"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.26), 0 16px 36px rgba(109,40,217,0.38)',
              }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-xl border border-violet-200/80"
            />
            <Plus className="relative z-10 w-4 h-4 text-white drop-shadow-sm" />
            <span className="relative z-10 text-white drop-shadow-sm">Suggest</span>
          </button>"""

panel = replace_once(
    panel,
    old_suggest_button,
    new_suggest_button,
    "top-right Suggest button",
    panel_backup,
)

# ─────────────────────────────────────────────────────────────────────────────
# 2) SuggestionForm.jsx — fix modal layout and keep actions visible
# ─────────────────────────────────────────────────────────────────────────────

old_modal_shell = """      <div className="suggestion-form-modal relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-[#1f1f23] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">"""

new_modal_shell = """      <div className="suggestion-form-modal relative flex w-full max-w-lg max-h-[calc(100vh-6rem)] flex-col rounded-2xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-[#1f1f23] shadow-2xl overflow-hidden">"""

form = replace_once(
    form,
    old_modal_shell,
    new_modal_shell,
    "SuggestionForm modal shell layout",
    form_backup,
)

old_header = """        <div className="suggestion-form-header px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between sticky top-0 bg-white dark:bg-[#1f1f23] z-10">"""

new_header = """        <div className="suggestion-form-header shrink-0 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between bg-white dark:bg-[#1f1f23] z-10">"""

form = replace_once(
    form,
    old_header,
    new_header,
    "SuggestionForm header layout",
    form_backup,
)

old_body = """        <div className="p-5 space-y-4">"""

new_body = """        <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-4">"""

form = replace_once(
    form,
    old_body,
    new_body,
    "SuggestionForm scrollable body",
    form_backup,
)

old_actions = """          <div className="flex gap-3 pt-2">"""

new_actions = """          <div className="suggestion-form-actions sticky bottom-0 z-20 -mx-5 -mb-5 mt-2 flex gap-3 border-t border-slate-200/70 bg-white/88 px-5 py-4 backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-950/82">"""

form = replace_once(
    form,
    old_actions,
    new_actions,
    "SuggestionForm sticky action bar",
    form_backup,
)

style_anchor = """          .suggestion-submit-button,
          .suggestion-submit-button span,
          .suggestion-submit-button svg {
            color: #ffffff !important;
            stroke: #ffffff !important;
          }"""

style_replacement = """          .suggestion-form-actions {
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
          }

          .suggestion-submit-button,
          .suggestion-submit-button span,
          .suggestion-submit-button svg {
            color: #ffffff !important;
            stroke: #ffffff !important;
          }"""

form = replace_once(
    form,
    style_anchor,
    style_replacement,
    "SuggestionForm action bar scoped CSS",
    form_backup,
)

PANEL_PATH.write_text(panel)
FORM_PATH.write_text(form)

print("Next Moves button and modal fix applied successfully.")
print("")
print("Updated files:")
print(f"- {PANEL_PATH}")
print(f"- {FORM_PATH}")
print("")
print("Backups:")
print(f"- {panel_backup}")
print(f"- {form_backup}")
print("")
print("Changed only:")
print("- Top-right Suggest button visual structure")
print("- Submit Suggestion modal layout")
print("- Sticky modal action bar")
print("- Scoped visual CSS for modal actions")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No state logic, fetching, filtering, sorting, voting, deleting, uploading, or submitting logic was changed.")
