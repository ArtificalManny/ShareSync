from pathlib import Path
import shutil
import datetime

path = Path("src/components/subscription/SubscriptionButton.jsx")
backup = path.with_suffix(path.suffix + f".backup-before-paid-header-polish-{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}")

if not path.exists():
    raise RuntimeError("Could not find src/components/subscription/SubscriptionButton.jsx")

text = path.read_text()
shutil.copy2(path, backup)

old = """                <div>
                  <span className="block text-sm font-bold text-slate-800 dark:text-white">
                    {planLabel} Plan
                  </span>
                  <span className="block text-[10px] font-medium text-slate-400 dark:text-zinc-500">
                    {isPremium ? 'Premium limits unlocked' : refreshAgeLabel}
                  </span>
                </div>
"""

new = """                {isPremium ? (
                  <div className="min-w-0 max-w-[205px] rounded-2xl border border-amber-200/80 bg-white/95 px-3 py-2 shadow-sm ring-1 ring-white/70 dark:border-amber-400/30 dark:bg-[#0b1020]/95 dark:ring-amber-300/10">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-black text-slate-950 dark:text-white">
                        {planLabel} Plan
                      </span>

                      <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-200">
                        Active
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-amber-700 dark:text-amber-200">
                      <ShieldCheck className="h-3 w-3 shrink-0" />
                      <span>Premium limits unlocked</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="block text-sm font-bold text-slate-800 dark:text-white">
                      {planLabel} Plan
                    </span>

                    <span className="block text-[10px] font-medium text-slate-400 dark:text-zinc-500">
                      {refreshAgeLabel}
                    </span>
                  </div>
                )}
"""

if old not in text:
    raise RuntimeError(
        "Could not find the subscription dropdown title block. Run:\\n"
        "grep -n -B 8 -A 14 \"Premium limits unlocked\" src/components/subscription/SubscriptionButton.jsx"
    )

text = text.replace(old, new, 1)
path.write_text(text)

print("✅ Subscription dropdown paid header polished.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed:")
print("- Merged Team Plan + Premium limits unlocked into one paid-status block")
print("- Made Team Plan much more readable in dark mode")
print("- Added an Active pill inside the paid-plan block")
print("- Free-plan dropdown behavior remains separate and unchanged")
print("")
print("Next:")
print("1. Stop Vite with Control+C")
print("2. Restart: npm run dev")
print("3. Hard refresh Chrome: Cmd+Shift+R")
