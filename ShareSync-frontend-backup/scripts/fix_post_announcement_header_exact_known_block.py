from pathlib import Path
from datetime import datetime

path = Path("src/components/views/AnnouncementsView.jsx")

if not path.exists():
    raise SystemExit("❌ Could not find src/components/views/AnnouncementsView.jsx")

text = path.read_text()
original = text

backup = path.with_suffix(
    path.suffix + f".bak-before-known-post-announcement-header-fix-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
backup.write_text(text)
print(f"✅ Backup created: {backup}")

old = """            <div className="relative overflow-hidden border-b border-slate-200 bg-white">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(124,58,237,0.16),transparent_35%),radial-gradient(circle_at_90%_20%,rgba(20,184,166,0.10),transparent_32%)]" />

              <div className="relative flex items-center justify-between gap-4 px-8 py-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-violet-600 shadow-xl shadow-violet-500/30">
                    <Megaphone className="h-6 w-6 text-white" />
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-700">
                      Team Broadcast
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                      Post Announcement
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Visible to all project members
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowCreate(false)}
                  className="rounded-2xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>"""

new = """            <div className="border-b border-slate-200/80 bg-white">
              <div className="flex items-center justify-between gap-5 px-8 py-5">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-500/25">
                    <Megaphone className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-700">
                      Team Broadcast
                    </p>
                    <h2 className="mt-1 text-2xl font-black leading-none tracking-tight text-slate-950">
                      Post Announcement
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                  aria-label="Close post announcement modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>"""

if old not in text:
    print("❌ Exact old header block was not found. No changes written.")
    print("")
    print("Run this and paste the output if needed:")
    print("sed -n '790,830p' src/components/views/AnnouncementsView.jsx")
    raise SystemExit("No changes written.")

fixed = text.replace(old, new, 1)

# Safety checks
if fixed.count("export default function AnnouncementsView") != 1:
    raise SystemExit("❌ Safety check failed: AnnouncementsView export count changed. No changes written.")

if fixed.count("Post Announcement") != 1:
    raise SystemExit("❌ Safety check failed: Post Announcement count changed. No changes written.")

if fixed.count("Team Broadcast") != 1:
    raise SystemExit("❌ Safety check failed: Team Broadcast count changed. No changes written.")

if "aria-label=\"Close post announcement modal\"" not in fixed:
    raise SystemExit("❌ Safety check failed: close aria-label missing. No changes written.")

path.write_text(fixed)

print("✅ Post Announcement header fixed using exact known block.")
print("✅ Removed the radial-gradient background behind the title.")
print("✅ Tightened icon/title/close alignment.")
print("✅ Backend untouched.")
print("")
print("Inspect with:")
print("sed -n '790,830p' src/components/views/AnnouncementsView.jsx")
