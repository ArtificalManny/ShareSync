#!/usr/bin/env python3
from pathlib import Path
import shutil
import sys

ROOT = Path.cwd()
TARGET = ROOT / "src/pages/SearchPage.jsx"
BACKUP = ROOT / "src/pages/SearchPage.jsx.bak.before-results-section-refine"


def fail(message: str) -> None:
    print(f"\n[refine_search_results_section] ERROR: {message}")
    sys.exit(1)


def require_count(text: str, needle: str, expected: int, label: str) -> None:
    actual = text.count(needle)
    if actual != expected:
        fail(f"{label}: expected {expected} occurrence(s), found {actual}")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    require_count(text, old, 1, label)
    return text.replace(old, new, 1)


def main() -> None:
    print("[refine_search_results_section] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")

    if "search-result-section-refined" in source:
        fail("SearchPage.jsx already appears to contain the refined results section. Refusing to patch twice.")

    old_block = '''    const rawItems = (() => {
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
    ));

    return (
      <section className="mt-4" aria-label={label}>
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
      </section>
    );'''

    new_block = '''    const rawItems = (() => {
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
        className="search-result-card-refined group rounded-2xl border border-slate-200/80 bg-white/80 ring-1 ring-transparent shadow-[0_1px_0_rgba(15,23,42,0.02)] transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-violet-200/80 hover:bg-white hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)] dark:border-white/[0.08] dark:bg-[#131318]/85 dark:shadow-none dark:hover:border-violet-500/25 dark:hover:bg-[#17171d] [&>a]:block [&>a]:px-4 [&>a]:py-3 sm:[&>a]:px-5 sm:[&>a]:py-3.5 [&>button]:block [&>button]:w-full [&>button]:px-4 [&>button]:py-3 sm:[&>button]:px-5 sm:[&>button]:py-3.5 [&>div]:px-4 [&>div]:py-3 sm:[&>div]:px-5 sm:[&>div]:py-3.5"
      >
        {child}
      </div>
    ));

    return (
      <section className="search-result-section-refined mt-5" aria-label={label}>
        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white/70 shadow-[0_16px_50px_rgba(15,23,42,0.05)] backdrop-blur dark:border-white/[0.08] dark:bg-[#101014]/80 dark:shadow-none">
          <div className="search-group-header-refined flex items-center gap-3 border-b border-slate-200/70 px-4 py-3 sm:px-5 dark:border-white/[0.08]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/15">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
                {label}
              </div>
              <div className="text-xs text-slate-400 dark:text-zinc-500">
                {rows.length} result{rows.length === 1 ? "" : "s"}
              </div>
            </div>

            <span className="ml-auto inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-100 px-2.5 text-[11px] font-semibold text-slate-500 dark:bg-white/[0.05] dark:text-zinc-400">
              {rows.length}
            </span>
          </div>

          <div className="space-y-2 p-2.5 sm:p-3" role="list">
            {items}
          </div>
        </div>
      </section>
    );'''

    edited = replace_once(source, old_block, new_block, "renderGroup refined block")

    require_count(edited, "search-result-section-refined", 1, "section shell marker")
    require_count(edited, "search-result-card-refined", 1, "result card marker")
    require_count(edited, "search-group-header-refined", 1, "group header marker")
    require_count(edited, 'result{rows.length === 1 ? "" : "s"}', 1, "results sublabel")

    if edited == source:
        fail("No changes were produced")

    if not BACKUP.exists():
        shutil.copy2(TARGET, BACKUP)
        print(f"[refine_search_results_section] backup created: {BACKUP}")
    else:
        print(f"[refine_search_results_section] backup already exists, preserved: {BACKUP}")

    TARGET.write_text(edited, encoding="utf-8")

    print("\n[refine_search_results_section] complete")
    print("\nNext checks:")
    print("  npm run build")
    print("  rg -n \"search-result-section-refined|search-result-card-refined|search-group-header-refined|result\\{rows.length === 1 \\? \\\"\\\" : \\\"s\\\"\\}\" src/pages/SearchPage.jsx -C 5")
    print("  git diff -- src/pages/SearchPage.jsx")


if __name__ == "__main__":
    main()
