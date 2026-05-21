from pathlib import Path
from datetime import datetime

path = Path("src/pages/ProjectHome.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/pages/ProjectHome.jsx")

text = path.read_text()
backup = path.with_name(
    f"ProjectHome.jsx.bak-before-whats-blocked-polish-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)

def extract_attr_value(block, attr_name):
    needle = f"{attr_name}="
    idx = block.find(needle)
    if idx == -1:
        return None

    i = idx + len(needle)

    while i < len(block) and block[i].isspace():
        i += 1

    if i >= len(block):
        return None

    if block[i] == "{":
        start = i
        depth = 0
        in_string = None
        escape = False

        for j in range(i, len(block)):
            ch = block[j]

            if escape:
                escape = False
                continue

            if ch == "\\":
                escape = True
                continue

            if in_string:
                if ch == in_string:
                    in_string = None
                continue

            if ch in ("'", '"', "`"):
                in_string = ch
                continue

            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return block[start:j + 1]

    if block[i] in ("'", '"'):
        quote = block[i]
        start = i
        j = i + 1
        while j < len(block):
            if block[j] == quote and block[j - 1] != "\\":
                return block[start:j + 1]
            j += 1

    j = i
    while j < len(block) and not block[j].isspace():
        j += 1

    return block[i:j]

changed = 0

if "function BlockedSignalCard(" not in text:
    marker = "function OverviewSignalCard({"
    if marker not in text:
        raise SystemExit("❌ Could not find function OverviewSignalCard.")

    blocked_card = r'''
function BlockedSignalCard({ blockedLabel, caption }) {
  const safeBlockedLabel = String(blockedLabel || "0 blockers").trim();
  const match = safeBlockedLabel.match(/\d+/);
  const blockerCount = match ? Number(match[0]) : 0;

  const severity =
    blockerCount >= 10 ? "Critical" : blockerCount > 0 ? "Needs review" : "Clear";

  const severityClasses =
    blockerCount >= 10
      ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
      : blockerCount > 0
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
        : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300";

  const cardTint =
    blockerCount >= 10
      ? "from-rose-500 via-orange-400 to-amber-300"
      : blockerCount > 0
        ? "from-amber-400 via-orange-400 to-rose-400"
        : "from-emerald-400 via-cyan-400 to-violet-500";

  const readout =
    blockerCount > 0
      ? "Execution friction is constraining momentum."
      : "No active blockers are currently constraining execution.";

  return (
    <section className="group relative overflow-hidden rounded-[28px] border border-amber-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-[1px] hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/10 dark:border-amber-500/20 dark:bg-[#111113] dark:shadow-none">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${cardTint}`} />
      <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-8 h-40 w-40 rounded-full bg-rose-400/10 blur-3xl" />

      <div className="relative p-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>

              <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white bg-amber-400 dark:border-[#111113]" />
            </div>

            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
                  What’s blocked
                </p>

                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${severityClasses}`}>
                  {severity}
                </span>
              </div>

              <h3 className="max-w-[360px] truncate text-xl font-black tracking-tight text-slate-950 dark:text-white">
                {safeBlockedLabel}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-zinc-400">
                {caption}
              </p>
            </div>
          </div>

          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-white text-lg font-black text-amber-700 shadow-sm dark:border-amber-500/20 dark:bg-white/[0.03] dark:text-amber-300 sm:flex">
            {blockerCount}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400 dark:text-zinc-500">
                Blocker signal
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-zinc-200">
                {readout}
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

'''
    text = text.replace(marker, blocked_card + "\n" + marker, 1)
    changed += 1

view_start = text.find("function OverviewView(")
if view_start == -1:
    raise SystemExit("❌ Could not find function OverviewView.")

label_candidates = [
    'label="What’s blocked"',
    'label="What\\’s blocked"',
    'label="What\'s blocked"',
    'label="What’s Blocked"',
    'label="What\'s Blocked"',
]

label_index = -1
for candidate in label_candidates:
    label_index = text.find(candidate, view_start)
    if label_index != -1:
        break

if label_index == -1:
    raise SystemExit('❌ Could not find the What’s blocked label inside OverviewView.')

block_start = text.rfind("<OverviewSignalCard", view_start, label_index)
if block_start == -1:
    raise SystemExit("❌ Could not find opening OverviewSignalCard for What’s blocked.")

block_end = text.find("/>", label_index)
if block_end == -1:
    raise SystemExit("❌ Could not find closing /> for What’s blocked card.")

block_end += 2
old_block = text[block_start:block_end]

value_attr = extract_attr_value(old_block, "value") or '"0 blockers"'
caption_attr = extract_attr_value(old_block, "caption") or '"Resolve blockers fast to protect momentum"'

replacement = f'''<BlockedSignalCard
            blockedLabel={value_attr}
            caption={caption_attr}
          />'''

text = text[:block_start] + replacement + text[block_end:]
changed += 1

path.write_text(text)

print("")
print("✅ What’s blocked card visually polished.")
print(f"✅ Changes: {changed}")
print(f"✅ Backup created: {backup}")
print("")
print("Inspect:")
print('rg -n "function BlockedSignalCard|BlockedSignalCard|Blocker signal|What’s blocked|label=\\"What’s blocked\\"" src/pages/ProjectHome.jsx -C 10')
