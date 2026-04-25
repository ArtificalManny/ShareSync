#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path.cwd()
TARGET = ROOT / "src/calendar/CreateSessionModal.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(msg):
    print(f"\n[tune_create_session_modal_compact_v2] ERROR: {msg}\n", file=sys.stderr)
    sys.exit(1)


def replace_first_from_list(source, candidates, new_value, label):
    for old_value in candidates:
        if old_value in source:
            print(f"[tune_create_session_modal_compact_v2] replaced: {label}")
            return source.replace(old_value, new_value, 1)
    fail(f'Could not find expected block for "{label}". No changes were written.')


def main():
    print("[tune_create_session_modal_compact_v2] starting")

    if not TARGET.exists():
        fail(f"Target file not found: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "CreateSessionModal",
        "Schedule Session",
        "Session title",
        "Session type",
        "Time window",
    ]

    for marker in required_markers:
        if marker not in source and marker.lower() not in source.lower():
            fail(f'Missing expected marker "{marker}" in file. Aborting safely.')

    # ──────────────────────────────────────────────────────────────────────
    # 1) Overlay:
    # Push modal down slightly more and keep overlay scrollable.
    # ──────────────────────────────────────────────────────────────────────
    source = replace_first_from_list(
        source,
        [
            'className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 px-4 py-4 backdrop-blur-md sm:items-center sm:py-6"',
            'className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 px-4 py-4 backdrop-blur-md"',
            'className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md"',
        ],
        'className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 px-4 pt-6 pb-6 backdrop-blur-md sm:px-5 sm:pt-8 sm:pb-8"',
        "overlay spacing / top offset",
    )

    # ──────────────────────────────────────────────────────────────────────
    # 2) Modal panel:
    # Narrow slightly and reduce max height a bit more.
    # ──────────────────────────────────────────────────────────────────────
    source = replace_first_from_list(
        source,
        [
            'className="relative my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/92 shadow-[0_24px_70px_rgba(15,23,42,0.20)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 dark:border-white/[0.08] dark:bg-[#101827]/95 dark:shadow-black/40 sm:max-h-[calc(100vh-3rem)]"',
            'className="relative my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/92 shadow-[0_30px_90px_rgba(15,23,42,0.22)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 dark:border-white/[0.08] dark:bg-[#101827]/95 dark:shadow-black/40 sm:max-h-[calc(100vh-3rem)]"',
            'className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/92 shadow-[0_30px_90px_rgba(15,23,42,0.22)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 dark:border-white/[0.08] dark:bg-[#101827]/95 dark:shadow-black/40"',
        ],
        'className="relative flex max-h-[calc(100vh-4rem)] w-full max-w-lg flex-col overflow-hidden rounded-[1.6rem] border border-white/80 bg-white/92 shadow-[0_24px_70px_rgba(15,23,42,0.20)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 dark:border-white/[0.08] dark:bg-[#101827]/95 dark:shadow-black/40 sm:max-h-[calc(100vh-5rem)]"',
        "modal panel width / max height",
    )

    # ──────────────────────────────────────────────────────────────────────
    # 3) Header:
    # Slightly tighter so more room remains for body/footer.
    # ──────────────────────────────────────────────────────────────────────
    source = replace_first_from_list(
        source,
        [
            'className="shrink-0 flex items-start justify-between gap-4 border-b border-slate-200/70 px-5 py-4 dark:border-white/[0.06] sm:px-6"',
            'className="flex items-start justify-between gap-4 border-b border-slate-200/70 px-6 py-5 dark:border-white/[0.06] sm:px-7"',
        ],
        'className="shrink-0 flex items-start justify-between gap-4 border-b border-slate-200/70 px-5 py-3.5 dark:border-white/[0.06] sm:px-6"',
        "header compact spacing",
    )

    # ──────────────────────────────────────────────────────────────────────
    # 4) Form body:
    # Keep scroll internal and tighten spacing a little more.
    # ──────────────────────────────────────────────────────────────────────
    source = replace_first_from_list(
        source,
        [
            'className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6"',
            'className="space-y-6 px-6 py-6 sm:px-7"',
        ],
        'className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-5 py-4 sm:px-6"',
        "form body scroll / spacing",
    )

    # ──────────────────────────────────────────────────────────────────────
    # 5) Title input:
    # Compact slightly.
    # ──────────────────────────────────────────────────────────────────────
    source = replace_first_from_list(
        source,
        [
            'className="w-full rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 text-xl font-semibold tracking-tight text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white dark:placeholder:text-white/30 dark:focus:border-violet-400/40 dark:focus:ring-violet-500/15"',
            'className="w-full rounded-2xl border border-slate-200 bg-white/95 px-4 py-4 text-2xl font-semibold tracking-tight text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white dark:placeholder:text-white/30 dark:focus:border-violet-400/40 dark:focus:ring-violet-500/15"',
        ],
        'className="w-full rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 text-lg font-semibold tracking-tight text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white dark:placeholder:text-white/30 dark:focus:border-violet-400/40 dark:focus:ring-violet-500/15"',
        "title input sizing",
    )

    # ──────────────────────────────────────────────────────────────────────
    # 6) Tighten option cards a bit.
    # ──────────────────────────────────────────────────────────────────────
    source = source.replace(
        "rounded-2xl border px-3 py-2.5 text-left shadow-sm transition-all hover:-translate-y-0.5",
        "rounded-2xl border px-3 py-2 text-left shadow-sm transition-all hover:-translate-y-0.5",
    )
    source = source.replace(
        "rounded-2xl border px-4 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5",
        "rounded-2xl border px-3 py-2 text-left shadow-sm transition-all hover:-translate-y-0.5",
    )
    source = source.replace(
        "flex h-8 w-8 items-center justify-center rounded-xl",
        "flex h-7.5 w-7.5 items-center justify-center rounded-xl",
    )

    # ──────────────────────────────────────────────────────────────────────
    # 7) Textarea:
    # Slightly shorter so footer stays reachable.
    # ──────────────────────────────────────────────────────────────────────
    source = replace_first_from_list(
        source,
        [
            'className={`${inputClassName} min-h-[84px] resize-none leading-relaxed`}',
            'className={`${inputClassName} min-h-[104px] resize-none leading-relaxed`}',
        ],
        'className={`${inputClassName} min-h-[72px] resize-none leading-relaxed`}',
        "notes textarea height",
    )

    # ──────────────────────────────────────────────────────────────────────
    # 8) Footer:
    # Keep visible, a little more compact.
    # ──────────────────────────────────────────────────────────────────────
    source = replace_first_from_list(
        source,
        [
            'className="sticky bottom-0 -mx-5 flex flex-col-reverse gap-3 border-t border-slate-200/70 bg-white/90 px-5 pt-4 pb-1 backdrop-blur-md dark:border-white/[0.06] dark:bg-[#101827]/90 sm:-mx-6 sm:flex-row sm:justify-end sm:px-6"',
            'className="flex flex-col-reverse gap-3 border-t border-slate-200/70 pt-5 dark:border-white/[0.06] sm:flex-row sm:justify-end"',
        ],
        'className="sticky bottom-0 -mx-5 flex flex-col-reverse gap-3 border-t border-slate-200/70 bg-white/92 px-5 pt-3.5 pb-1.5 backdrop-blur-md dark:border-white/[0.06] dark:bg-[#101827]/92 sm:-mx-6 sm:flex-row sm:justify-end sm:px-6"',
        "footer layout",
    )

    # ──────────────────────────────────────────────────────────────────────
    # 9) Primary button label:
    # Save to Rhythm -> Add Session
    # ──────────────────────────────────────────────────────────────────────
    if "Save to Rhythm" in source:
        source = source.replace("Save to Rhythm", "Add Session")
        print("[tune_create_session_modal_compact_v2] replaced: primary CTA label")
    elif "Save Session" in source:
        source = source.replace("Save Session", "Add Session")
        print("[tune_create_session_modal_compact_v2] replaced: primary CTA label")
    elif "Create Session" in source:
        source = source.replace("Create Session", "Add Session")
        print("[tune_create_session_modal_compact_v2] replaced: primary CTA label")
    else:
        print("[tune_create_session_modal_compact_v2] warning: no primary CTA label replacement applied")

    # ──────────────────────────────────────────────────────────────────────
    # 10) Ensure Cancel text remains present if already there.
    # We do not inject logic-heavy JSX if not needed; we keep this safe.
    # ──────────────────────────────────────────────────────────────────────
    if "Cancel" not in source:
        print("[tune_create_session_modal_compact_v2] warning: 'Cancel' text not found. No risky JSX insertion attempted.")
    else:
        print("[tune_create_session_modal_compact_v2] confirmed: Cancel CTA exists")

    # Final sanity checks
    post_markers = [
        "max-w-lg",
        "overflow-y-auto",
        "Add Session",
    ]
    for marker in post_markers:
        if marker not in source:
            fail(f'Safety check failed after patch. Missing marker "{marker}".')

    backup_path = TARGET.with_name(f"{TARGET.name}.bak-tune-create-session-modal-v2-{STAMP}")
    backup_path.write_text(original, encoding="utf-8")
    TARGET.write_text(source, encoding="utf-8")

    print(f"[tune_create_session_modal_compact_v2] backup created: {backup_path}")
    print(f"[tune_create_session_modal_compact_v2] patched: {TARGET}")
    print("")
    print("[tune_create_session_modal_compact_v2] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "max-w-lg|max-h-\\[calc\\(100vh-4rem\\)|pt-6 pb-6|Add Session|Cancel|sticky bottom-0" src/calendar/CreateSessionModal.jsx -C 4')
    print("  git diff -- src/calendar/CreateSessionModal.jsx")


if __name__ == "__main__":
    main()
