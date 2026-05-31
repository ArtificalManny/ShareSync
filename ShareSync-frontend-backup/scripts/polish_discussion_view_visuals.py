from pathlib import Path
from datetime import datetime

path = Path("src/components/views/ThreadsView.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/views/ThreadsView.jsx")

text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-discussion-visual-polish-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)

func_marker = "export default function ThreadsView("
func_start = text.find(func_marker)

if func_start == -1:
    raise SystemExit("❌ Could not find export default function ThreadsView.")

return_start = text.find("  return (\n", func_start)

if return_start == -1:
    raise SystemExit("❌ Could not find ThreadsView return block.")

end_marker = "\n  );\n}"
return_end = text.rfind(end_marker, func_start)

if return_end == -1 or return_end < return_start:
    raise SystemExit("❌ Could not find end of ThreadsView return block.")

return_end += len(end_marker)

new_return = '''  return (
    <section className="relative mx-auto max-w-[1600px] px-4 py-7 pb-32 sm:px-6 lg:px-10">
      <div className="relative overflow-hidden rounded-[2.25rem] border border-slate-200/80 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#111113]/90 dark:shadow-black/30">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-400/15 blur-3xl dark:bg-violet-500/10" />
        <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-500/10" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:44px_44px] opacity-60 dark:opacity-20" />

        <div className="relative p-5 sm:p-7 lg:p-8">
          {/* Header */}
          <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-3xl border border-violet-200 bg-white text-violet-600 shadow-lg shadow-violet-500/10 dark:border-violet-400/20 dark:bg-white/[0.06] dark:text-violet-300">
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-[#111113]" />
                <MessageCircle className="h-6 w-6" />
              </div>

              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                    Discussion
                  </h2>

                  <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200">
                    Signal Room
                  </span>

                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-500/10 dark:text-cyan-200">
                    Team Threads
                  </span>
                </div>

                <p className="max-w-2xl text-sm font-medium leading-6 text-slate-600 dark:text-zinc-400">
                  Centralize decisions, questions, and project context so the team can move without scattered side conversations.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-zinc-200">
                {threads.length} thread{threads.length === 1 ? '' : 's'}
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-700 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                {projectMembers.length} member{projectMembers.length === 1 ? '' : 's'}
              </div>

              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/35"
              >
                <Plus className="h-4 w-4" />
                <span>New Discussion</span>
              </button>
            </div>
          </div>

          {/* Signal stats */}
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-3xl border border-violet-200 bg-violet-50/80 p-4 shadow-sm dark:border-violet-400/20 dark:bg-violet-500/10">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-600 dark:text-violet-200">
                Threads
              </div>
              <div className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                {threads.length}
              </div>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm dark:border-amber-400/20 dark:bg-amber-500/10">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-700 dark:text-amber-200">
                Pinned
              </div>
              <div className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                {pinnedThreads.length}
              </div>
            </div>

            <div className="rounded-3xl border border-cyan-200 bg-cyan-50/80 p-4 shadow-sm dark:border-cyan-400/20 dark:bg-cyan-500/10">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-200">
                Visible
              </div>
              <div className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                {filtered.length}
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/10">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-200">
                Members
              </div>
              <div className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                {projectMembers.length}
              </div>
            </div>
          </div>

          {/* Main discussion shell */}
          <div className="grid min-h-[620px] overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-black/30 lg:grid-cols-[380px_1fr]">
            {/* Thread rail */}
            <aside
              className={
                'border-r border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#101014]/80 ' +
                (activeThread ? 'hidden lg:flex lg:flex-col' : 'flex flex-col')
              }
            >
              <div className="border-b border-slate-200/80 p-4 dark:border-white/[0.08]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search discussions..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-violet-400/30"
                  />
                </div>

                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                  {CHANNELS.map((channel) => {
                    const active = activeChannel === channel.id;
                    const count =
                      channel.id === 'all'
                        ? threads.length
                        : threads.filter((thread) => thread.category === channel.id).length;

                    return (
                      <button
                        key={channel.id}
                        onClick={() => setActiveChannel(channel.id)}
                        className={
                          'inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-black transition-all ' +
                          (active
                            ? 'border-violet-200 bg-violet-50 text-violet-700 shadow-sm ring-1 ring-violet-200/70 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-400 dark:hover:bg-white/[0.08]')
                        }
                      >
                        <span>{channel.label}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-white/[0.08] dark:text-zinc-400">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                    <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">
                      Loading discussions...
                    </p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 p-8 text-center dark:border-white/[0.08] dark:bg-white/[0.04]">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-black text-slate-800 dark:text-white">
                      No discussions found
                    </p>
                    <p className="mt-1 text-xs font-medium leading-5 text-slate-500 dark:text-zinc-400">
                      Start a new thread or adjust your filter.
                    </p>
                    <button
                      onClick={() => setShowCreate(true)}
                      className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-violet-500/20 transition-all hover:-translate-y-0.5 hover:bg-violet-700"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Start thread
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pinnedThreads.length > 0 && (
                      <div className="flex items-center gap-2 px-2 pt-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">
                        <Pin className="h-3.5 w-3.5" />
                        Pinned discussions
                      </div>
                    )}

                    {pinnedThreads.map((thread) => (
                      <div
                        key={thread._id || thread.id}
                        className="rounded-[1.4rem] bg-gradient-to-br from-amber-400/30 via-violet-400/20 to-cyan-400/20 p-[1px] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        <div className="rounded-[1.35rem] bg-white/95 dark:bg-[#111113]/95">
                          <ThreadListItem
                            thread={thread}
                            active={(activeThread?._id || activeThread?.id) === (thread._id || thread.id)}
                            onClick={setActiveThread}
                          />
                        </div>
                      </div>
                    ))}

                    {pinnedThreads.length > 0 && regularThreads.length > 0 && (
                      <div className="px-2 pt-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
                        Recent threads
                      </div>
                    )}

                    {regularThreads.map((thread) => (
                      <div
                        key={thread._id || thread.id}
                        className="rounded-[1.4rem] border border-slate-200/80 bg-white/80 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:border-violet-400/20"
                      >
                        <ThreadListItem
                          thread={thread}
                          active={(activeThread?._id || activeThread?.id) === (thread._id || thread.id)}
                          onClick={setActiveThread}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>

            {/* Conversation stage */}
            <main className={'min-w-0 flex-1 flex-col bg-gradient-to-br from-white via-slate-50/50 to-cyan-50/40 dark:from-[#0f0f13] dark:via-[#111116] dark:to-cyan-950/10 ' + (!activeThread ? 'hidden lg:flex' : 'flex')}>
              {activeThread ? (
                <div className="flex h-full min-h-[620px] flex-col">
                  <ConversationPanel
                    thread={activeThread}
                    currentUserId={currentUserId}
                    onBack={() => setActiveThread(null)}
                  />
                </div>
              ) : (
                <div className="flex min-h-[620px] flex-1 items-center justify-center p-8">
                  <div className="max-w-md text-center">
                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-violet-200 bg-violet-50 text-violet-600 shadow-lg shadow-violet-500/10 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200">
                      <MessageCircle className="h-9 w-9" />
                    </div>

                    <div className="mb-2 flex justify-center gap-2">
                      <span className="rounded-full border border-violet-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-700 dark:border-violet-400/20 dark:bg-white/[0.06] dark:text-violet-200">
                        Select Thread
                      </span>
                      <span className="rounded-full border border-cyan-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700 dark:border-cyan-400/20 dark:bg-white/[0.06] dark:text-cyan-200">
                        Project Context
                      </span>
                    </div>

                    <h3 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                      Select a discussion
                    </h3>

                    <p className="mt-2 text-sm font-medium leading-6 text-slate-500 dark:text-zinc-400">
                      Choose a project thread from the left, or start a new discussion to capture decisions, blockers, and questions in one place.
                    </p>

                    <button
                      onClick={() => setShowCreate(true)}
                      className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl"
                    >
                      <Plus className="h-4 w-4" />
                      Start New Discussion
                    </button>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {showCreate && (
        <CreateThreadModal
          projectId={projectId}
          members={projectMembers}
          onClose={() => setShowCreate(false)}
          onCreated={(thread) => {
            const createdThread = {
              ...thread,
              id: thread?._id || thread?.id,
              category: thread?.category || 'general',
              participantCount: thread?.participantCount || 0,
              replyCount: thread?.replyCount || 0,
              lastMessage: thread?.lastMessage || 'No discussion yet',
              createdAt: thread?.createdAt || new Date().toISOString(),
            };

            setThreads((previous) => [createdThread, ...previous]);
            setActiveThread(createdThread);
            setShowCreate(false);
          }}
        />
      )}
    </section>
  );
}'''

text = text[:return_start] + new_return + text[return_end:]

path.write_text(text)

print("")
print("✅ Discussion visuals polished.")
print("✅ Preserved ThreadsView state, filtering, active thread, conversation panel, and create modal wiring.")
print("✅ Backup created:", backup)
print("")
print("Inspect:")
print('rg -n "Signal Room|Team Threads|New Discussion|Select a discussion|ThreadsView" src/components/views/ThreadsView.jsx -C 8')
