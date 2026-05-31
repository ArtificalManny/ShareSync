from pathlib import Path
from datetime import datetime

FILE_PATH = Path("src/components/views/ThreadsView.jsx")

original = FILE_PATH.read_text()
updated = original

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup_path = FILE_PATH.with_name(
    FILE_PATH.name + f".backup-discussion-visual-strike-{stamp}"
)
backup_path.write_text(original)

missing = []

def replace_once(old, new, label):
    global updated
    if old not in updated:
        missing.append(label)
        return
    updated = updated.replace(old, new, 1)

style_block = r'''      <style className="discussion-visual-strike-style">{`
        .discussion-visual-scope {
          --discussion-purple: #7c3aed;
          --discussion-violet: #8b5cf6;
          --discussion-cyan: #22d3ee;
          --discussion-emerald: #34d399;
        }

        .discussion-holo-shell {
          isolation: isolate;
          border-color: rgba(139, 92, 246, 0.28) !important;
          background:
            radial-gradient(circle at 8% 0%, rgba(139, 92, 246, 0.18), transparent 32%),
            radial-gradient(circle at 84% 10%, rgba(34, 211, 238, 0.18), transparent 34%),
            linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,250,252,0.86)) !important;
          box-shadow:
            0 30px 90px rgba(15, 23, 42, 0.12),
            inset 0 1px 0 rgba(255,255,255,0.95) !important;
        }

        .dark .discussion-holo-shell {
          border-color: rgba(139, 92, 246, 0.24) !important;
          background:
            radial-gradient(circle at 10% 0%, rgba(139, 92, 246, 0.16), transparent 34%),
            radial-gradient(circle at 88% 10%, rgba(34, 211, 238, 0.14), transparent 36%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.94)) !important;
          box-shadow:
            0 32px 100px rgba(0,0,0,0.42),
            inset 0 1px 0 rgba(255,255,255,0.08) !important;
        }

        .discussion-command-orb {
          background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(245,243,255,0.92)) !important;
          box-shadow:
            0 16px 34px rgba(124, 58, 237, 0.18),
            0 0 0 8px rgba(139, 92, 246, 0.08) !important;
        }

        .dark .discussion-command-orb {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.22), rgba(34, 211, 238, 0.08)) !important;
          box-shadow:
            0 18px 40px rgba(0, 0, 0, 0.34),
            0 0 0 8px rgba(139, 92, 246, 0.12) !important;
        }

        .discussion-primary-button,
        .discussion-modal-create-button {
          opacity: 1 !important;
          color: #fff !important;
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #06b6d4 100%) !important;
          border: 1px solid rgba(255,255,255,0.42) !important;
          box-shadow:
            0 16px 34px rgba(124, 58, 237, 0.34),
            inset 0 1px 0 rgba(255,255,255,0.34) !important;
        }

        .discussion-primary-button:hover:not(:disabled),
        .discussion-modal-create-button:hover:not(:disabled) {
          transform: translateY(-2px) !important;
          filter: brightness(1.05) saturate(1.08) !important;
          box-shadow:
            0 20px 42px rgba(124, 58, 237, 0.44),
            0 0 0 5px rgba(139, 92, 246, 0.12),
            inset 0 1px 0 rgba(255,255,255,0.38) !important;
        }

        .discussion-primary-button *,
        .discussion-modal-create-button * {
          color: #fff !important;
          opacity: 1 !important;
        }

        .discussion-modal-create-button:disabled {
          opacity: 0.72 !important;
          cursor: not-allowed !important;
          background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 52%, #7c3aed 100%) !important;
        }

        .discussion-stat-card {
          position: relative;
          overflow: hidden;
          min-height: 112px;
          background:
            radial-gradient(circle at 18% 0%, rgba(255,255,255,0.92), transparent 34%),
            linear-gradient(135deg, rgba(255,255,255,0.92), rgba(248,250,252,0.62)) !important;
          box-shadow:
            0 16px 40px rgba(15, 23, 42, 0.08),
            inset 0 1px 0 rgba(255,255,255,0.94) !important;
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
        }

        .discussion-stat-card:hover {
          transform: translateY(-2px);
          box-shadow:
            0 22px 54px rgba(15, 23, 42, 0.12),
            0 0 0 5px rgba(139, 92, 246, 0.06),
            inset 0 1px 0 rgba(255,255,255,0.98) !important;
        }

        .dark .discussion-stat-card {
          background:
            radial-gradient(circle at 18% 0%, rgba(255,255,255,0.10), transparent 36%),
            linear-gradient(135deg, rgba(255,255,255,0.075), rgba(255,255,255,0.025)) !important;
          box-shadow:
            0 18px 50px rgba(0,0,0,0.28),
            inset 0 1px 0 rgba(255,255,255,0.08) !important;
        }

        .discussion-thread-stage {
          border-color: rgba(148, 163, 184, 0.38) !important;
          box-shadow:
            0 24px 70px rgba(15, 23, 42, 0.12),
            inset 0 1px 0 rgba(255,255,255,0.86) !important;
        }

        .discussion-thread-rail {
          background:
            linear-gradient(180deg, rgba(15,23,42,0.94), rgba(30,41,59,0.90)) !important;
          box-shadow: inset -1px 0 0 rgba(255,255,255,0.12) !important;
        }

        .discussion-thread-rail input {
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18) !important;
        }

        .discussion-thread-list-card {
          border-color: rgba(148, 163, 184, 0.28) !important;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.09) !important;
        }

        .discussion-thread-list-card:hover {
          box-shadow:
            0 18px 44px rgba(124, 58, 237, 0.16),
            0 0 0 4px rgba(139, 92, 246, 0.07) !important;
        }

        .discussion-conversation-canvas {
          background:
            radial-gradient(circle at 50% 28%, rgba(139, 92, 246, 0.12), transparent 26%),
            radial-gradient(circle at 88% 18%, rgba(34, 211, 238, 0.14), transparent 30%),
            linear-gradient(135deg, rgba(255,255,255,0.98), rgba(241,245,249,0.70)) !important;
        }

        .dark .discussion-conversation-canvas {
          background:
            radial-gradient(circle at 50% 28%, rgba(139, 92, 246, 0.12), transparent 28%),
            radial-gradient(circle at 88% 18%, rgba(34, 211, 238, 0.10), transparent 32%),
            linear-gradient(135deg, rgba(15,23,42,0.98), rgba(2,6,23,0.96)) !important;
        }

        .discussion-empty-orb {
          background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(245,243,255,0.94)) !important;
          box-shadow:
            0 18px 42px rgba(124, 58, 237, 0.18),
            0 0 0 10px rgba(139, 92, 246, 0.08) !important;
        }

        .dark .discussion-empty-orb {
          background: linear-gradient(135deg, rgba(139,92,246,0.20), rgba(34,211,238,0.08)) !important;
        }

        .discussion-create-modal-card {
          border-color: rgba(139, 92, 246, 0.28) !important;
          background:
            radial-gradient(circle at 12% 0%, rgba(139, 92, 246, 0.14), transparent 32%),
            radial-gradient(circle at 88% 0%, rgba(34, 211, 238, 0.12), transparent 34%),
            rgba(255,255,255,0.98) !important;
          box-shadow: 0 30px 90px rgba(15, 23, 42, 0.24) !important;
        }

        .dark .discussion-create-modal-card {
          background:
            radial-gradient(circle at 12% 0%, rgba(139, 92, 246, 0.18), transparent 34%),
            radial-gradient(circle at 88% 0%, rgba(34, 211, 238, 0.10), transparent 36%),
            rgba(17,17,19,0.98) !important;
          box-shadow: 0 34px 100px rgba(0,0,0,0.48) !important;
        }
      `}</style>
'''

replace_once(
    '<section className="relative mx-auto max-w-[1600px] px-4 py-7 pb-32 sm:px-6 lg:px-10">',
    '<section className="discussion-visual-scope relative mx-auto max-w-[1600px] px-4 py-7 pb-32 sm:px-6 lg:px-10">\n' + style_block,
    "section scope + style block",
)

replace_once(
    '<div className="relative overflow-hidden rounded-[2.25rem] border border-slate-200/80 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#111113]/90 dark:shadow-black/30">',
    '<div className="discussion-holo-shell relative overflow-hidden rounded-[2.25rem] border border-slate-200/80 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#111113]/90 dark:shadow-black/30">',
    "outer shell",
)

replace_once(
    '<div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-3xl border border-violet-200 bg-white text-violet-600 shadow-lg shadow-violet-500/10 dark:border-violet-400/20 dark:bg-white/[0.06] dark:text-violet-300">',
    '<div className="discussion-command-orb relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-3xl border border-violet-200 bg-white text-violet-600 shadow-lg shadow-violet-500/10 dark:border-violet-400/20 dark:bg-white/[0.06] dark:text-violet-300">',
    "header orb",
)

replace_once(
    'className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/35"',
    'className="discussion-primary-button inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/35"',
    "top New Discussion button",
)

for color in ["violet", "amber", "cyan", "emerald"]:
    replace_once(
        f'<div className="rounded-3xl border border-{color}-200 bg-{color}-50/80 p-4 shadow-sm dark:border-{color}-400/20 dark:bg-{color}-500/10">',
        f'<div className="discussion-stat-card rounded-3xl border border-{color}-200 bg-{color}-50/80 p-4 shadow-sm dark:border-{color}-400/20 dark:bg-{color}-500/10">',
        f"{color} stat card",
    )

replace_once(
    '<div className="grid min-h-[620px] overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-black/30 lg:grid-cols-[380px_1fr]">',
    '<div className="discussion-thread-stage grid min-h-[620px] overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-black/30 lg:grid-cols-[380px_1fr]">',
    "main discussion stage",
)

replace_once(
    "'border-r border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#101014]/80 '",
    "'discussion-thread-rail border-r border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#101014]/80 '",
    "thread rail",
)

replace_once(
    'className="rounded-[1.4rem] bg-gradient-to-br from-amber-400/30 via-violet-400/20 to-cyan-400/20 p-[1px] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"',
    'className="discussion-thread-list-card rounded-[1.4rem] bg-gradient-to-br from-amber-400/30 via-violet-400/20 to-cyan-400/20 p-[1px] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"',
    "pinned thread card",
)

replace_once(
    'className="rounded-[1.4rem] border border-slate-200/80 bg-white/80 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:border-violet-400/20"',
    'className="discussion-thread-list-card rounded-[1.4rem] border border-slate-200/80 bg-white/80 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:border-violet-400/20"',
    "regular thread card",
)

replace_once(
    "<main className={'min-w-0 flex-1 flex-col bg-gradient-to-br from-white via-slate-50/50 to-cyan-50/40 dark:from-[#0f0f13] dark:via-[#111116] dark:to-cyan-950/10 ' + (!activeThread ? 'hidden lg:flex' : 'flex')}>",
    "<main className={'discussion-conversation-canvas min-w-0 flex-1 flex-col bg-gradient-to-br from-white via-slate-50/50 to-cyan-50/40 dark:from-[#0f0f13] dark:via-[#111116] dark:to-cyan-950/10 ' + (!activeThread ? 'hidden lg:flex' : 'flex')}>",
    "conversation canvas",
)

replace_once(
    '<div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-violet-200 bg-violet-50 text-violet-600 shadow-lg shadow-violet-500/10 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200">',
    '<div className="discussion-empty-orb mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-violet-200 bg-violet-50 text-violet-600 shadow-lg shadow-violet-500/10 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200">',
    "empty state orb",
)

replace_once(
    'className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl"',
    'className="discussion-primary-button mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl"',
    "empty Start New Discussion button",
)

replace_once(
    '<div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-[#1f1f23] shadow-2xl overflow-hidden">',
    '<div className="discussion-create-modal-card relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-[#1f1f23] shadow-2xl overflow-hidden">',
    "create modal card",
)

replace_once(
    'className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40 shadow-sm"',
    'className="discussion-modal-create-button flex-1 py-2.5 rounded-xl text-sm font-black bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40 shadow-sm"',
    "modal create button",
)

if missing:
    raise RuntimeError(
        "Could not find expected snippet(s). No changes were written:\\n- "
        + "\\n- ".join(missing)
        + "\\n\\nThis usually means ThreadsView.jsx has already been edited. Paste the current file again and patch it manually."
    )

for bad in ["onClick={() = className=", "onClick={()= className=", "className=="]:
    if bad in updated:
        raise RuntimeError(f"Unsafe JSX corruption pattern detected: {bad}. No changes were written.")

FILE_PATH.write_text(updated)

print("Discussions visual strike patch applied successfully.")
print(f"Updated file: {FILE_PATH}")
print(f"Backup file:  {backup_path}")
print("")
print("Changed only:")
print("- Scoped visual CSS inside ThreadsView.jsx")
print("- Visual class hooks on Discussion shell, header orb, stat cards, thread rail, thread cards, conversation stage, empty state, and modal button")
print("")
print("No backend files were touched.")
print("No API calls were changed.")
print("No thread fetching, filtering, messaging, modal state, or create-discussion logic was changed.")
