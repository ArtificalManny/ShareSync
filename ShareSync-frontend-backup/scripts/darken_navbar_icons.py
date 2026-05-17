from pathlib import Path
from datetime import datetime

path = Path("src/components/Navbar.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/Navbar.jsx")

text = path.read_text()

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".bak-before-navbar-icon-clarity-{stamp}")
backup.write_text(text)
print(f"✅ Backup created: {backup}")

replacements = [
    # Main reusable icon button: messages, dark mode, logout, etc.
    (
        'className={`relative p-2 text-slate-400 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:scale-110 focus-visible:outline-none transition-all duration-200 ${className}`}',
        'className={`relative p-2 text-slate-600 dark:text-zinc-300 hover:text-violet-700 dark:hover:text-violet-300 hover:scale-110 focus-visible:outline-none transition-all duration-200 ${className}`}',
    ),

    # Breadcrumb/page icon at left side of navbar.
    (
        '<Layout className="w-4 h-4 text-slate-400 dark:text-zinc-500" />',
        '<Layout className="w-4 h-4 text-slate-600 dark:text-zinc-300" />',
    ),

    # Breadcrumb chevron.
    (
        '<ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-600" />',
        '<ChevronRight className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />',
    ),

    # Search icon.
    (
        '<Search className="absolute left-3 top-1/2 -translate-y-1/2 mt-[1.5px] w-4 h-4 text-slate-400 dark:text-zinc-500 group-focus-within:text-violet-500 transition-colors duration-200" />',
        '<Search className="absolute left-3 top-1/2 -translate-y-1/2 mt-[1.5px] w-4 h-4 text-slate-500 dark:text-zinc-400 group-focus-within:text-violet-600 dark:group-focus-within:text-violet-300 transition-colors duration-200" />',
    ),

    # Search input placeholder/readability.
    (
        'text-slate-800 placeholder:text-slate-400',
        'text-slate-900 placeholder:text-slate-500',
    ),
    (
        'dark:text-zinc-100 dark:placeholder:text-zinc-500',
        'dark:text-zinc-100 dark:placeholder:text-zinc-400',
    ),

    # Quick Notes button text.
    (
        'className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:bg-white/70 hover:text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:text-zinc-300 dark:hover:bg-white/[0.07] dark:hover:text-violet-300"',
        'className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-bold text-slate-700 transition-all duration-200 hover:bg-white/70 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:text-zinc-200 dark:hover:bg-white/[0.07] dark:hover:text-violet-300"',
    ),

    # Quick Notes icon.
    (
        '<StickyNote className="h-4 w-4 text-violet-500 dark:text-violet-400" />',
        '<StickyNote className="h-4 w-4 text-violet-700 dark:text-violet-300" />',
    ),
]

changed = 0

for old, new in replacements:
    if old in text:
        text = text.replace(old, new, 1)
        changed += 1
    else:
        print(f"⚠️ Could not find exact match:\n{old[:120]}...\n")

path.write_text(text)

print(f"✅ Navbar clarity patch complete. Replacements made: {changed}/{len(replacements)}")
print("")
print("Inspect:")
print('rg -n "IconButton|Layout className|ChevronRight|Search className|Quick Notes|StickyNote" src/components/Navbar.jsx -C 3')
