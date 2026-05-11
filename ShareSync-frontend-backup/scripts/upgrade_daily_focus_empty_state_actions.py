from pathlib import Path

path = Path("src/components/focus/YourMovesToday.jsx")
text = path.read_text()

old_import = "import { Target, Zap, RefreshCw, ChevronRight, Flame, AlertCircle } from 'lucide-react';"
new_import = "import { Target, Zap, RefreshCw, ChevronRight, Flame, AlertCircle, FolderPlus, LayoutDashboard } from 'lucide-react';"

if old_import not in text:
    raise SystemExit("Could not find lucide-react import line.")

text = text.replace(old_import, new_import, 1)

old_empty = """function EmptyState({ onRefresh }) {
  return (
    <div className="py-10 text-center bg-teal-50/50 dark:bg-teal-500/5 rounded-xl border border-teal-100 dark:border-teal-500/10">
      <div className="w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-500/20 mx-auto mb-4 flex items-center justify-center shadow-sm">
        <Flame className="w-8 h-8 text-teal-600 dark:text-teal-400" />
      </div>
      <h4 className="text-lg font-black text-slate-900 dark:text-zinc-100 mb-1">
        All caught up! 🎉
      </h4>
      <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-5">
        No critical moves right now. Create a project or add a task to start building momentum.
      </p>
      <button
        onClick={onRefresh}
        className="text-xs font-black uppercase tracking-widest bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-lg text-slate-600 dark:text-zinc-300 hover:text-[var(--theme-accent-primary)] hover:border-[var(--theme-accent-primary)] transition-all shadow-sm"
      >
        Check again
      </button>
    </div>
  );
}"""

new_empty = """function EmptyState({ onRefresh }) {
  const goToProjects = () => {
    window.location.href = '/projects';
  };

  return (
    <div className="py-10 px-5 text-center bg-teal-50/50 dark:bg-teal-500/5 rounded-xl border border-teal-100 dark:border-teal-500/10">
      <div className="w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-500/20 mx-auto mb-4 flex items-center justify-center shadow-sm">
        <Flame className="w-8 h-8 text-teal-600 dark:text-teal-400" />
      </div>

      <h4 className="text-lg font-black text-slate-900 dark:text-zinc-100 mb-1">
        All caught up! 🎉
      </h4>

      <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-6 max-w-xl mx-auto">
        No critical moves right now. Create a project or add tasks inside one of your projects to start building momentum.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={goToProjects}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--theme-accent-primary)] px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-sm hover:brightness-110 transition-all"
        >
          <FolderPlus className="w-4 h-4" />
          Create Project
        </button>

        <button
          onClick={goToProjects}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-zinc-300 hover:text-[var(--theme-accent-primary)] hover:border-[var(--theme-accent-primary)] transition-all shadow-sm"
        >
          <LayoutDashboard className="w-4 h-4" />
          View Projects
        </button>

        <button
          onClick={onRefresh}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-zinc-300 hover:text-[var(--theme-accent-primary)] hover:border-[var(--theme-accent-primary)] transition-all shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Check Again
        </button>
      </div>
    </div>
  );
}"""

if old_empty not in text:
    raise SystemExit("Could not find the current EmptyState block. No changes made.")

text = text.replace(old_empty, new_empty, 1)

path.write_text(text)

print("✅ Daily Focus empty state now has action buttons.")
print("✅ No backend touched.")
print("✅ Existing refresh behavior preserved.")
