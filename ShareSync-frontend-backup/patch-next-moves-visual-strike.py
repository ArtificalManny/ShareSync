from pathlib import Path
from datetime import datetime

FILES = {
    "panel": Path("src/components/suggestions/SuggestionsPanel.jsx"),
    "card": Path("src/components/suggestions/SuggestionCard.jsx"),
    "form": Path("src/components/suggestions/SuggestionForm.jsx"),
}

for label, path in FILES.items():
    if not path.exists():
        raise FileNotFoundError(f"Could not find {label}: {path}")

def backup(path):
    original = path.read_text()
    backup_path = path.with_suffix(
        path.suffix + f".backup-next-moves-visual-strike-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
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

panel_path = FILES["panel"]
card_path = FILES["card"]
form_path = FILES["form"]

panel_original, panel_backup = backup(panel_path)
card_original, card_backup = backup(card_path)
form_original, form_backup = backup(form_path)

panel = panel_original
card = card_original
form = form_original

# Safety check: make sure we are patching the real API-backed panel, not the older mock panel.
if "getSuggestions" not in panel or "createSuggestion" not in panel or "upvoteSuggestion" not in panel:
    raise RuntimeError(
        f"{panel_path} does not look like the real API-backed SuggestionsPanel. "
        f"No changes were written. Backup saved at {panel_backup}"
    )

# ─────────────────────────────────────────────────────────────────────────────
# 1) SuggestionsPanel.jsx — main Next Moves / Suggestions shell
# ─────────────────────────────────────────────────────────────────────────────

panel = replace_once(
    panel,
    """  return (
    <div className="bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">""",
    """  return (
    <div className="suggestions-next-panel bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
      <style>
        {`
          .suggestions-next-panel {
            position: relative;
            overflow: hidden;
            background:
              radial-gradient(circle at 7% 0%, rgba(139, 92, 246, 0.16), transparent 32%),
              radial-gradient(circle at 96% 8%, rgba(34, 211, 238, 0.12), transparent 34%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.97), rgba(248, 250, 252, 0.82)) !important;
            border-color: rgba(124, 58, 237, 0.18) !important;
            box-shadow:
              0 28px 90px rgba(15, 23, 42, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
            backdrop-filter: blur(18px);
          }

          .dark .suggestions-next-panel {
            background:
              radial-gradient(circle at 7% 0%, rgba(139, 92, 246, 0.20), transparent 32%),
              radial-gradient(circle at 96% 8%, rgba(34, 211, 238, 0.10), transparent 34%),
              linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.88)) !important;
            border-color: rgba(255, 255, 255, 0.10) !important;
            box-shadow:
              0 34px 110px rgba(0, 0, 0, 0.42),
              inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          }

          .suggestions-next-panel::before {
            content: "";
            position: absolute;
            inset: 0 0 auto 0;
            height: 4px;
            background: linear-gradient(90deg, #8b5cf6, #22d3ee, #10b981);
            opacity: 0.92;
          }

          .suggestions-next-header {
            position: relative;
            border-radius: 1.5rem;
            padding: 0.35rem 0.25rem;
          }

          .suggestions-primary-button {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
            color: #ffffff !important;
            border: 1px solid rgba(196, 181, 253, 0.76) !important;
            box-shadow:
              0 16px 36px rgba(109, 40, 217, 0.36),
              inset 0 1px 0 rgba(255, 255, 255, 0.24) !important;
          }

          .suggestions-primary-button:hover {
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 48%, #5b21b6 100%) !important;
            box-shadow:
              0 22px 52px rgba(109, 40, 217, 0.48),
              inset 0 1px 0 rgba(255, 255, 255, 0.24) !important;
          }

          .suggestions-primary-button,
          .suggestions-primary-button span,
          .suggestions-primary-button svg {
            color: #ffffff !important;
            stroke: #ffffff !important;
          }

          .suggestions-filter-rail {
            background: rgba(255, 255, 255, 0.70) !important;
            border-color: rgba(148, 163, 184, 0.28) !important;
            box-shadow:
              0 14px 36px rgba(15, 23, 42, 0.07),
              inset 0 1px 0 rgba(255, 255, 255, 0.70) !important;
          }

          .dark .suggestions-filter-rail {
            background: rgba(15, 23, 42, 0.60) !important;
            border-color: rgba(255, 255, 255, 0.08) !important;
            box-shadow:
              0 16px 42px rgba(0, 0, 0, 0.28),
              inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
          }

          .suggestion-next-card {
            position: relative;
            background:
              radial-gradient(circle at 0% 0%, rgba(139, 92, 246, 0.08), transparent 30%),
              radial-gradient(circle at 100% 0%, rgba(34, 211, 238, 0.07), transparent 30%),
              linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.88)) !important;
            border-color: rgba(148, 163, 184, 0.34) !important;
            box-shadow:
              0 18px 52px rgba(15, 23, 42, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.70) !important;
          }

          .suggestion-next-card:hover {
            transform: translateY(-2px);
            border-color: rgba(124, 58, 237, 0.34) !important;
            box-shadow:
              0 28px 74px rgba(124, 58, 237, 0.16),
              inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
          }

          .dark .suggestion-next-card {
            background:
              radial-gradient(circle at 0% 0%, rgba(139, 92, 246, 0.14), transparent 30%),
              radial-gradient(circle at 100% 0%, rgba(34, 211, 238, 0.09), transparent 30%),
              linear-gradient(180deg, rgba(15, 23, 42, 0.84), rgba(2, 6, 23, 0.76)) !important;
            border-color: rgba(255, 255, 255, 0.09) !important;
            box-shadow:
              0 24px 74px rgba(0, 0, 0, 0.36),
              inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
          }

          .suggestion-next-card::before {
            content: "";
            position: absolute;
            inset: 0 0 auto 0;
            height: 3px;
            background: linear-gradient(90deg, #8b5cf6, #22d3ee, #10b981);
            opacity: 0;
            transition: opacity 180ms ease;
          }

          .suggestion-next-card:hover::before {
            opacity: 0.90;
          }

          .suggestion-action-bar {
            background: rgba(248, 250, 252, 0.54);
          }

          .dark .suggestion-action-bar {
            background: rgba(2, 6, 23, 0.26);
          }

          .suggestions-list-shell {
            position: relative;
          }

          .suggestions-empty-state {
            background:
              radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.12), transparent 38%),
              linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(248, 250, 252, 0.62)) !important;
            border-color: rgba(148, 163, 184, 0.34) !important;
            box-shadow:
              0 18px 52px rgba(15, 23, 42, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.70) !important;
          }

          .dark .suggestions-empty-state {
            background:
              radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.16), transparent 38%),
              linear-gradient(180deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.70)) !important;
            border-color: rgba(255, 255, 255, 0.08) !important;
          }
        `}
      </style>""",
    "SuggestionsPanel root + scoped style injection",
    panel_backup,
)

panel = replace_once(
    panel,
    """      <div className="flex items-center justify-between mb-6">""",
    """      <div className="suggestions-next-header flex items-center justify-between mb-6">""",
    "SuggestionsPanel header class hook",
    panel_backup,
)

panel = replace_once(
    panel,
    """            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Suggest""",
    """            className="suggestions-primary-button px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-black transition-all flex items-center gap-2 shadow-sm hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Suggest</span>""",
    "SuggestionsPanel Suggest button",
    panel_backup,
)

panel = replace_once(
    panel,
    """        <div className="flex gap-1 bg-slate-50 dark:bg-white/[0.04] p-1 rounded-xl border border-slate-200 dark:border-white/[0.06]">""",
    """        <div className="suggestions-filter-rail flex gap-1 bg-slate-50 dark:bg-white/[0.04] p-1 rounded-xl border border-slate-200 dark:border-white/[0.06]">""",
    "SuggestionsPanel filter rail",
    panel_backup,
)

panel = replace_once(
    panel,
    """      <div className="space-y-4 min-h-[200px]">""",
    """      <div className="suggestions-list-shell space-y-4 min-h-[200px]">""",
    "SuggestionsPanel list shell",
    panel_backup,
)

panel = replace_once(
    panel,
    """          <div className="text-center py-12 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-dashed border-slate-200 dark:border-white/[0.06]">""",
    """          <div className="suggestions-empty-state text-center py-12 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-dashed border-slate-200 dark:border-white/[0.06]">""",
    "SuggestionsPanel empty state",
    panel_backup,
)

# ─────────────────────────────────────────────────────────────────────────────
# 2) SuggestionCard.jsx — individual suggestion cards
# ─────────────────────────────────────────────────────────────────────────────

card = replace_once(
    card,
    '''"group rounded-xl overflow-hidden bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:border-slate-300 dark:hover:border-white/[0.1] transition-all duration-200"''',
    '''"suggestion-next-card group rounded-xl overflow-hidden bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:border-slate-300 dark:hover:border-white/[0.1] transition-all duration-200"''',
    "SuggestionCard outer card class hook",
    card_backup,
)

card = replace_once(
    card,
    """      <div className="px-4 py-3 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between">""",
    """      <div className="suggestion-action-bar px-4 py-3 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between">""",
    "SuggestionCard action bar",
    card_backup,
)

# ─────────────────────────────────────────────────────────────────────────────
# 3) SuggestionForm.jsx — Submit Suggestion modal + submit button visibility
# ─────────────────────────────────────────────────────────────────────────────

form = replace_once(
    form,
    """  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">""",
    """  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <style>
        {`
          .suggestion-form-modal {
            background:
              radial-gradient(circle at 12% 0%, rgba(139, 92, 246, 0.12), transparent 34%),
              radial-gradient(circle at 92% 0%, rgba(34, 211, 238, 0.08), transparent 32%),
              linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96)) !important;
            border-color: rgba(124, 58, 237, 0.18) !important;
            box-shadow:
              0 34px 110px rgba(15, 23, 42, 0.18),
              inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
          }

          .dark .suggestion-form-modal {
            background:
              radial-gradient(circle at 12% 0%, rgba(139, 92, 246, 0.16), transparent 34%),
              radial-gradient(circle at 92% 0%, rgba(34, 211, 238, 0.10), transparent 32%),
              linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.94)) !important;
            border-color: rgba(255, 255, 255, 0.10) !important;
            box-shadow:
              0 38px 120px rgba(0, 0, 0, 0.48),
              inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          }

          .suggestion-form-header {
            background: rgba(255, 255, 255, 0.80) !important;
            backdrop-filter: blur(18px);
          }

          .dark .suggestion-form-header {
            background: rgba(15, 23, 42, 0.78) !important;
          }

          .suggestion-submit-button,
          .suggestion-submit-button span,
          .suggestion-submit-button svg {
            color: #ffffff !important;
            stroke: #ffffff !important;
          }
        `}
      </style>""",
    "SuggestionForm root scoped style injection",
    form_backup,
)

form = replace_once(
    form,
    """      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-[#1f1f23] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">""",
    """      <div className="suggestion-form-modal relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-[#1f1f23] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">""",
    "SuggestionForm modal shell",
    form_backup,
)

form = replace_once(
    form,
    """        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between sticky top-0 bg-white dark:bg-[#1f1f23] z-10">""",
    """        <div className="suggestion-form-header px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between sticky top-0 bg-white dark:bg-[#1f1f23] z-10">""",
    "SuggestionForm header",
    form_backup,
)

form = replace_once(
    form,
    """            <button
              onClick={handleSubmit}
              disabled={
                !suggestion.title.trim() ||
                !suggestion.content.trim() ||
                submitting ||
                anyUploading
              }
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {submitting ? (
                'Submitting...'
              ) : anyUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Submit Suggestion
                </>
              )}
            </button>""",
    """            <button
              onClick={handleSubmit}
              disabled={
                !suggestion.title.trim() ||
                !suggestion.content.trim() ||
                submitting ||
                anyUploading
              }
              className="suggestion-submit-button relative isolate flex-1 overflow-hidden py-2.5 rounded-xl text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-100 transition-all flex items-center justify-center gap-2 shadow-sm hover:-translate-y-0.5"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-xl"
                style={{
                  background:
                    suggestion.title.trim() && suggestion.content.trim() && !submitting && !anyUploading
                      ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%)'
                      : 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 52%, #7c3aed 100%)',
                  boxShadow:
                    suggestion.title.trim() && suggestion.content.trim() && !submitting && !anyUploading
                      ? 'inset 0 1px 0 rgba(255,255,255,0.26), 0 16px 36px rgba(109,40,217,0.34)'
                      : 'inset 0 1px 0 rgba(255,255,255,0.22), 0 10px 24px rgba(109,40,217,0.20)',
                }}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-xl border border-violet-200/80"
              />

              {submitting ? (
                <span className="relative z-10 text-white drop-shadow-sm">Submitting...</span>
              ) : anyUploading ? (
                <>
                  <Loader2 className="relative z-10 w-3.5 h-3.5 animate-spin text-white" />
                  <span className="relative z-10 text-white drop-shadow-sm">Uploading...</span>
                </>
              ) : (
                <>
                  <Send className="relative z-10 w-3.5 h-3.5 text-white drop-shadow-sm" />
                  <span className="relative z-10 text-white drop-shadow-sm">Submit Suggestion</span>
                </>
              )}
            </button>""",
    "SuggestionForm submit button",
    form_backup,
)

# Write only after every replacement succeeds.
panel_path.write_text(panel)
card_path.write_text(card)
form_path.write_text(form)

print("Next Moves visual strike patch applied successfully.")
print("")
print("Updated files:")
print(f"- {panel_path}")
print(f"- {card_path}")
print(f"- {form_path}")
print("")
print("Backups:")
print(f"- {panel_backup}")
print(f"- {card_backup}")
print(f"- {form_backup}")
print("")
print("Changed only:")
print("- Scoped visual CSS and visual class hooks for the Next Moves / Suggestions panel")
print("- Suggestion card visual depth and hover polish")
print("- Submit Suggestion modal visual shell")
print("- Submit Suggestion button visibility using the internal purple layer method")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No state logic, suggestion fetching, filtering, sorting, voting, deleting, converting, uploading, or submitting logic was changed.")
