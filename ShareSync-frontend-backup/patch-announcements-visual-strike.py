from pathlib import Path
from datetime import datetime

FILE_PATH = Path("src/components/views/AnnouncementsView.jsx")

if not FILE_PATH.exists():
    raise FileNotFoundError(f"Could not find {FILE_PATH}")

original = FILE_PATH.read_text()

backup_path = FILE_PATH.with_suffix(
    FILE_PATH.suffix + f".backup-visual-strike-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup_path.write_text(original)

updated = original

style_block = """  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">"""

new_style_block = """  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <style>
        {`
          .announcements-hero-panel {
            background:
              radial-gradient(circle at 8% 14%, rgba(139, 92, 246, 0.18), transparent 34%),
              radial-gradient(circle at 92% 8%, rgba(34, 211, 238, 0.16), transparent 32%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.82)) !important;
            border-color: rgba(124, 58, 237, 0.20) !important;
            box-shadow:
              0 28px 90px rgba(15, 23, 42, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
          }

          .dark .announcements-hero-panel {
            background:
              radial-gradient(circle at 8% 14%, rgba(139, 92, 246, 0.22), transparent 34%),
              radial-gradient(circle at 92% 8%, rgba(34, 211, 238, 0.13), transparent 32%),
              linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.90)) !important;
            border-color: rgba(255, 255, 255, 0.10) !important;
            box-shadow:
              0 34px 110px rgba(0, 0, 0, 0.42),
              inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          }

          .announcements-primary-button {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 100%) !important;
            box-shadow:
              0 18px 44px rgba(109, 40, 217, 0.34),
              inset 0 1px 0 rgba(255, 255, 255, 0.22) !important;
            border: 1px solid rgba(196, 181, 253, 0.70) !important;
          }

          .announcements-primary-button:hover {
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 48%, #5b21b6 100%) !important;
            box-shadow:
              0 24px 58px rgba(109, 40, 217, 0.46),
              inset 0 1px 0 rgba(255, 255, 255, 0.22) !important;
          }

          .announcement-card {
            background:
              radial-gradient(circle at 5% 0%, rgba(139, 92, 246, 0.10), transparent 32%),
              radial-gradient(circle at 96% 6%, rgba(34, 211, 238, 0.08), transparent 30%),
              linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.92)) !important;
            border-color: rgba(148, 163, 184, 0.34) !important;
            box-shadow:
              0 22px 70px rgba(15, 23, 42, 0.10),
              inset 0 1px 0 rgba(255, 255, 255, 0.72) !important;
          }

          .announcement-card:hover {
            border-color: rgba(124, 58, 237, 0.32) !important;
            box-shadow:
              0 32px 90px rgba(124, 58, 237, 0.18),
              inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
          }

          .dark .announcement-card {
            background:
              radial-gradient(circle at 5% 0%, rgba(139, 92, 246, 0.16), transparent 32%),
              radial-gradient(circle at 96% 6%, rgba(34, 211, 238, 0.10), transparent 30%),
              linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(2, 6, 23, 0.82)) !important;
            border-color: rgba(255, 255, 255, 0.10) !important;
            box-shadow:
              0 28px 90px rgba(0, 0, 0, 0.42),
              inset 0 1px 0 rgba(255, 255, 255, 0.07) !important;
          }

          .announcement-message-panel {
            background:
              linear-gradient(135deg, rgba(255, 255, 255, 0.88), rgba(248, 250, 252, 0.70)) !important;
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.70),
              0 14px 34px rgba(15, 23, 42, 0.06) !important;
          }

          .dark .announcement-message-panel {
            background:
              linear-gradient(135deg, rgba(15, 23, 42, 0.72), rgba(30, 41, 59, 0.54)) !important;
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.07),
              0 18px 44px rgba(0, 0, 0, 0.30) !important;
          }

          .announcement-attachment-card {
            background:
              linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.86)) !important;
            border-color: rgba(148, 163, 184, 0.36) !important;
            box-shadow:
              0 18px 46px rgba(15, 23, 42, 0.10),
              inset 0 1px 0 rgba(255, 255, 255, 0.70) !important;
          }

          .announcement-attachment-card:hover {
            border-color: rgba(124, 58, 237, 0.32) !important;
            box-shadow:
              0 28px 70px rgba(124, 58, 237, 0.18),
              inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
          }

          .announcement-create-modal {
            background:
              radial-gradient(circle at 12% 0%, rgba(139, 92, 246, 0.10), transparent 34%),
              radial-gradient(circle at 92% 0%, rgba(34, 211, 238, 0.08), transparent 32%),
              linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96)) !important;
            border-color: rgba(124, 58, 237, 0.18) !important;
            box-shadow:
              0 34px 110px rgba(15, 23, 42, 0.18),
              inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
          }

          .dark .announcement-create-modal {
            background:
              radial-gradient(circle at 12% 0%, rgba(139, 92, 246, 0.16), transparent 34%),
              radial-gradient(circle at 92% 0%, rgba(34, 211, 238, 0.10), transparent 32%),
              linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.94)) !important;
            border-color: rgba(255, 255, 255, 0.10) !important;
            box-shadow:
              0 38px 120px rgba(0, 0, 0, 0.48),
              inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          }
        `}
      </style>"""

replacements = [
    (
        "return wrapper style injection",
        style_block,
        new_style_block,
    ),
    (
        "hero panel class hook",
        '<div className="relative overflow-hidden rounded-[2rem] border border-violet-100 bg-white shadow-sm">',
        '<div className="announcements-hero-panel relative overflow-hidden rounded-[2rem] border border-violet-100 bg-white shadow-sm">',
    ),
    (
        "hero post update button class hook",
        'className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-xl shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-violet-500/40"',
        'className="announcements-primary-button inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-xl shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-violet-500/40"',
    ),
    (
        "announcement card class hook",
        'className={`group relative mb-6 overflow-hidden rounded-[2rem] border bg-white transition-all duration-300 shadow-sm hover:-translate-y-0.5 hover:shadow-2xl ${',
        'className={`announcement-card group relative mb-6 overflow-hidden rounded-[2rem] border bg-white transition-all duration-300 shadow-sm hover:-translate-y-0.5 hover:shadow-2xl ${',
    ),
    (
        "announcement message panel class hook",
        '<div className={`mt-5 rounded-2xl border ${style.border} ${style.soft} p-5 ring-1 ${style.ring}`}>',
        '<div className={`announcement-message-panel mt-5 rounded-2xl border ${style.border} ${style.soft} p-5 ring-1 ${style.ring}`}>',
    ),
    (
        "attachment gallery card class hook",
        'className="group block rounded-2xl border border-slate-200 bg-white p-1 shadow-sm hover:shadow-xl hover:shadow-violet-500/10 transition-all overflow-hidden"',
        'className="announcement-attachment-card group block rounded-2xl border border-slate-200 bg-white p-1 shadow-sm hover:shadow-xl hover:shadow-violet-500/10 transition-all overflow-hidden"',
    ),
    (
        "create modal class hook",
        '<div className="pc-create-modal pointer-events-auto relative w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(139,92,246,0.16)]">',
        '<div className="announcement-create-modal pc-create-modal pointer-events-auto relative w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(139,92,246,0.16)]">',
    ),
    (
        "modal broadcast button class hook",
        'className="flex items-center gap-2 rounded-2xl bg-violet-600 px-8 py-3 text-sm font-black text-white shadow-xl shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50"',
        'className="announcements-primary-button flex items-center gap-2 rounded-2xl bg-violet-600 px-8 py-3 text-sm font-black text-white shadow-xl shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50"',
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

print("Announcements visual strike patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- Scoped visual CSS inside AnnouncementsView.jsx")
print("- Visual class hooks on hero, cards, message panels, attachments, modal, and purple action buttons")
print("")
print("No backend files were touched.")
print("No announcement logic was changed.")
print("No upload, comment, like, pin, delete, refresh, or create logic was changed.")
