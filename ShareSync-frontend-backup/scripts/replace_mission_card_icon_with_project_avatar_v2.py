from pathlib import Path
from datetime import datetime

path = Path("src/components/home/MissionCard.jsx")
text = path.read_text()

backup = path.with_suffix(path.suffix + f".bak-before-mission-avatar-v2-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
backup.write_text(text)
print(f"✅ Backup created: {backup}")

if "import ProjectAvatar from \"../project/ProjectAvatar\";" not in text:
    text = text.replace(
        'import FocusBlockBadge from "../focus/FocusBlockBadge";',
        'import FocusBlockBadge from "../focus/FocusBlockBadge";\nimport ProjectAvatar from "../project/ProjectAvatar";',
        1,
    )

if "function getMissionProjectForAvatar" not in text:
    helper = '''
function getMissionProjectForAvatar(project) {
  const raw = project?.raw || {};
  const logoUrl =
    project?.logoUrl ||
    project?.logo ||
    project?.picture ||
    project?.avatarUrl ||
    project?.imageUrl ||
    raw?.logoUrl ||
    raw?.logo ||
    raw?.picture ||
    raw?.avatarUrl ||
    raw?.imageUrl ||
    "";

  return {
    ...raw,
    ...project,
    id: project?.id || project?._id || project?.projectId || raw?.id || raw?._id,
    _id: project?._id || project?.id || project?.projectId || raw?._id || raw?.id,
    name: project?.name || project?.title || raw?.name || raw?.title,
    title: project?.title || project?.name || raw?.title || raw?.name,
    logoUrl,
    logo: project?.logo || raw?.logo || logoUrl,
    picture: project?.picture || raw?.picture || logoUrl,
    avatarUrl: project?.avatarUrl || raw?.avatarUrl || logoUrl,
    imageUrl: project?.imageUrl || raw?.imageUrl || logoUrl,
  };
}

'''
    text = text.replace("function clampPercent(value) {", helper + "function clampPercent(value) {", 1)

old_block = '''            <div
              className={`
                w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                transition-all duration-300
                ${
                  isThisShipped
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : isThisShipping
                      ? "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"
                      : isPriorityMission
                        ? "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300 group-hover:bg-white dark:group-hover:bg-zinc-700 group-hover:shadow-md group-hover:scale-110"
                        : "bg-slate-50 dark:bg-zinc-800 group-hover:bg-white dark:group-hover:bg-zinc-700 group-hover:shadow-md group-hover:scale-110 group-hover:text-blue-500 text-slate-500"
                }
              `}
            >
              {isThisShipped ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : isThisShipping ? (
                <Rocket className="w-4 h-4 animate-pulse" />
              ) : isPriorityMission ? (
                <Target className="w-4 h-4" />
              ) : (
                <span className="text-lg transition-colors duration-300">
                  {project?.emoji || "◎"}
                </span>
              )}
            </div>'''

new_block = '''            <div
              className={`
                relative shrink-0 transition-all duration-300
                ${
                  isThisShipped || isThisShipping
                    ? "scale-105"
                    : "group-hover:scale-110"
                }
              `}
            >
              <ProjectAvatar
                project={getMissionProjectForAvatar(project)}
                size="md"
                className="shrink-0"
                title={`${title || "Project"} logo`}
              />

              {(isThisShipped || isThisShipping || isPriorityMission) && (
                <span
                  className={`
                    absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white shadow-sm
                    ${
                      isThisShipped
                        ? "bg-emerald-500 text-white"
                        : isThisShipping
                          ? "bg-violet-500 text-white"
                          : "bg-white text-violet-600"
                    }
                  `}
                >
                  {isThisShipped ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : isThisShipping ? (
                    <Rocket className="h-3 w-3 animate-pulse" />
                  ) : (
                    <Target className="h-3 w-3" />
                  )}
                </span>
              )}
            </div>'''

if old_block not in text:
    raise SystemExit("❌ Could not find the exact old MissionCard icon block. No changes written.")

text = text.replace(old_block, new_block, 1)

path.write_text(text)

print("✅ MissionCard now renders ProjectAvatar beside the project name.")
print("✅ Uploaded project logo should appear for Snicker's bar.")
print("✅ Shipping/check/priority indicators now appear as small overlay badges.")
print("")
print("Inspect with:")
print("rg -n \"ProjectAvatar|getMissionProjectForAvatar|CheckCircle2|Rocket|Target\" src/components/home/MissionCard.jsx -C 5")
