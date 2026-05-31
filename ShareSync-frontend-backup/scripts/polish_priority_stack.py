from pathlib import Path
from datetime import datetime
import re
import sys

path = Path("src/pages/ProjectHome.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/pages/ProjectHome.jsx")

text = path.read_text()

backup = Path(f"{path}.bak-before-priority-stack-polish-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
backup.write_text(text)
print(f"✅ Backup created: {backup}")

# 1) Add Lucide icons if missing
needed_icons = ["ListOrdered", "ArrowUpRight", "GripVertical", "CircleDot"]

match = re.search(
    r'import\s*\{(?P<body>[\s\S]*?)\}\s*from\s*["\']lucide-react["\'];',
    text
)

if not match:
    raise SystemExit("❌ Could not find lucide-react import block in ProjectHome.jsx")

body = match.group("body")
icons_to_add = [icon for icon in needed_icons if not re.search(rf"\b{icon}\b", body)]

if icons_to_add:
    new_body = body.rstrip()
    if not new_body.rstrip().endswith(","):
        new_body += ","
    new_body += "\n  " + ",\n  ".join(icons_to_add) + ","
    text = text[:match.start("body")] + new_body + text[match.end("body"):]
    print("✅ Added lucide icons:", ", ".join(icons_to_add))
else:
    print("ℹ️ Lucide icons already present.")

# 2) Replace the PriorityStack component safely by brace matching
def replace_function(source, function_name, replacement):
    start = source.find(f"function {function_name}")
    if start == -1:
        raise SystemExit(f"❌ Could not find function {function_name} in ProjectHome.jsx")

    brace_start = source.find("{", start)
    if brace_start == -1:
        raise SystemExit(f"❌ Could not find opening brace for {function_name}")

    depth = 0
    for index in range(brace_start, len(source)):
        char = source[index]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                end = index + 1
                return source[:start] + replacement.strip() + "\n\n" + source[end:]

    raise SystemExit(f"❌ Could not find closing brace for {function_name}")

new_priority_stack = r'''
function PriorityStack({ moves = [] }) {
  const safeMoves = Array.isArray(moves) ? moves.filter(Boolean) : [];
  const topMoves = safeMoves.slice(0, 4);

  const getMoveTitle = (move) => {
    if (typeof move === "string") return move;

    return (
      move?.title ||
      move?.name ||
      move?.taskTitle ||
      move?.label ||
      move?.text ||
      move?.summary ||
      "Untitled priority"
    );
  };

  const getMoveMeta = (move, index) => {
    if (typeof move === "string") return index === 0 ? "Highest leverage move" : "Ranked move";

    return (
      move?.projectName ||
      move?.project?.name ||
      move?.source ||
      move?.status ||
      (index === 0 ? "Highest leverage move" : "Ranked move")
    );
  };

  const getMoveSignal = (move, index) => {
    if (typeof move === "string") return index === 0 ? "Top move" : `Priority ${index + 1}`;

    const rawScore =
      move?.priorityScore ??
      move?.score ??
      move?.impactScore ??
      move?.leverageScore ??
      move?.points;

    if (Number.isFinite(Number(rawScore))) {
      return `${Math.round(Number(rawScore))} signal`;
    }

    return index === 0 ? "Top move" : `Priority ${index + 1}`;
  };

  return (
    <section className="relative overflow-hidden bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm dark:shadow-none">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-violet-500 to-cyan-400" />

      <header className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center shadow-sm">
            <ListOrdered className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Priority Stack
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Ranked execution queue
            </p>
          </div>
        </div>

        <span className="text-xs text-slate-400 dark:text-zinc-500">
          Top moves
        </span>
      </header>

      {topMoves.length > 0 ? (
        <div className="space-y-3">
          {topMoves.map((move, index) => {
            const title = getMoveTitle(move);
            const meta = getMoveMeta(move, index);
            const signal = getMoveSignal(move, index);

            return (
              <article
                key={move?._id || move?.id || `${title}-${index}`}
                className="group relative overflow-hidden rounded-2xl border border-slate-100 dark:border-white/[0.06] bg-slate-50/80 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.05] transition shadow-sm"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-400 via-violet-500 to-cyan-400" />

                <div className="flex items-center gap-4 px-4 py-3 pl-5">
                  <div className="flex items-center gap-2 text-slate-400">
                    <GripVertical className="w-4 h-4 opacity-60" />
                    <span className="w-9 h-9 rounded-xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-xs font-bold text-rose-500">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {title}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                      <span>{meta}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-violet-600 dark:text-violet-300 font-semibold">
                        {signal}
                      </span>
                    </div>
                  </div>

                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-400 group-hover:text-violet-600 transition">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.03] px-5 py-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-400">
            <CircleDot className="w-5 h-5" />
          </div>

          <div>
            <p className="font-semibold text-slate-800 dark:text-white">
              No priority surfaced yet
            </p>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              Add tasks, unblock work, or ship updates to generate a ranked stack.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
'''

text = replace_function(text, "PriorityStack", new_priority_stack)

path.write_text(text)

print("")
print("✅ Priority Stack polished.")
print("✅ Icon changed to ListOrdered.")
print("✅ Card now has ranked rows, visual stack treatment, and stronger hierarchy.")
print("")
print("Inspect:")
print('rg -n "function PriorityStack|ListOrdered|Ranked execution queue|Priority Stack" src/pages/ProjectHome.jsx -C 10')
