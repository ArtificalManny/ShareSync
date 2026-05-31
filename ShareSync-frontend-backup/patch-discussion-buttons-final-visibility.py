from pathlib import Path
from datetime import datetime

FILE_PATH = Path("src/components/views/ThreadsView.jsx")

if not FILE_PATH.exists():
    raise FileNotFoundError(f"Could not find {FILE_PATH}")

original = FILE_PATH.read_text()
timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup_path = FILE_PATH.with_suffix(
    FILE_PATH.suffix + f".backup-discussion-buttons-final-visibility-{timestamp}"
)
backup_path.write_text(original)

updated = original

# 1) Make every New Discussion button class stronger.
updated = updated.replace(
    'className="discussion-primary-button inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/35"',
    'className="discussion-primary-button inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-black text-white shadow-lg transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed"'
)

updated = updated.replace(
    'className="discussion-primary-button mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl"',
    'className="discussion-primary-button mt-6 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white shadow-lg transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed"'
)

# 2) Make the Create Discussion modal button stronger.
updated = updated.replace(
    'className="discussion-modal-create-button flex-1 py-2.5 rounded-xl text-sm font-black bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40 shadow-sm"',
    'className="discussion-modal-create-button flex-1 py-2.5 rounded-xl text-sm font-black text-white shadow-sm disabled:cursor-not-allowed"'
)

# 3) Add one safe scoped style block inside the component, right before the main return content if possible.
style_block = """
      <style>{`
        .discussion-primary-button,
        .discussion-modal-create-button {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
          color: #ffffff !important;
          opacity: 1 !important;
          border: 1px solid rgba(196, 181, 253, 0.95) !important;
          box-shadow:
            0 16px 36px rgba(124, 58, 237, 0.42),
            inset 0 1px 0 rgba(255, 255, 255, 0.35) !important;
          text-shadow: 0 1px 2px rgba(15, 23, 42, 0.35) !important;
          filter: none !important;
          mix-blend-mode: normal !important;
          backdrop-filter: none !important;
        }

        .discussion-primary-button:hover:not(:disabled),
        .discussion-modal-create-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 48%, #5b21b6 100%) !important;
          box-shadow:
            0 20px 44px rgba(124, 58, 237, 0.52),
            inset 0 1px 0 rgba(255, 255, 255, 0.4) !important;
        }

        .discussion-primary-button:disabled,
        .discussion-modal-create-button:disabled {
          background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 52%, #7c3aed 100%) !important;
          color: #ffffff !important;
          opacity: 0.92 !important;
          border: 1px solid rgba(221, 214, 254, 0.95) !important;
          box-shadow:
            0 12px 28px rgba(124, 58, 237, 0.32),
            inset 0 1px 0 rgba(255, 255, 255, 0.36) !important;
        }

        .discussion-primary-button *,
        .discussion-modal-create-button *,
        .discussion-primary-button span,
        .discussion-modal-create-button span,
        .discussion-primary-button svg,
        .discussion-modal-create-button svg {
          color: #ffffff !important;
          opacity: 1 !important;
          stroke: currentColor !important;
          fill: none;
          filter: none !important;
          mix-blend-mode: normal !important;
        }
      `}</style>
"""

if "discussion-buttons-final-visibility" not in updated:
    # Add a harmless marker comment inside the style block so it won't duplicate later.
    style_block = style_block.replace("<style>{`", "<style>{`\\n        /* discussion-buttons-final-visibility */")
    
    # Insert after the first fragment opening if available.
    if "return (\n    <>" in updated:
        updated = updated.replace("return (\n    <>", "return (\n    <>" + style_block, 1)
    elif "return (\n      <>" in updated:
        updated = updated.replace("return (\n      <>", "return (\n      <>" + style_block, 1)
    else:
        raise RuntimeError("Could not find React fragment return anchor. No changes were written.")

# Safety checks focused only on actual JSX corruption.
bad_patterns = [
    "onClick={() =",
    "className={`\n",
]

for bad in bad_patterns:
    if bad in updated:
        FILE_PATH.write_text(original)
        raise RuntimeError(f"Unsafe JSX corruption pattern detected: {bad}. Original restored.")

FILE_PATH.write_text(updated)

print("Discussion final button visibility patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- New Discussion button visibility")
print("- Create Discussion button visibility")
print("- Disabled-state readability for both buttons")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No thread fetching, filtering, messaging, modal state, or create-discussion logic was changed.")
