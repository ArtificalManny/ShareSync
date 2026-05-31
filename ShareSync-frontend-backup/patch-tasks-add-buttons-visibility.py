from pathlib import Path
from datetime import datetime
import re

FILE_PATH = Path("src/features/stack/StackPanel.jsx")

if not FILE_PATH.exists():
    raise FileNotFoundError(f"Could not find {FILE_PATH}")

original = FILE_PATH.read_text()

backup_path = FILE_PATH.with_suffix(
    FILE_PATH.suffix + f".backup-add-buttons-visibility-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup_path.write_text(original)

updated = original

if "handleOpenAddForm" not in updated or "handleAddTask" not in updated:
    raise RuntimeError(
        f"This does not look like the expected StackPanel.jsx file. "
        f"No changes were written. Backup saved at {backup_path}"
    )

# ─────────────────────────────────────────────────────────────────────────────
# 1) Main top-right Add Task button
# ─────────────────────────────────────────────────────────────────────────────

main_button_pattern = re.compile(
    r'''              <button
                type="button"
                onClick=\{handleOpenAddForm\}
                className="[^"]*"
              >
                <Plus className="h-4 w-4" />
                Add Task
              </button>''',
    re.MULTILINE,
)

main_button_new = '''              <button
                type="button"
                onClick={handleOpenAddForm}
                className="stack-primary-button relative isolate inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl px-5 py-3 text-xs font-black text-white shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-2xl"
                  style={{
                    background:
                      'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%)',
                    boxShadow:
                      'inset 0 1px 0 rgba(255,255,255,0.28), 0 16px 36px rgba(109,40,217,0.38)',
                  }}
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-2xl border border-violet-200/80"
                />
                <Plus className="relative z-10 h-4 w-4 text-white drop-shadow-sm" />
                <span className="relative z-10 text-white drop-shadow-sm">
                  Add Task
                </span>
              </button>'''

updated, main_count = main_button_pattern.subn(main_button_new, updated, count=1)

if main_count != 1:
    raise RuntimeError(
        f"Expected exactly 1 main Add Task button, but replaced {main_count}. "
        f"No changes were written. Backup saved at {backup_path}"
    )

# ─────────────────────────────────────────────────────────────────────────────
# 2) Composer Add Task button inside Create execution task
# ─────────────────────────────────────────────────────────────────────────────

composer_button_pattern = re.compile(
    r'''              <button
                type="button"
                onClick=\{handleAddTask\}
                disabled=\{addingTask \|\| !newTitle\.trim\(\)\}
                className="[^"]*"
              >
                \{addingTask \? \(
                  <RefreshCw className="h-4 w-4 animate-spin" />
                \) : \(
                  <Plus className="h-4 w-4" />
                \)\}
                \{addingTask \? "Adding…" : "Add Task"\}
              </button>''',
    re.MULTILINE,
)

composer_button_new = '''              <button
                type="button"
                onClick={handleAddTask}
                disabled={addingTask || !newTitle.trim()}
                className="stack-composer-add-button relative isolate inline-flex min-h-[48px] items-center justify-center gap-2 overflow-hidden rounded-2xl px-6 py-3 text-xs font-black text-white shadow-lg transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:translate-y-0"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-2xl"
                  style={{
                    background:
                      addingTask || !newTitle.trim()
                        ? 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 52%, #7c3aed 100%)'
                        : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%)',
                    boxShadow:
                      addingTask || !newTitle.trim()
                        ? 'inset 0 1px 0 rgba(255,255,255,0.24), 0 10px 24px rgba(109,40,217,0.20)'
                        : 'inset 0 1px 0 rgba(255,255,255,0.28), 0 16px 36px rgba(109,40,217,0.38)',
                    opacity: addingTask || !newTitle.trim() ? 0.76 : 1,
                  }}
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-2xl border border-violet-200/80"
                />

                {addingTask ? (
                  <RefreshCw className="relative z-10 h-4 w-4 animate-spin text-white drop-shadow-sm" />
                ) : (
                  <Plus className="relative z-10 h-4 w-4 text-white drop-shadow-sm" />
                )}

                <span className="relative z-10 whitespace-nowrap text-white drop-shadow-sm">
                  {addingTask ? "Adding…" : "Add Task"}
                </span>
              </button>'''

updated, composer_count = composer_button_pattern.subn(composer_button_new, updated, count=1)

if composer_count != 1:
    raise RuntimeError(
        f"Expected exactly 1 composer Add Task button, but replaced {composer_count}. "
        f"No changes were written. Backup saved at {backup_path}"
    )

FILE_PATH.write_text(updated)

print("Tasks Add Task button visibility patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- Top-right Add Task button visual structure")
print("- Create execution task Add Task button visual structure")
print("- Added internal purple paint layers, white text, stronger shadow, and clearer disabled visibility")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No task fetching, task creation, task movement, task completion, or realtime logic was changed.")
