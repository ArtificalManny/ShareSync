from pathlib import Path
from datetime import datetime

FILE_PATH = Path("src/components/views/VaultView.jsx")

if not FILE_PATH.exists():
    raise FileNotFoundError(f"Could not find {FILE_PATH}")

original = FILE_PATH.read_text()

backup_path = FILE_PATH.with_suffix(
    FILE_PATH.suffix + f".backup-visual-strike-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup_path.write_text(original)

updated = original

css_anchor = """          .vault-upload-button,
          .vault-upload-button span,
          .vault-upload-button svg {
            color: #ffffff !important;
            stroke: #ffffff !important;
          }"""

css_replacement = """          .vault-upload-button,
          .vault-upload-button span,
          .vault-upload-button svg {
            color: #ffffff !important;
            stroke: #ffffff !important;
          }

          .vault-hero-panel {
            background:
              radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.20), transparent 32%),
              radial-gradient(circle at 96% 12%, rgba(34, 211, 238, 0.22), transparent 34%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(241, 245, 249, 0.78)) !important;
            border-color: rgba(124, 58, 237, 0.18) !important;
            box-shadow:
              0 28px 90px rgba(15, 23, 42, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.72) !important;
          }

          .dark .vault-hero-panel {
            background:
              radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.18), transparent 34%),
              radial-gradient(circle at 96% 12%, rgba(34, 211, 238, 0.14), transparent 34%),
              linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.92)) !important;
            border-color: rgba(255, 255, 255, 0.10) !important;
            box-shadow:
              0 34px 110px rgba(0, 0, 0, 0.42),
              inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          }

          .vault-file-section,
          .vault-folder-section {
            position: relative;
            background:
              radial-gradient(circle at 0% 0%, rgba(139, 92, 246, 0.10), transparent 30%),
              radial-gradient(circle at 100% 0%, rgba(34, 211, 238, 0.10), transparent 32%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.86), rgba(248, 250, 252, 0.62)) !important;
            border-color: rgba(148, 163, 184, 0.36) !important;
            box-shadow:
              0 22px 70px rgba(15, 23, 42, 0.10),
              inset 0 1px 0 rgba(255, 255, 255, 0.68) !important;
          }

          .dark .vault-file-section,
          .dark .vault-folder-section {
            background:
              radial-gradient(circle at 0% 0%, rgba(139, 92, 246, 0.12), transparent 30%),
              radial-gradient(circle at 100% 0%, rgba(34, 211, 238, 0.10), transparent 32%),
              linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.72)) !important;
            border-color: rgba(255, 255, 255, 0.09) !important;
            box-shadow:
              0 24px 80px rgba(0, 0, 0, 0.36),
              inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
          }

          .vault-file-card {
            background:
              radial-gradient(circle at 20% 0%, rgba(139, 92, 246, 0.12), transparent 34%),
              linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.90)) !important;
            border-color: rgba(148, 163, 184, 0.42) !important;
            box-shadow:
              0 20px 54px rgba(15, 23, 42, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.72) !important;
          }

          .vault-file-card:hover {
            border-color: rgba(124, 58, 237, 0.42) !important;
            box-shadow:
              0 30px 76px rgba(124, 58, 237, 0.20),
              inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
          }

          .dark .vault-file-card {
            background:
              radial-gradient(circle at 20% 0%, rgba(139, 92, 246, 0.16), transparent 34%),
              linear-gradient(180deg, rgba(30, 41, 59, 0.82), rgba(15, 23, 42, 0.86)) !important;
            border-color: rgba(255, 255, 255, 0.10) !important;
            box-shadow:
              0 22px 64px rgba(0, 0, 0, 0.42),
              inset 0 1px 0 rgba(255, 255, 255, 0.07) !important;
          }

          .vault-preview-frame {
            background:
              linear-gradient(135deg, rgba(15, 23, 42, 0.08), rgba(20, 184, 166, 0.12)) !important;
            border-color: rgba(255, 255, 255, 0.86) !important;
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.60),
              inset 0 -22px 44px rgba(15, 23, 42, 0.10) !important;
          }

          .dark .vault-preview-frame {
            background:
              linear-gradient(135deg, rgba(15, 23, 42, 0.72), rgba(20, 184, 166, 0.14)) !important;
            border-color: rgba(255, 255, 255, 0.16) !important;
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.08),
              inset 0 -22px 44px rgba(0, 0, 0, 0.24) !important;
          }"""

replacements = [
    (
        "scoped vault CSS",
        css_anchor,
        css_replacement,
    ),
    (
        "FileCard outer card",
        '<div className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_28px_70px_rgba(124,58,237,0.16)] dark:border-white/[0.08] dark:bg-white/[0.045] dark:shadow-black/25 dark:hover:border-violet-400/25">',
        '<div className="vault-file-card group relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_28px_70px_rgba(124,58,237,0.16)] dark:border-white/[0.08] dark:bg-white/[0.045] dark:shadow-black/25 dark:hover:border-violet-400/25">',
    ),
    (
        "file preview frame",
        "          relative mb-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-[1.35rem]\n          border border-slate-200/80 shadow-inner",
        "          vault-preview-frame relative mb-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-[1.35rem]\n          border border-slate-200/80 shadow-inner",
    ),
    (
        "folder section shell",
        '<div className="mb-8 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/75 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.035] dark:shadow-black/25">',
        '<div className="vault-folder-section mb-8 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/75 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.035] dark:shadow-black/25">',
    ),
    (
        "hero panel shell",
        '<section className="relative mb-8 overflow-hidden rounded-[2.25rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#111113]/90 dark:shadow-black/30">',
        '<section className="vault-hero-panel relative mb-8 overflow-hidden rounded-[2.25rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#111113]/90 dark:shadow-black/30">',
    ),
    (
        "root file section shell",
        '<div className="mb-8 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/75 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.035] dark:shadow-black/25">',
        '<div className="vault-file-section mb-8 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/75 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.035] dark:shadow-black/25">',
    ),
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

print("Vault visual strike patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- Scoped visual CSS inside VaultView.jsx")
print("- Visual class hooks on hero panel, file sections, folder sections, file cards, and preview frames")
print("")
print("No backend files were touched.")
print("No upload, folder, search, preview, rename, move, or delete logic was changed.")
