from pathlib import Path
from datetime import datetime

path = Path("src/pages/ProjectHome.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/pages/ProjectHome.jsx")

text = path.read_text()
backup = path.with_name(
    f"ProjectHome.jsx.bak-before-who-owns-it-polish-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
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

    # Fallback: read until whitespace/newline.
    j = i
    while j < len(block) and not block[j].isspace():
        j += 1
    return block[i:j]

changed = 0

# 1) Insert the dedicated OwnerSignalCard before OverviewSignalCard.
if "function OwnerSignalCard(" not in text:
    marker = "function OverviewSignalCard({"
    if marker not in text:
        raise SystemExit("❌ Could not find function OverviewSignalCard.")

    owner_card = r'''
function OwnerSignalCard({ ownerName, caption }) {
  const safeOwnerName = String(ownerName || "").trim() || "Project owner";
  const initials =
    safeOwnerName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "PO";

  return (
    <section className="group relative overflow-hidden rounded-[28px] border border-emerald-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-[1px] hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/10 dark:border-emerald-500/20 dark:bg-[#111113] dark:shadow-none">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-500" />
      <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-8 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative p-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
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
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>

              <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-400 dark:border-[#111113]" />
            </div>

            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
                  Who owns it
                </p>

                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                  Owner
                </span>
              </div>

              <h3 className="max-w-[360px] truncate text-xl font-black tracking-tight text-slate-950 dark:text-white">
                {safeOwnerName}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-zinc-400">
                {caption}
              </p>
            </div>
          </div>

          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-black text-emerald-700 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-emerald-300 sm:flex">
            {initials}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400 dark:text-zinc-500">
                Ownership signal
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-zinc-200">
                Clear project accountability is assigned.
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
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
                <path d="m3 11 4-8 4 8" />
                <path d="m13 11 4-8 4 8" />
                <path d="M7 11v10" />
                <path d="M17 11v10" />
                <path d="M3 21h18" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

'''
    text = text.replace(marker, owner_card + "\n" + marker, 1)
    changed += 1

# 2) Replace only the generic OverviewSignalCard with label="Who owns it".
view_start = text.find("function OverviewView(")
if view_start == -1:
    raise SystemExit("❌ Could not find function OverviewView.")

label_index = text.find('label="Who owns it"', view_start)
if label_index == -1:
    raise SystemExit('❌ Could not find label="Who owns it" inside OverviewView.')

block_start = text.rfind("<OverviewSignalCard", view_start, label_index)
if block_start == -1:
    raise SystemExit("❌ Could not find opening OverviewSignalCard for Who owns it.")

block_end = text.find("/>", label_index)
if block_end == -1:
    raise SystemExit("❌ Could not find closing /> for Who owns it card.")

block_end += 2
old_block = text[block_start:block_end]

value_attr = extract_attr_value(old_block, "value") or '"Project owner"'
caption_attr = extract_attr_value(old_block, "caption") or '"Ownership and live team presence"'

replacement = f'''<OwnerSignalCard
            ownerName={value_attr}
            caption={caption_attr}
          />'''

text = text[:block_start] + replacement + text[block_end:]
changed += 1

path.write_text(text)

print("")
print("✅ Who owns it card visually polished.")
print(f"✅ Changes: {changed}")
print(f"✅ Backup created: {backup}")
print("")
print("Inspect:")
print('rg -n "function OwnerSignalCard|Ownership signal|Who owns it|OwnerSignalCard|label=\\"Who owns it\\"" src/pages/ProjectHome.jsx -C 10')
