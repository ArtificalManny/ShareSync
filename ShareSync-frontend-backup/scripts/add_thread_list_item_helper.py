from pathlib import Path
from datetime import datetime

path = Path("src/components/views/ThreadsView.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/views/ThreadsView.jsx")

text = path.read_text()

if "function ThreadListItem(" in text:
    print("✅ ThreadListItem already exists. No change needed.")
    raise SystemExit(0)

backup = path.with_suffix(
    path.suffix + f".bak-before-thread-list-item-helper-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)

marker = "export default function ThreadsView("

idx = text.find(marker)

if idx == -1:
    raise SystemExit("❌ Could not find export default function ThreadsView.")

helper = r'''
function formatThreadListDate(value) {
  if (!value) return "Recent";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Recent";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getThreadTitle(thread) {
  return (
    thread?.title ||
    thread?.name ||
    thread?.subject ||
    thread?.topic ||
    "Untitled discussion"
  );
}

function getThreadPreview(thread) {
  return (
    thread?.lastMessage ||
    thread?.preview ||
    thread?.description ||
    thread?.body ||
    "No discussion yet"
  );
}

function getThreadCategory(thread) {
  return String(thread?.category || thread?.channel || "general");
}

function ThreadListItem({ thread, active = false, onClick }) {
  const title = getThreadTitle(thread);
  const preview = getThreadPreview(thread);
  const category = getThreadCategory(thread);
  const participantCount = Number(thread?.participantCount || thread?.participants?.length || 0);
  const replyCount = Number(thread?.replyCount || thread?.replies?.length || thread?.messages?.length || 0);
  const isPinned = Boolean(thread?.pinned || thread?.isPinned);
  const dateLabel = formatThreadListDate(thread?.updatedAt || thread?.lastActivityAt || thread?.createdAt);

  return (
    <button
      type="button"
      onClick={() => onClick?.(thread)}
      className={`
        group w-full text-left transition-all
        ${active ? "ring-2 ring-violet-400/25" : ""}
      `}
    >
      <div
        className={`
          relative overflow-hidden rounded-[1.35rem] p-4 transition-all
          ${
            active
              ? "bg-violet-50/90 dark:bg-violet-500/10"
              : "bg-white/70 hover:bg-white dark:bg-white/[0.03] dark:hover:bg-white/[0.07]"
          }
        `}
      >
        <div
          className={`
            absolute inset-y-3 left-0 w-1 rounded-r-full
            ${active ? "bg-gradient-to-b from-violet-500 to-cyan-400" : "bg-transparent group-hover:bg-violet-300"}
          `}
        />

        <div className="flex items-start justify-between gap-3 pl-2">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {isPinned ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
                  Pinned
                </span>
              ) : null}

              <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200">
                {category}
              </span>
            </div>

            <div className="truncate text-sm font-black text-slate-950 dark:text-white">
              {title}
            </div>

            <div className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-slate-500 dark:text-zinc-400">
              {preview}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-400 dark:text-zinc-500">
              <span>{participantCount} member{participantCount === 1 ? "" : "s"}</span>
              <span>•</span>
              <span>{replyCount} repl{replyCount === 1 ? "y" : "ies"}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 dark:text-zinc-500">
              {dateLabel}
            </span>

            <span
              className={`
                flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black shadow-sm
                ${
                  active
                    ? "border-violet-200 bg-white text-violet-700 dark:border-violet-400/20 dark:bg-white/[0.08] dark:text-violet-200"
                    : "border-slate-200 bg-slate-50 text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-zinc-400"
                }
              `}
            >
              {String(title).slice(0, 1).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

'''

text = text[:idx] + helper + "\n" + text[idx:]

path.write_text(text)

print("")
print("✅ Added missing ThreadListItem helper.")
print("✅ Discussion page should no longer crash on ThreadListItem.")
print("✅ Backup created:", backup)
print("")
print("Inspect:")
print('rg -n "function ThreadListItem|formatThreadListDate|getThreadTitle|Signal Room|Team Threads" src/components/views/ThreadsView.jsx -C 8')
