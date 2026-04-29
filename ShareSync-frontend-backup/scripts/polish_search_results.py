#!/usr/bin/env python3
from pathlib import Path
import shutil
import sys

ROOT = Path.cwd()
TARGET = ROOT / "src/pages/SearchPage.jsx"
BACKUP = ROOT / "src/pages/SearchPage.jsx.bak.before-search-polish"


def fail(message: str) -> None:
    print(f"\n[polish_search_results] ERROR: {message}")
    sys.exit(1)


def require_count(text: str, needle: str, expected: int, label: str) -> None:
    actual = text.count(needle)
    if actual != expected:
        fail(f"{label}: expected {expected} occurrence(s), found {actual}")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    require_count(text, old, 1, label)
    return text.replace(old, new, 1)


def main() -> None:
    print("[polish_search_results] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")

    if "search-heading-polished" in source:
        fail("SearchPage.jsx already appears to contain the polished search layout. Refusing to patch twice.")

    edited = source

    old_header = '''        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Search OpenShare</h1>
          <p className="text-slate-500 dark:text-zinc-400">Find projects, tasks, people, and files across your workspace.</p>
        </div>'''

    new_header = '''        {/* Search Header */}
        <div className="search-heading-polished mb-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600 shadow-sm dark:border-violet-500/15 dark:bg-white/[0.03] dark:text-violet-300">
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            Workspace index
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-[1.7rem]">
            Search OpenShare
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-zinc-400">
            Find projects, people, tasks, posts, and files across your workspace.
          </p>
        </div>'''

    edited = replace_once(edited, old_header, new_header, "page header block")

    old_panel = '''        <div className="rounded-2xl border border-slate-200 dark:border-[#1f1f23] bg-white dark:bg-[#111113] p-5 shadow-sm dark:shadow-none">'''

    new_panel = '''        <div className="search-panel-polished rounded-[1.35rem] border border-slate-200/80 bg-white/95 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur dark:border-white/[0.08] dark:bg-[#111113]/95 dark:shadow-none">'''

    edited = replace_once(edited, old_panel, new_panel, "search panel shell")

    old_icon_box = '''              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <Search className="w-5 h-5 text-violet-600 dark:text-violet-400" aria-hidden="true" />
              </div>'''

    new_icon_box = '''              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50 ring-1 ring-violet-100 dark:bg-violet-500/10 dark:ring-violet-500/15">
                <Search className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden="true" />
              </div>'''

    edited = replace_once(edited, old_icon_box, new_icon_box, "search icon box")

    old_input_class = '''                className="flex-1 bg-transparent border-none outline-none text-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600"'''

    new_input_class = '''                className="flex-1 border-none bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-zinc-600"'''

    edited = replace_once(edited, old_input_class, new_input_class, "search input class")

    old_button_class = '''                className="rounded-xl px-6 py-2.5 text-sm font-bold bg-slate-100 dark:bg-[#1f1f23] text-slate-700 dark:text-zinc-300 hover:bg-violet-600 hover:text-white transition-all"'''

    new_button_class = '''                className="rounded-xl bg-slate-100 px-5 py-2 text-sm font-bold text-slate-700 transition-all hover:bg-violet-600 hover:text-white dark:bg-[#1f1f23] dark:text-zinc-300"'''

    edited = replace_once(edited, old_button_class, new_button_class, "search button class")

    old_filters_wrap = '''          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-[#1f1f23]">'''

    new_filters_wrap = '''          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-[#1f1f23]">'''

    edited = replace_once(edited, old_filters_wrap, new_filters_wrap, "filters wrapper")

    old_items = '''    const items = (() => {
      if (tKey === "project") return rows.map(r => <ProjectResultCard key={r._id || r.id} project={r} />);
      if (tKey === "user")    return rows.map(r => <UserResultCard    key={r._id || r.id || r.username} user={r} />);
      if (tKey === "post")    return rows.map(r => <PostResultCard    key={r._id || r.id} post={r} />);
      if (tKey === "file")    return rows.map(r => <FileResultCard    key={r._id || r.id} file={r} />);
      if (tKey === "task")    return rows.map(r => <TaskResultCard    key={r._id || r.id} task={r} />);
      return null;
    })();'''

    new_items = '''    const rawItems = (() => {
      if (tKey === "project") return rows.map(r => <ProjectResultCard key={r._id || r.id} project={r} />);
      if (tKey === "user")    return rows.map(r => <UserResultCard    key={r._id || r.id || r.username} user={r} />);
      if (tKey === "post")    return rows.map(r => <PostResultCard    key={r._id || r.id} post={r} />);
      if (tKey === "file")    return rows.map(r => <FileResultCard    key={r._id || r.id} file={r} />);
      if (tKey === "task")    return rows.map(r => <TaskResultCard    key={r._id || r.id} task={r} />);
      return null;
    })();

    const items = React.Children.toArray(rawItems).map((child, index) => (
      <div
        key={child.key || `${tKey}:${index}`}
        className="search-result-polish rounded-xl ring-1 ring-transparent transition-all duration-150 ease-out hover:-translate-y-0.5 hover:bg-white/80 hover:ring-violet-200/70 hover:shadow-[0_12px_34px_rgba(15,23,42,0.07)] dark:hover:bg-white/[0.03] dark:hover:ring-violet-500/25 [&>a]:px-4 [&>a]:py-2.5 [&>button]:px-4 [&>button]:py-2.5 [&>div]:px-4 [&>div]:py-2.5"
      >
        {child}
      </div>
    ));'''

    edited = replace_once(edited, old_items, new_items, "result item wrapper block")

    old_group_header = '''      <section className="mt-5" aria-label={label}>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
          <Icon className="w-4 h-4 text-violet-500 dark:text-violet-400" />
          {label}
        </div>
        <div className="space-y-2" role="list">
          {items}
        </div>
      </section>'''

    new_group_header = '''      <section className="mt-4" aria-label={label}>
        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-50 text-violet-600 ring-1 ring-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/15">
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span>{label}</span>
          <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-white/[0.04] dark:text-zinc-400">
            {rows.length}
          </span>
        </div>
        <div className="space-y-1.5" role="list">
          {items}
        </div>
      </section>'''

    edited = replace_once(edited, old_group_header, new_group_header, "group header block")

    old_results_area = '''        <div role="listbox" aria-label="Search results" className="mt-8">'''

    new_results_area = '''        <div role="listbox" aria-label="Search results" className="mt-6">'''

    edited = replace_once(edited, old_results_area, new_results_area, "results area spacing")

    require_count(edited, "search-heading-polished", 1, "new header marker")
    require_count(edited, "search-panel-polished", 1, "new panel marker")
    require_count(edited, "search-result-polish", 1, "new result wrapper marker")
    require_count(edited, "Workspace index", 1, "new compact eyebrow label")
    require_count(edited, "{rows.length}", 1, "section count badge")
    require_count(edited, "React.Children.toArray(rawItems)", 1, "wrapped result cards")

    if edited == source:
        fail("No changes were produced")

    if not BACKUP.exists():
        shutil.copy2(TARGET, BACKUP)
        print(f"[polish_search_results] backup created: {BACKUP}")
    else:
        print(f"[polish_search_results] backup already exists, preserved: {BACKUP}")

    TARGET.write_text(edited, encoding="utf-8")

    print("\n[polish_search_results] complete")
    print("\nNext checks:")
    print("  npm run build")
    print("  rg -n \"search-heading-polished|search-panel-polished|search-result-polish|Workspace index|rows.length|React.Children.toArray\" src/pages/SearchPage.jsx -C 5")
    print("  git diff -- src/pages/SearchPage.jsx")


if __name__ == "__main__":
    main()
