#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path.cwd()
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")

FLOW_BOARD = ROOT / "src/features/flow/FlowBoard.jsx"
FLOW_COLUMN = ROOT / "src/features/flow/FlowColumn.jsx"
FLOW_CARD = ROOT / "src/features/flow/FlowTaskCard.jsx"


def fail(message):
    print(f"\n[condense_flow_board_columns] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def backup(path: Path):
    backup_path = path.with_name(f"{path.name}.bak-condense-flow-board-{STAMP}")
    backup_path.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
    print(f"[condense_flow_board_columns] backup created: {backup_path}")


def replace_required(source: str, old: str, new: str, label: str) -> str:
    if old not in source:
        fail(f"Could not find expected block for: {label}. No changes were written.")
    print(f"[condense_flow_board_columns] replaced: {label}")
    return source.replace(old, new, 1)


def write_if_changed(path: Path, original: str, updated: str):
    if original == updated:
        print(f"[condense_flow_board_columns] no changes needed: {path}")
        return False

    backup(path)
    path.write_text(updated, encoding="utf-8")
    print(f"[condense_flow_board_columns] patched: {path}")
    return True


def patch_flow_board():
    if not FLOW_BOARD.exists():
        fail(f"Could not find {FLOW_BOARD}")

    source = FLOW_BOARD.read_text(encoding="utf-8")
    original = source

    required = [
        "FlowBoard",
        "FLOW_STATUSES.map",
        "FlowColumn",
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3",
    ]

    for marker in required:
        if marker not in source:
            fail(f"Missing expected marker in FlowBoard.jsx before patch: {marker}")

    # Compact the header spacing.
    source = replace_required(
        source,
        'className="flex items-center justify-between gap-3 mb-3"',
        'className="flex items-center justify-between gap-3 mb-2"',
        "FlowBoard header margin",
    )

    # Compact loading skeleton columns.
    source = replace_required(
        source,
        'className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"',
        'className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2"',
        "FlowBoard loading grid gap",
    )

    # Compact live board grid and prevent column overflow.
    source = replace_required(
        source,
        'className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"',
        'className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 items-start [&>*]:min-w-0"',
        "FlowBoard live grid gap / min-width control",
    )

    return write_if_changed(FLOW_BOARD, original, source)


def patch_flow_column():
    if not FLOW_COLUMN.exists():
        fail(f"Could not find {FLOW_COLUMN}")

    source = FLOW_COLUMN.read_text(encoding="utf-8")
    original = source

    required = [
        "FlowColumn",
        "laneMeta",
        "onMoveTask",
        "onAddTask",
        "Task list",
        "Empty state",
    ]

    for marker in required:
        if marker not in source:
            fail(f"Missing expected marker in FlowColumn.jsx before patch: {marker}")

    # Make each lane shorter, tighter, and internally scrollable.
    source = replace_required(
        source,
        'className={`rounded-2xl border bg-white/60 dark:bg-slate-900/40 p-3 flex flex-col min-h-[240px] transition-all ${',
        'className={`rounded-[1.35rem] border bg-white/60 dark:bg-slate-900/40 p-2.5 flex flex-col min-h-[220px] max-h-[calc(100vh-19rem)] overflow-hidden transition-all ${',
        "FlowColumn compact shell",
    )

    # Tighten column header.
    source = replace_required(
        source,
        'className="flex items-start justify-between gap-2 px-1 pb-3"',
        'className="flex items-start justify-between gap-2 px-1 pb-2"',
        "FlowColumn header padding",
    )

    source = source.replace(
        'className={`text-sm font-semibold ${meta.titleClass}`}',
        'className={`text-[13px] font-semibold ${meta.titleClass}`}',
        1,
    )

    source = source.replace(
        'className="mt-1 text-[11px] text-slate-400 dark:text-zinc-500"',
        'className="mt-0.5 text-[10px] leading-snug text-slate-400 dark:text-zinc-500"',
        1,
    )

    # Make the task area scroll inside the column.
    source = replace_required(
        source,
        'className="flex-1 space-y-2"',
        'className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1"',
        "FlowColumn internal task scrolling",
    )

    # Compact inline add form.
    source = source.replace(
        'className="rounded-xl border border-violet-300 dark:border-violet-500/30 bg-white dark:bg-[#111113] p-3 shadow-sm"',
        'className="rounded-xl border border-violet-300 dark:border-violet-500/30 bg-white dark:bg-[#111113] p-2.5 shadow-sm"',
        1,
    )

    # Compact empty state.
    source = source.replace(
        'className="w-full mt-2 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-500/30 p-4 text-center transition-colors group"',
        'className="w-full mt-2 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-500/30 p-3 text-center transition-colors group"',
        1,
    )

    source = source.replace(
        'className="w-5 h-5 mx-auto mb-2 text-slate-300 dark:text-zinc-600 group-hover:text-violet-400 transition-colors"',
        'className="w-4 h-4 mx-auto mb-1.5 text-slate-300 dark:text-zinc-600 group-hover:text-violet-400 transition-colors"',
        1,
    )

    source = source.replace(
        'className="mt-1 text-[11px] text-slate-400 dark:text-zinc-500"',
        'className="mt-1 text-[10px] leading-snug text-slate-400 dark:text-zinc-500"',
        1,
    )

    required_after = [
        "max-h-[calc(100vh-19rem)]",
        "overflow-hidden",
        "overflow-y-auto",
        "min-h-0 flex-1",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed in FlowColumn.jsx after patch. Missing: {marker}")

    return write_if_changed(FLOW_COLUMN, original, source)


def patch_flow_task_card():
    if not FLOW_CARD.exists():
        fail(f"Could not find {FLOW_CARD}")

    source = FLOW_CARD.read_text(encoding="utf-8")
    original = source

    required = [
        "FlowTaskCard",
        "draggable",
        "application/x-openshare-task",
        "Blocked",
        "Unassigned",
    ]

    for marker in required:
        if marker not in source:
            fail(f"Missing expected marker in FlowTaskCard.jsx before patch: {marker}")

    # Compact card shell.
    source = replace_required(
        source,
        """        group rounded-xl border border-slate-200/70 dark:border-slate-800
        bg-white/90 dark:bg-slate-900/70
        p-3 shadow-sm hover:shadow-md
        transition cursor-grab active:cursor-grabbing
""",
        """        group rounded-[1rem] border border-slate-200/70 dark:border-slate-800
        bg-white/90 dark:bg-slate-900/70
        p-2.5 shadow-sm hover:shadow-md
        transition cursor-grab active:cursor-grabbing
""",
        "FlowTaskCard shell padding",
    )

    # Compact grip icon.
    source = source.replace(
        '<GripVertical className="w-4 h-4" />',
        '<GripVertical className="w-3.5 h-3.5" />',
        1,
    )

    # Compact title.
    source = source.replace(
        'className="text-sm font-semibold text-slate-900 dark:text-slate-100 break-words leading-snug"',
        'className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 break-words leading-snug"',
        1,
    )

    # Compact signal chips spacing.
    source = source.replace(
        'className="mt-3 flex flex-wrap items-center gap-1.5"',
        'className="mt-2 flex flex-wrap items-center gap-1.5"',
        1,
    )

    # Compact footer spacing.
    source = source.replace(
        'className="mt-3 flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400"',
        'className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400"',
        1,
    )

    # Compact assignee avatar.
    source = source.replace(
        """              w-6 h-6 rounded-full
              bg-teal-50 dark:bg-teal-500/10
""",
        """              w-5 h-5 rounded-full
              bg-teal-50 dark:bg-teal-500/10
""",
        1,
    )

    source = source.replace(
        'font-semibold text-[10px] flex-shrink-0',
        'font-semibold text-[9px] flex-shrink-0',
        1,
    )

    required_after = [
        "rounded-[1rem]",
        "p-2.5",
        "text-[13px] font-semibold",
        "text-[10px]",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed in FlowTaskCard.jsx after patch. Missing: {marker}")

    return write_if_changed(FLOW_CARD, original, source)


def main():
    print("[condense_flow_board_columns] starting")

    changed = False
    changed = patch_flow_board() or changed
    changed = patch_flow_column() or changed
    changed = patch_flow_task_card() or changed

    if not changed:
        fail("No files were changed.")

    print("")
    print("[condense_flow_board_columns] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "gap-2 items-start|max-h-\\[calc\\(100vh-19rem\\)|overflow-y-auto|rounded-\\[1rem\\]|p-2.5|text-\\[13px\\]" src/features/flow -C 4')
    print("  git diff -- src/features/flow/FlowBoard.jsx src/features/flow/FlowColumn.jsx src/features/flow/FlowTaskCard.jsx")


if __name__ == "__main__":
    main()
