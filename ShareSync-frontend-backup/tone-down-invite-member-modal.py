from pathlib import Path
import shutil
from datetime import datetime

path = Path("src/components/members/InviteMember.jsx")

if not path.exists():
    raise FileNotFoundError(f"Could not find {path}")

text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".backup-before-invite-member-tonedown-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
shutil.copy2(path, backup)

changed = []

def replace_required(old, new, label):
    global text
    if old not in text:
        shutil.copy2(backup, path)
        raise RuntimeError(
            f"Could not find expected block for: {label}\n"
            f"Original restored. Backup kept at: {backup}"
        )
    text = text.replace(old, new, 1)
    changed.append(label)

# 1) Keep it slightly lower, but reduce the heavy blur/washed overlay
replace_required(
    'className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-4 pt-16 backdrop-blur-md sm:pt-20"',
    'className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-10 backdrop-blur-sm sm:pt-12"',
    "Reduced overlay heaviness and kept modal slightly lower"
)

# 2) Make the modal card solid/dark again, less glassy
replace_required(
    'className="relative max-h-[calc(100vh-7rem)] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-violet-400/40 bg-slate-950/95 p-6 shadow-[0_34px_110px_rgba(15,23,42,0.65)] ring-1 ring-white/10"',
    'className="relative max-h-[calc(100vh-5.5rem)] w-full max-w-lg overflow-y-auto rounded-[1.75rem] border border-violet-500/35 bg-slate-950 p-6 shadow-2xl ring-1 ring-white/10"',
    "Restored stronger dark modal contrast"
)

# 3) Remove the extra big glow blobs, keep only the top accent rail
replace_required(
'''        <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-10 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl" />''',
'''        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />''',
    "Removed oversized glow effects"
)

# 4) Tone down the header while keeping it more premium than before
replace_required(
'''        <div className="relative z-10 mb-7 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-600 shadow-[0_18px_45px_rgba(14,165,233,0.35)] ring-1 ring-white/20">
              <div className="absolute inset-0 rounded-2xl bg-white/15" />
              <UserPlus className="relative z-10 w-7 h-7 text-white" />
            </div>
            <div className="pt-0.5">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
                Share Access
              </div>
              <h2 className="text-[2rem] font-black leading-none tracking-tight">
                <span className="bg-gradient-to-r from-white via-cyan-100 to-violet-200 bg-clip-text text-transparent">
                  Invite Members
                </span>
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-400">{projectName}</p>
            </div>
          </div>''',
'''        <div className="relative z-10 mb-6 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-cyan-500/20 ring-1 ring-white/15">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Share Access
              </div>
              <h2 className="text-3xl font-black leading-tight tracking-tight text-white">
                Invite Members
              </h2>
              <p className="text-sm text-slate-400">{projectName}</p>
            </div>
          </div>''',
    "Toned down Invite Members header"
)

path.write_text(text)

print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed:")
for item in changed:
    print(f"- {item}")
print("")
print("Kept intact:")
print("- Invite by email")
print("- Role buttons")
print("- Share invite link")
print("- Copy button")
print("- Backend/API logic")
