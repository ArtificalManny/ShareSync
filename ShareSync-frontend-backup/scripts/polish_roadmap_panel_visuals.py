from pathlib import Path
from datetime import datetime

path = Path("src/components/roadmap/RoadmapPanel.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/roadmap/RoadmapPanel.jsx")

text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".bak-before-roadmap-panel-visual-polish-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)

func_marker = "export default function RoadmapPanel("
func_start = text.find(func_marker)
if func_start == -1:
    raise SystemExit("❌ Could not find export default function RoadmapPanel.")

return_start = text.find("  return (\n", func_start)
if return_start == -1:
    raise SystemExit("❌ Could not find RoadmapPanel return block.")

end_marker = "\n  );\n}"
return_end = text.rfind(end_marker)
if return_end == -1 or return_end < return_start:
    raise SystemExit("❌ Could not find the end of RoadmapPanel return block.")

return_end += len(end_marker)

new_return = '''  return (
    <section className={`px-4 py-8 sm:px-6 lg:px-10 max-w-[1600px] mx-auto ${className}`}>
      <div className="relative overflow-hidden rounded-[2.25rem] border border-slate-200/80 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#111113]/90 dark:shadow-black/30">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-400/15 blur-3xl dark:bg-violet-500/10" />
        <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-500/10" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:44px_44px] opacity-60 dark:opacity-20" />

        <div className="relative p-5 sm:p-7 lg:p-8">
          {/* Header */}
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-3xl border border-violet-200 bg-white text-violet-600 shadow-lg shadow-violet-500/10 dark:border-violet-400/20 dark:bg-white/[0.06] dark:text-violet-300">
                  <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-[#111113]" />
                  <MapIcon className="h-6 w-6" />
                </div>

                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                      Roadmap
                    </h2>

                    <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200">
                      Milestone Map
                    </span>

                    <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-500/10 dark:text-cyan-200">
                      Live Timeline
                    </span>
                  </div>

                  <p className="max-w-2xl text-sm font-medium leading-6 text-slate-600 dark:text-zinc-400">
                    Track milestones, deadlines, and delivery progress as tasks move across the project.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <button
                onClick={fetchData}
                className="
                  inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5
                  text-sm font-bold text-slate-700 shadow-sm transition-all
                  hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md
                  dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-zinc-200 dark:hover:bg-white/[0.10]
                "
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => onAddMilestone?.()}
                className="
                  inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 via-fuchsia-500 to-violet-600
                  px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-fuchsia-500/25 transition-all
                  hover:-translate-y-0.5 hover:shadow-xl hover:shadow-fuchsia-500/35
                "
              >
                <Plus className="h-4 w-4" />
                <span>Add Milestone</span>
              </button>
            </div>
          </div>

          {/* Signal stats */}
          <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-5">
            {STATUS_OPTIONS.map((opt) => {
              const n = counts[opt.id] ?? (opt.id === "all" ? counts.all : 0);
              const active = status === opt.id;

              const tone =
                opt.id === "completed"
                  ? "border-emerald-200 bg-emerald-50/80 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200"
                  : opt.id === "overdue"
                    ? "border-rose-200 bg-rose-50/80 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200"
                    : opt.id === "in-progress"
                      ? "border-violet-200 bg-violet-50/80 text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200"
                      : opt.id === "planned"
                        ? "border-cyan-200 bg-cyan-50/80 text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-500/10 dark:text-cyan-200"
                        : "border-slate-200 bg-white/80 text-slate-700 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-zinc-200";

              return (
                <button
                  key={opt.id}
                  onClick={() => setStatus(opt.id)}
                  className={`
                    group relative overflow-hidden rounded-3xl border p-4 text-left shadow-sm transition-all
                    hover:-translate-y-0.5 hover:shadow-lg
                    ${tone}
                    ${active ? "ring-2 ring-violet-400/30 dark:ring-violet-300/20" : ""}
                  `}
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] opacity-70">
                    {opt.label}
                  </div>
                  <div className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                    {n}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Filter + Sort bar */}
          <div className="mt-7 flex flex-col gap-4 rounded-[1.75rem] border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.04] lg:flex-row lg:items-center">
            <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-zinc-300">
                <Filter className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.22em]">Filter</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const active = status === opt.id;
                const n = counts[opt.id] ?? (opt.id === "all" ? counts.all : 0);

                return (
                  <button
                    key={opt.id}
                    onClick={() => setStatus(opt.id)}
                    className={`
                      inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-black transition-all
                      ${
                        active
                          ? "border-violet-200 bg-violet-50 text-violet-700 shadow-sm ring-1 ring-violet-200/70 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-400/10"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.08]"
                      }
                    `}
                  >
                    <span>{opt.label}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-white/[0.08] dark:text-zinc-400">
                      {n}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="lg:ml-auto flex items-center gap-2">
              <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                <ArrowUpDown className="h-4 w-4" />
                <span className="text-[11px] font-black uppercase tracking-[0.22em]">Sort</span>
              </div>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="
                  rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700
                  shadow-sm outline-none transition-all
                  focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10
                  dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-zinc-200 dark:focus:border-violet-400/30
                "
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Content */}
          <div className="mt-7">
            {loading && (
              <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-12 text-center shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl border border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
                <p className="text-sm font-bold text-slate-600 dark:text-zinc-300">
                  Loading milestone map...
                </p>
              </div>
            )}

            {!loading && error && (
              <div className="rounded-[2rem] border border-rose-200 bg-rose-50/80 p-8 shadow-sm dark:border-rose-400/20 dark:bg-rose-500/10">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm dark:bg-white/[0.08]">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-black text-rose-700 dark:text-rose-200">
                      Couldn't load milestones
                    </div>
                    <div className="text-sm text-slate-600 dark:text-zinc-300">
                      {error}
                    </div>
                  </div>
                </div>

                <button
                  onClick={fetchData}
                  className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-black text-rose-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-rose-400/20 dark:bg-white/[0.06] dark:text-rose-200"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && (items?.length || 0) === 0 && (
              <div className="relative overflow-hidden rounded-[2rem] border border-dashed border-violet-200 bg-white/80 p-12 text-center shadow-sm dark:border-violet-400/20 dark:bg-white/[0.04]">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-cyan-50 dark:from-violet-500/10 dark:via-transparent dark:to-cyan-500/10" />

                <div className="relative">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-violet-200 bg-white text-violet-600 shadow-lg shadow-violet-500/10 dark:border-violet-400/20 dark:bg-white/[0.06] dark:text-violet-200">
                    <MapIcon className="h-7 w-7" />
                  </div>

                  <h3 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
                    No milestones yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-600 dark:text-zinc-400">
                    Create a milestone for your next release, demo, deadline, or major project checkpoint.
                  </p>

                  <button
                    onClick={() => onAddMilestone?.()}
                    className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    <Plus className="h-4 w-4" />
                    Create first milestone
                  </button>
                </div>
              </div>
            )}

            {!loading && !error && (itemsWithProgress?.length || 0) > 0 && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {itemsWithProgress.map((m) => {
                  const mid = getMilestoneId(m);
                  const isSelected = normalizeId(selectedMilestoneId) === normalizeId(mid);

                  return (
                    <div
                      key={mid}
                      className="group rounded-[1.75rem] bg-gradient-to-br from-violet-500/20 via-cyan-400/15 to-emerald-400/20 p-[1px] transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/10 dark:hover:shadow-black/40"
                    >
                      <div className="rounded-[1.7rem] bg-white/95 dark:bg-[#111113]/95">
                        <MilestoneCard
                          milestone={m}
                          onClick={handleCardClick}
                          showActions={true}
                          isSelected={isSelected}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onStatusChange={handleStatusChange}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {editingMilestone ? (
        <EditMilestoneModal
          milestone={editingMilestone}
          onClose={() => { setEditingMilestone(null); setSaveError(""); }}
          onSave={handleEditSave}
          saving={saving}
          error={saveError}
        />
      ) : null}

      {deletingMilestone ? (
        <DeleteConfirmModal
          milestone={deletingMilestone}
          onClose={() => { setDeletingMilestone(null); setDeleteError(""); }}
          onConfirm={handleConfirmDelete}
          deleting={deleting}
          error={deleteError}
        />
      ) : null}
    </section>
  );
}'''

text = text[:return_start] + new_return + text[return_end:]

path.write_text(text)

print("")
print("✅ RoadmapPanel visual polish complete.")
print("✅ Preserved existing fetch/filter/sort/progress/edit/delete/status logic.")
print("✅ Backup created:", backup)
print("")
print("Inspect:")
print('rg -n "Milestone Map|Live Timeline|Signal stats|Create first milestone|RoadmapPanel" src/components/roadmap/RoadmapPanel.jsx -C 8')
