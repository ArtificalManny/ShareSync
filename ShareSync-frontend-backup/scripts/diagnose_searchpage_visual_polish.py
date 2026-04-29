#!/usr/bin/env python3
from pathlib import Path

ROOT = Path.cwd()
SRC = ROOT / "src"

SEARCH_PAGE = SRC / "pages/SearchPage.jsx"
ORPHAN_SEARCH = SRC / "pages/Search.jsx"
APP = SRC / "App.jsx"
ROUTES = SRC / "Routes.jsx"


def header(title):
    print("\n" + "═" * 90)
    print(title)
    print("═" * 90)


def exists_report(path):
    status = "FOUND" if path.exists() else "missing"
    try:
        rel = path.relative_to(ROOT)
    except Exception:
        rel = path
    print(f"{rel}: {status}")


def read(path):
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


def print_context(path, needles, radius=8):
    text = read(path)
    if not text:
        print(f"\n{path} missing or empty")
        return

    lines = text.splitlines()
    printed = []

    print(f"\n--- {path.relative_to(ROOT)} ---")

    for idx, line in enumerate(lines):
        if any(needle in line for needle in needles):
            start = max(0, idx - radius)
            end = min(len(lines), idx + radius + 1)

            if any(not (end < old_start or start > old_end) for old_start, old_end in printed):
                continue

            printed.append((start, end))

            print(f"\nlines {start + 1}-{end}")
            for j in range(start, end):
                print(f"{j + 1}: {lines[j]}")


def count_needles(path, needles):
    text = read(path)
    print(f"\n--- counts in {path.relative_to(ROOT)} ---")
    for needle in needles:
        print(f"{needle!r}: {text.count(needle)}")


def main():
    header("SearchPage visual polish diagnostic")

    print("\nWorking directory:")
    print(ROOT)

    header("Important files")
    for path in [SEARCH_PAGE, ORPHAN_SEARCH, APP, ROUTES]:
        exists_report(path)

    header("Route/import verification")
    print_context(
        APP,
        [
            "SearchPage",
            'path="/search"',
            "path='/search'",
            "./pages/SearchPage",
            "./pages/Search",
        ],
        radius=6,
    )

    if ROUTES.exists():
        print_context(
            ROUTES,
            [
                "SearchPage",
                'path="/search"',
                "path='/search'",
                "./pages/SearchPage",
                "./pages/Search",
            ],
            radius=6,
        )

    header("SearchPage headline/search/filter/result contexts")
    print_context(
        SEARCH_PAGE,
        [
            "Search OpenShare",
            "Find projects, tasks, people, and files",
            "Search",
            "Filters",
            "Relevance",
            "PEOPLE",
            "PROJECTS",
            "TASKS",
            "POSTS",
            "FILES",
            "Public",
            "Last activity",
        ],
        radius=10,
    )

    header("SearchPage result-card and className contexts")
    print_context(
        SEARCH_PAGE,
        [
            "map(",
            ".map",
            "result",
            "results",
            "projects",
            "people",
            "users",
            "className=",
            "rounded",
            "border",
            "shadow",
            "hover:",
            "transition",
            "Link",
            "navigate",
            "to={`",
        ],
        radius=6,
    )

    header("String counts for safe anchored patch planning")
    count_needles(
        SEARCH_PAGE,
        [
            "Search OpenShare",
            "Find projects, tasks, people, and files across your workspace.",
            "PEOPLE",
            "PROJECTS",
            "TASKS",
            "POSTS",
            "FILES",
            "hover:",
            "transition",
            "rounded",
            "px-",
            "py-",
            "p-",
            "className=",
        ],
    )

    header("First 80 lines of SearchPage.jsx")
    text = read(SEARCH_PAGE)
    for i, line in enumerate(text.splitlines()[:80], start=1):
        print(f"{i}: {line}")

    header("Next step")
    print("Paste this diagnostic output back into ChatGPT.")
    print("Then I will write ONE exact Python patch script:")
    print("  scripts/polish_search_results.py")
    print("It will edit only src/pages/SearchPage.jsx, create a backup, and write once.")


if __name__ == "__main__":
    main()
