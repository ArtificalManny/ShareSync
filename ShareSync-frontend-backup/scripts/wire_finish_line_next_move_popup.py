from pathlib import Path
import re
import sys

path = Path("src/components/project/pulse/card/FinishLineCard.jsx")

if not path.exists():
    raise SystemExit(f"❌ File not found: {path}")

text = path.read_text()
original = text

backup = path.with_suffix(".jsx.bak-before-next-move-popup-script")
backup.write_text(text)

changed = 0

# 1) Ensure useState import exists.
react_import = re.search(
    r'import\s+React\s*(?:,\s*\{(?P<hooks>[^}]*)\})?\s+from\s+["\']react["\'];',
    text,
)

if not react_import:
    raise SystemExit("❌ Could not find React import.")

hooks = react_import.group("hooks")

if hooks is None:
    text = text[:react_import.start()] + 'import React, { useState } from "react";' + text[react_import.end():]
    changed += 1
elif "useState" not in hooks:
    hook_list = [h.strip() for h in hooks.split(",") if h.strip()]
    hook_list.append("useState")
    new_import = f'import React, {{ {", ".join(hook_list)} }} from "react";'
    text = text[:react_import.start()] + new_import + text[react_import.end():]
    changed += 1

# 2) Add optional onNextMoveClick prop.
sig_pattern = re.compile(
    r'export\s+default\s+function\s+FinishLineCard\s*\(\s*\{\s*finishLine\s*,\s*onPrimaryAction\s*\}\s*\)\s*\{'
)

if sig_pattern.search(text):
    text = sig_pattern.sub(
        'export default function FinishLineCard({ finishLine, onPrimaryAction, onNextMoveClick }) {',
        text,
        count=1,
    )
    changed += 1
elif "onNextMoveClick" not in text:
    print("⚠️ Could not update function signature automatically. Inspect manually.")
    print('rg -n "export default function FinishLineCard" src/components/project/pulse/card/FinishLineCard.jsx -C 4')

# 3) Add modal/click state and click handler.
if "handleNextMoveClick" not in text:
    marker = "  const primaryActionLabel = getPrimaryActionLabel(finishLine);\n"

    if marker not in text:
        raise SystemExit(
            "❌ Could not find primaryActionLabel line. Run:\n"
            'rg -n "primaryActionLabel|getPrimaryActionLabel|recommendedChipLabel" '
            "src/components/project/pulse/card/FinishLineCard.jsx -C 8"
        )

    insert = """
  const [isNextMoveOpen, setIsNextMoveOpen] = useState(false);

  const nextMove = finishLine?.nextMove || null;
  const nextMoveTitle =
    nextMove?.title ||
    nextMove?.name ||
    recommendedChipLabel ||
    "Next move";

  const nextMoveDescription =
    nextMove?.description ||
    nextMove?.summary ||
    recommendedText ||
    "Review the recommended next move for this project.";

  const nextMoveMeta = [
    nextMove?.status,
    nextMove?.priority,
    nextMove?.type,
  ]
    .filter(Boolean)
    .join(" • ");

  const handleNextMoveClick = () => {
    if (typeof onNextMoveClick === "function") {
      onNextMoveClick(nextMove || finishLine);
      return;
    }

    if (typeof onPrimaryAction === "function") {
      onPrimaryAction(finishLine);
      return;
    }

    setIsNextMoveOpen(true);
  };
"""

    text = text.replace(marker, marker + insert, 1)
    changed += 1

# 4) Convert the recommended chip from div to button.
if "onClick={handleNextMoveClick}" not in text:
    marker = "<span>{recommendedChipLabel}</span>"

    idx = text.find(marker)

    if idx == -1:
        raise SystemExit(
            "❌ Could not find recommendedChipLabel chip. Run:\n"
            'rg -n "recommendedChipLabel|Next move|Recommended Next Move|ArrowRight" '
            "src/components/project/pulse/card/FinishLineCard.jsx -C 12"
        )

    start = text.rfind("<div", 0, idx)
    end = text.find("</div>", idx)

    if start == -1 or end == -1:
        raise SystemExit("❌ Could not isolate the current Next move chip wrapper.")

    end += len("</div>")
    old_chip = text[start:end]

    if "recommendedChipLabel" not in old_chip or "ArrowRight" not in old_chip:
        raise SystemExit(
            "❌ Found a nearby div, but it does not look like the Next move chip.\n"
            "Run:\n"
            'rg -n "recommendedChipLabel|ArrowRight|Next move" '
            "src/components/project/pulse/card/FinishLineCard.jsx -C 16"
        )

    new_chip = """<button
                type="button"
                onClick={handleNextMoveClick}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:-translate-y-[1px] hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:border-violet-400/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-200"
              >
                <ArrowRight className="h-3.5 w-3.5" />
                <span>{recommendedChipLabel}</span>
              </button>"""

    text = text[:start] + new_chip + text[end:]
    changed += 1

# 5) Add fallback local popup before closing section.
if "isNextMoveOpen ?" not in text:
    modal = """
      {isNextMoveOpen ? (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Recommended next move"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            aria-label="Close recommended next move"
            onClick={() => setIsNextMoveOpen(false)}
          />

          <div className="relative w-full max-w-xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl dark:border-white/[0.08] dark:bg-[#111113]">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />

            <div className="p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-violet-500">
                    Recommended next move
                  </p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                    {nextMoveTitle}
                  </h3>
                  {nextMoveMeta ? (
                    <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                      {nextMoveMeta}
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => setIsNextMoveOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-zinc-300"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <p className="text-sm leading-6 text-slate-700 dark:text-zinc-300">
                  {nextMoveDescription}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNextMoveOpen(false)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-zinc-300"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsNextMoveOpen(false);
                    onPrimaryAction?.(finishLine);
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 via-cyan-500 to-emerald-500 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01]"
                >
                  <span>Open finish readiness</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
"""

    close_idx = text.rfind("\n    </section>\n  );")

    if close_idx == -1:
        raise SystemExit(
            "❌ Could not find closing section for FinishLineCard. Run:\n"
            "tail -80 src/components/project/pulse/card/FinishLineCard.jsx"
        )

    text = text[:close_idx] + "\n" + modal + text[close_idx:]
    changed += 1

path.write_text(text)

print("")
print(f"✅ Finish Line Next Move popup wiring complete. Changes: {changed}")
print(f"✅ Backup created: {backup}")
print("")
print("Inspect:")
print('rg -n "onNextMoveClick|handleNextMoveClick|isNextMoveOpen|recommendedChipLabel|Open finish readiness" src/components/project/pulse/card/FinishLineCard.jsx -C 8')
