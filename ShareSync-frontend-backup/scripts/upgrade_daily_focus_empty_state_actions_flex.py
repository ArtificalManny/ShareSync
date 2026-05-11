from pathlib import Path

path = Path("src/components/focus/YourMovesToday.jsx")
text = path.read_text()

# ─────────────────────────────────────────────────────────────────────────────
# 1. Add needed lucide icons without disturbing existing imports.
# ─────────────────────────────────────────────────────────────────────────────

needed_icons = ["FolderPlus", "LayoutDashboard"]

import_start = text.find("import {")
import_marker = "from 'lucide-react';"

if import_start == -1 or import_marker not in text:
    raise SystemExit("Could not find lucide-react import. Please paste the top import section of YourMovesToday.jsx.")

import_end = text.find(import_marker, import_start)
import_block = text[import_start:import_end + len(import_marker)]

for icon in needed_icons:
    if icon not in import_block:
        import_block = import_block.replace(" } from 'lucide-react';", f", {icon} }} from 'lucide-react';")

text = text[:import_start] + import_block + text[import_end + len(import_marker):]


# ─────────────────────────────────────────────────────────────────────────────
# 2. Find function EmptyState(...) safely using brace matching.
# ─────────────────────────────────────────────────────────────────────────────

target = "function EmptyState"
start = text.find(target)

if start == -1:
    raise SystemExit("Could not find function EmptyState. Please run: rg -n \"EmptyState|All caught up|No critical moves\" src/components/focus/YourMovesToday.jsx -C 8")

brace_start = text.find("{", start)

if brace_start == -1:
    raise SystemExit("Found EmptyState but could not find opening brace.")

depth = 0
end = None

for i in range(brace_start, len(text)):
    char = text[i]

    if char == "{":
        depth += 1
    elif char == "}":
        depth -= 1

        if depth == 0:
            end = i + 1
            break

if end is None:
    raise SystemExit("Could not find end of EmptyState function safely.")

old_block = text[start:end]

new_block = """function EmptyState({ onRefresh }) {
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
          type="button"
          onClick={goToProjects}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--theme-accent-primary)] px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-sm hover:brightness-110 transition-all"
        >
          <FolderPlus className="w-4 h-4" />
          Create Project
        </button>

        <button
          type="button"
          onClick={goToProjects}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-zinc-300 hover:text-[var(--theme-accent-primary)] hover:border-[var(--theme-accent-primary)] transition-all shadow-sm"
        >
          <LayoutDashboard className="w-4 h-4" />
          View Projects
        </button>

        <button
          type="button"
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

text = text[:start] + new_block + text[end:]

path.write_text(text)

print("✅ Daily Focus empty state upgraded with action buttons.")
print("✅ Replaced EmptyState by function boundary, not fragile exact text.")
print("✅ No backend touched.")
