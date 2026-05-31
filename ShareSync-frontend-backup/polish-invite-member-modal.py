from pathlib import Path
import shutil
from datetime import datetime

path = Path("src/components/members/InviteMember.jsx")

if not path.exists():
    raise FileNotFoundError(f"Could not find {path}")

text = path.read_text()

backup = path.with_suffix(
    path.suffix + f".backup-before-invite-member-polish-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
)
shutil.copy2(path, backup)

changed = []

def fail(message):
    shutil.copy2(backup, path)
    raise RuntimeError(message + f"\nOriginal restored. Backup kept at: {backup}")

old_overlay = 'className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"'
new_overlay = 'className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-4 pt-16 backdrop-blur-md sm:pt-20"'

if old_overlay not in text:
    fail("Could not find the modal overlay class.")

text = text.replace(old_overlay, new_overlay, 1)
changed.append("Moved modal down slightly and allowed vertical scrolling")

old_card = 'className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 max-w-lg w-full shadow-2xl"'
new_card = 'className="relative max-h-[calc(100vh-7rem)] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-violet-400/40 bg-slate-950/95 p-6 shadow-[0_34px_110px_rgba(15,23,42,0.65)] ring-1 ring-white/10"'

if old_card not in text:
    fail("Could not find the modal card class.")

text = text.replace(old_card, new_card, 1)
changed.append("Gave modal card stronger premium shell styling")

old_after_card = '''<div className="relative max-h-[calc(100vh-7rem)] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-violet-400/40 bg-slate-950/95 p-6 shadow-[0_34px_110px_rgba(15,23,42,0.65)] ring-1 ring-white/10">
        
        {/* Header */}'''

new_after_card = '''<div className="relative max-h-[calc(100vh-7rem)] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-violet-400/40 bg-slate-950/95 p-6 shadow-[0_34px_110px_rgba(15,23,42,0.65)] ring-1 ring-white/10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-10 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl" />
        
        {/* Header */}'''

if old_after_card not in text:
    fail("Could not insert modal glow layers.")

text = text.replace(old_after_card, new_after_card, 1)
changed.append("Added top gradient rail and subtle glow effects")

old_header = '''        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Invite Members</h2>
              <p className="text-sm text-slate-400">{projectName}</p>
            </div>
          </div>'''

new_header = '''        <div className="relative z-10 mb-7 flex items-start justify-between">
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
          </div>'''

if old_header not in text:
    fail("Could not find the existing Invite Members header block.")

text = text.replace(old_header, new_header, 1)
changed.append("Made Invite Members header more visually striking")

path.write_text(text)

print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed:")
for item in changed:
    print(f"- {item}")
print("")
print("Kept intact:")
print("- Email invite logic")
print("- Share Invite Link logic")
print("- Copy button logic")
print("- ProjectHome.jsx")
print("- Backend/API logic")
