from pathlib import Path
import sys

ROOT = Path.cwd()
PROFILE = ROOT / "src/pages/Profile.jsx"

OLD_BLOCK = """          {/* Behavioral Analysis */}
          <div 
            className="p-6 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10"
            style={{ boxShadow: '0 4px 24px rgba(139, 92, 246, 0.06)' }}
          >
            <div className="flex items-center gap-2 mb-8">
              <Brain className="w-4 h-4 text-violet-500" />
              <h3 className="text-sm font-medium text-slate-600 dark:text-zinc-300">Behavioral Analysis</h3>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {profileAnalytics?.collaborationStyle && (
                <CollaborationStyleCard data={profileAnalytics.collaborationStyle} />
              )}
              {profileAnalytics?.roleClassification && (
                <RoleClassificationCard data={profileAnalytics.roleClassification} />
              )}
            </div>
            <div className="mt-10 pt-8 border-t border-slate-100 dark:border-white/5">
              {user && <WorkPersonality userId={user._id || user.id} />}
            </div>
          </div>"""

NEW_BLOCK = """          {/* Behavioral Analysis */}
          <div
            className="p-6 rounded-xl bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10"
            style={{ boxShadow: '0 4px 24px rgba(139, 92, 246, 0.06)' }}
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-violet-500" />
                <h3 className="text-sm font-medium text-slate-600 dark:text-zinc-300">Behavioral Analysis</h3>
              </div>

              <span className="rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
                Live Profile
              </span>
            </div>

            {(profileAnalytics?.collaborationStyle || profileAnalytics?.roleClassification) && (
              <div className="grid grid-cols-1 gap-6 mb-5">
                {profileAnalytics?.collaborationStyle && (
                  <CollaborationStyleCard data={profileAnalytics.collaborationStyle} />
                )}
                {profileAnalytics?.roleClassification && (
                  <RoleClassificationCard data={profileAnalytics.roleClassification} />
                )}
              </div>
            )}

            <div
              className={
                profileAnalytics?.collaborationStyle || profileAnalytics?.roleClassification
                  ? "pt-5 border-t border-slate-100 dark:border-white/5"
                  : ""
              }
            >
              {user && (
                <WorkPersonality
                  userId={user._id || user.id}
                  profile={skillProfile}
                />
              )}
            </div>
          </div>"""

def fail(message):
    print(f"\\n[tighten_profile_behavioral_analysis_layout] ERROR: {message}\\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[tighten_profile_behavioral_analysis_layout] starting")

    if not PROFILE.exists():
        fail(f"Could not find {PROFILE}")

    source = PROFILE.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "export default function Profile",
        "{/* Behavioral Analysis */}",
        "CollaborationStyleCard",
        "RoleClassificationCard",
        "WorkPersonality",
        "useGrowthTrack(userId)",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Expected marker not found before patch: {marker}. No changes were written.")

    if "Live Profile" in source and "profile={skillProfile}" in source:
        print("[tighten_profile_behavioral_analysis_layout] Behavioral Analysis layout already appears tightened")
        return

    if OLD_BLOCK not in source:
        fail("Could not find exact Behavioral Analysis block. No changes were written.")

    source = source.replace(OLD_BLOCK, NEW_BLOCK, 1)

    required_after = [
        "Live Profile",
        "profile={skillProfile}",
        "profileAnalytics?.collaborationStyle || profileAnalytics?.roleClassification",
        "pt-5 border-t border-slate-100 dark:border-white/5",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed. Missing marker after patch: {marker}")

    if source == original:
        print("[tighten_profile_behavioral_analysis_layout] no changes needed")
        return

    backup = PROFILE.with_suffix(PROFILE.suffix + ".bak-behavioral-layout-tighten")
    if not backup.exists():
        backup.write_text(original, encoding="utf-8")
        print(f"[tighten_profile_behavioral_analysis_layout] backup created: {backup}")

    PROFILE.write_text(source, encoding="utf-8")
    print(f"[tighten_profile_behavioral_analysis_layout] patched: {PROFILE}")

    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"Behavioral Analysis|Live Profile|profile=\\{skillProfile\\}|WorkPersonality|pt-5 border-t\" src/pages/Profile.jsx")
    print("  git diff -- src/pages/Profile.jsx")

if __name__ == "__main__":
    main()
