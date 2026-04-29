#!/usr/bin/env python3
from pathlib import Path
import shutil
import sys

ROOT = Path.cwd()
TARGET = ROOT / "src/pages/SearchPage.jsx"
BACKUP = ROOT / "src/pages/SearchPage.jsx.bak.before-search-hue-refine"


def fail(message: str) -> None:
    print(f"\n[refine_searchpage_color_hue] ERROR: {message}")
    sys.exit(1)


def require_count(text: str, needle: str, expected: int, label: str) -> None:
    actual = text.count(needle)
    if actual != expected:
        fail(f"{label}: expected {expected} occurrence(s), found {actual}")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    require_count(text, old, 1, label)
    return text.replace(old, new, 1)


def main() -> None:
    print("[refine_searchpage_color_hue] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")

    if "search-hue-refined" in source:
        fail("SearchPage.jsx already appears to contain the hue-refined search surfaces. Refusing to patch twice.")

    edited = source

    # 1. Replace the gray-feeling main search/filter surface with a soft luminous product surface.
    old_search_panel = '''        <div className="search-panel-polished rounded-[1.35rem] border border-slate-200/80 bg-white/95 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur dark:border-white/[0.08] dark:bg-[#111113]/95 dark:shadow-none">'''

    new_search_panel = '''        <div className="search-panel-polished search-hue-refined relative overflow-hidden rounded-[1.35rem] border border-violet-100/80 bg-gradient-to-br from-white via-violet-50/70 to-sky-50/55 p-4 shadow-[0_18px_60px_rgba(79,70,229,0.10)] backdrop-blur dark:border-violet-500/15 dark:from-[#111113] dark:via-violet-950/20 dark:to-sky-950/10 dark:shadow-none">'''

    edited = replace_once(edited, old_search_panel, new_search_panel, "main search/filter panel hue")

    # 2. Replace the gray-feeling result group shell with a quieter white/violet surface.
    old_result_shell = '''        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white/70 shadow-[0_16px_50px_rgba(15,23,42,0.05)] backdrop-blur dark:border-white/[0.08] dark:bg-[#101014]/80 dark:shadow-none">'''

    new_result_shell = '''        <div className="overflow-hidden rounded-[1.5rem] border border-violet-100/80 bg-gradient-to-br from-white via-violet-50/45 to-slate-50 shadow-[0_18px_55px_rgba(79,70,229,0.08)] backdrop-blur dark:border-violet-500/15 dark:from-[#101014]/95 dark:via-violet-950/15 dark:to-[#0b0b10]/95 dark:shadow-none">'''

    edited = replace_once(edited, old_result_shell, new_result_shell, "result section shell hue")

    # 3. Give the result section header a deliberate tinted band instead of flat gray.
    old_group_header = '''          <div className="search-group-header-refined flex items-center gap-3 border-b border-slate-200/70 px-4 py-3 sm:px-5 dark:border-white/[0.08]">'''

    new_group_header = '''          <div className="search-group-header-refined flex items-center gap-3 border-b border-violet-100/80 bg-gradient-to-r from-violet-50/80 via-white/75 to-sky-50/60 px-4 py-3 sm:px-5 dark:border-violet-500/15 dark:from-violet-950/20 dark:via-white/[0.02] dark:to-sky-950/10">'''

    edited = replace_once(edited, old_group_header, new_group_header, "result section header hue")

    # 4. Make each result row feel cleaner and less gray.
    old_result_card = '''        className="search-result-card-refined group rounded-2xl border border-slate-200/80 bg-white/80 ring-1 ring-transparent shadow-[0_1px_0_rgba(15,23,42,0.02)] transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-violet-200/80 hover:bg-white hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)] dark:border-white/[0.08] dark:bg-[#131318]/85 dark:shadow-none dark:hover:border-violet-500/25 dark:hover:bg-[#17171d] [&>a]:block [&>a]:px-4 [&>a]:py-3 sm:[&>a]:px-5 sm:[&>a]:py-3.5 [&>button]:block [&>button]:w-full [&>button]:px-4 [&>button]:py-3 sm:[&>button]:px-5 sm:[&>button]:py-3.5 [&>div]:px-4 [&>div]:py-3 sm:[&>div]:px-5 sm:[&>div]:py-3.5"'''

    new_result_card = '''        className="search-result-card-refined group rounded-2xl border border-violet-100/70 bg-white/90 ring-1 ring-transparent shadow-[0_1px_0_rgba(79,70,229,0.04)] transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-violet-200 hover:bg-white hover:shadow-[0_16px_40px_rgba(79,70,229,0.10)] dark:border-violet-500/10 dark:bg-[#131318]/90 dark:shadow-none dark:hover:border-violet-500/30 dark:hover:bg-[#17171d] [&>a]:block [&>a]:px-4 [&>a]:py-3 sm:[&>a]:px-5 sm:[&>a]:py-3.5 [&>button]:block [&>button]:w-full [&>button]:px-4 [&>button]:py-3 sm:[&>button]:px-5 sm:[&>button]:py-3.5 [&>div]:px-4 [&>div]:py-3 sm:[&>div]:px-5 sm:[&>div]:py-3.5"'''

    edited = replace_once(edited, old_result_card, new_result_card, "result card hue")

    # 5. Make the page background a little less sterile while keeping it clean.
    old_main = '''    <main id="main" role="main" tabIndex={-1} onKeyDown={onKeyDown} className="min-h-screen bg-slate-50 dark:bg-[#09090B]">'''

    new_main = '''    <main id="main" role="main" tabIndex={-1} onKeyDown={onKeyDown} className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.08),transparent_34%),linear-gradient(180deg,#F8FAFC_0%,#F5F7FF_46%,#F8FAFC_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.12),transparent_34%),linear-gradient(180deg,#09090B_0%,#101014_48%,#09090B_100%)]">'''

    edited = replace_once(edited, old_main, new_main, "page background hue")

    require_count(edited, "search-hue-refined", 1, "hue marker")
    require_count(edited, "from-white via-violet-50/70 to-sky-50/55", 1, "main panel gradient")
    require_count(edited, "from-white via-violet-50/45 to-slate-50", 1, "result shell gradient")
    require_count(edited, "from-violet-50/80 via-white/75 to-sky-50/60", 1, "group header gradient")
    require_count(edited, "rgba(139,92,246,0.08)", 1, "page radial violet glow")

    if edited == source:
        fail("No changes were produced")

    if not BACKUP.exists():
        shutil.copy2(TARGET, BACKUP)
        print(f"[refine_searchpage_color_hue] backup created: {BACKUP}")
    else:
        print(f"[refine_searchpage_color_hue] backup already exists, preserved: {BACKUP}")

    TARGET.write_text(edited, encoding="utf-8")

    print("\n[refine_searchpage_color_hue] complete")
    print("\nNext checks:")
    print("  npm run build")
    print("  rg -n \"search-hue-refined|from-white via-violet-50/70 to-sky-50/55|from-white via-violet-50/45 to-slate-50|from-violet-50/80 via-white/75 to-sky-50/60|rgba\\(139,92,246,0.08\\)\" src/pages/SearchPage.jsx -C 5")
    print("  git diff -- src/pages/SearchPage.jsx")


if __name__ == "__main__":
    main()
