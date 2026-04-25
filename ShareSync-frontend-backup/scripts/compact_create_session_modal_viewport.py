#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import sys

ROOT = Path.cwd()
MODAL = ROOT / "src/calendar/CreateSessionModal.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message):
    print(f"\n[compact_create_session_modal_viewport] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def replace_required(source, old, new, label):
    if old not in source:
        fail(f"Could not find expected block for: {label}. No changes were written.")
    print(f"[compact_create_session_modal_viewport] replaced: {label}")
    return source.replace(old, new, 1)


def main():
    print("[compact_create_session_modal_viewport] starting")

    if not MODAL.exists():
        fail(f"Could not find {MODAL}")

    source = MODAL.read_text(encoding="utf-8")
    original = source

    required_before = [
        "CreateSessionModal",
        "Rhythm Planner",
        "Schedule Session",
        "Session type",
        "Time window",
        "Save to Rhythm",
        "onSave({",
    ]

    for marker in required_before:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}. No changes were written.")

    # 1) Make the overlay scrollable on short screens.
    source = replace_required(
        source,
        'className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md"',
        'className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 px-4 py-4 backdrop-blur-md sm:items-center sm:py-6"',
        "overlay viewport behavior",
    )

    # 2) Constrain the modal height and make the panel itself scroll internally.
    source = replace_required(
        source,
        'className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/92 shadow-[0_30px_90px_rgba(15,23,42,0.22)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 dark:border-white/[0.08] dark:bg-[#101827]/95 dark:shadow-black/40"',
        'className="relative my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/92 shadow-[0_24px_70px_rgba(15,23,42,0.20)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 dark:border-white/[0.08] dark:bg-[#101827]/95 dark:shadow-black/40 sm:max-h-[calc(100vh-3rem)]"',
        "modal panel max height",
    )

    # 3) Keep header visible and slightly tighter.
    source = replace_required(
        source,
        'className="flex items-start justify-between gap-4 border-b border-slate-200/70 px-6 py-5 dark:border-white/[0.06] sm:px-7"',
        'className="shrink-0 flex items-start justify-between gap-4 border-b border-slate-200/70 px-5 py-4 dark:border-white/[0.06] sm:px-6"',
        "modal header spacing",
    )

    # 4) Make the form the scrollable region and compact the vertical rhythm.
    source = replace_required(
        source,
        'className="space-y-6 px-6 py-6 sm:px-7"',
        'className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6"',
        "form scroll container",
    )

    # 5) Compact the title field so it does not dominate the modal.
    source = replace_required(
        source,
        'className="w-full rounded-2xl border border-slate-200 bg-white/95 px-4 py-4 text-2xl font-semibold tracking-tight text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white dark:placeholder:text-white/30 dark:focus:border-violet-400/40 dark:focus:ring-violet-500/15"',
        'className="w-full rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 text-xl font-semibold tracking-tight text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white dark:placeholder:text-white/30 dark:focus:border-violet-400/40 dark:focus:ring-violet-500/15"',
        "title input compact sizing",
    )

    # 6) Compact selector cards.
    source = source.replace(
        "rounded-2xl border px-4 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5",
        "rounded-2xl border px-3 py-2.5 text-left shadow-sm transition-all hover:-translate-y-0.5",
    )
    source = source.replace(
        "flex h-9 w-9 items-center justify-center rounded-xl",
        "flex h-8 w-8 items-center justify-center rounded-xl",
    )

    # 7) Compact textarea height so footer is easier to reach.
    source = replace_required(
        source,
        'className={`${inputClassName} min-h-[104px] resize-none leading-relaxed`}',
        'className={`${inputClassName} min-h-[84px] resize-none leading-relaxed`}',
        "textarea compact height",
    )

    # 8) Keep footer visible at the bottom of the scrollable form.
    source = replace_required(
        source,
        'className="flex flex-col-reverse gap-3 border-t border-slate-200/70 pt-5 dark:border-white/[0.06] sm:flex-row sm:justify-end"',
        'className="sticky bottom-0 -mx-5 flex flex-col-reverse gap-3 border-t border-slate-200/70 bg-white/90 px-5 pt-4 pb-1 backdrop-blur-md dark:border-white/[0.06] dark:bg-[#101827]/90 sm:-mx-6 sm:flex-row sm:justify-end sm:px-6"',
        "sticky footer actions",
    )

    required_after = [
        "overflow-y-auto",
        "max-h-[calc(100vh-2rem)]",
        "sm:max-h-[calc(100vh-3rem)]",
        "max-w-xl",
        "min-h-0 flex-1",
        "sticky bottom-0",
        "Save to Rhythm",
        "onSave({",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    backup = MODAL.with_name(f"{MODAL.name}.bak-compact-viewport-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[compact_create_session_modal_viewport] backup created: {backup}")

    MODAL.write_text(source, encoding="utf-8")
    print(f"[compact_create_session_modal_viewport] patched: {MODAL}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "overflow-y-auto|max-h-\\[calc\\(100vh|max-w-xl|min-h-0 flex-1|sticky bottom-0|Save to Rhythm" src/calendar/CreateSessionModal.jsx -C 5')
    print("  git diff -- src/calendar/CreateSessionModal.jsx")


if __name__ == "__main__":
    main()
