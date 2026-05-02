from pathlib import Path
from datetime import datetime
import shutil

TARGET = Path("src/pages/ProjectHome.jsx")
BACKUP_GLOB = "ProjectHome.jsx.bak.before-project-home-live-activity-actor-*"

NEW_BLOCK = r'''// PROJECT LIVE ACTIVITY ACTOR BRIDGE
function projectPulseNormalizeAvatarSrc(value) {
  if (!value || typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }

  return `/${trimmed.replace(/^\/+/, "")}`;
}

function projectPulseIsGenericActorName(value) {
  const text = String(value || "").trim().toLowerCase();

  return (
    !text ||
    text === "someone" ||
    text === "team member" ||
    text === "project member" ||
    text === "unknown" ||
    text === "user"
  );
}

function projectPulseGetPersonName(value) {
  if (!value) return "";

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || /^[a-f\d]{24}$/i.test(trimmed)) return "";
    return trimmed;
  }

  if (typeof value !== "object") return "";

  const nested = value.user || value.member || value.profile || value.account || null;
  const fullName = [value.firstName, value.lastName].filter(Boolean).join(" ").trim();

  return (
    value.name ||
    value.fullName ||
    value.displayName ||
    fullName ||
    value.username ||
    value.email ||
    projectPulseGetPersonName(nested) ||
    ""
  );
}

function projectPulseGetPersonAvatar(value) {
  if (!value || typeof value !== "object") return null;

  const nested = value.user || value.member || value.profile || value.account || null;

  return projectPulseNormalizeAvatarSrc(
    value.avatarUrl ||
      value.profilePicture ||
      value.profileImage ||
      value.photoUrl ||
      value.imageUrl ||
      value.avatar ||
      value.picture ||
      value.image ||
      projectPulseGetPersonAvatar(nested)
  );
}

function projectPulseGetProjectMembers(project) {
  const rawMembers = Array.isArray(project?.members) ? project.members : [];

  return rawMembers
    .map((member) => member?.userId || member?.user || member?.member || member)
    .filter(Boolean);
}

function projectPulseResolveActor(activity, project) {
  const directActor =
    activity?.actor ||
    activity?.actorUser ||
    activity?.user ||
    activity?.member ||
    activity?.author ||
    activity?.createdBy ||
    activity?.updatedBy ||
    activity?.completedBy ||
    activity?.completedByUser ||
    activity?.owner ||
    activity?.assignee ||
    activity?.raw?.actor ||
    activity?.raw?.user ||
    activity?.raw?.createdBy ||
    activity?.raw?.updatedBy ||
    activity?.raw?.completedBy ||
    activity?.details?.actor ||
    activity?.details?.user ||
    activity?.metadata?.actor ||
    activity?.metadata?.user ||
    null;

  if (directActor && typeof directActor === "object") return directActor;

  const directActorName =
    activity?.actorName ||
    activity?.userName ||
    activity?.username ||
    activity?.authorName ||
    activity?.createdByName ||
    activity?.updatedByName ||
    activity?.completedByName ||
    "";

  if (!projectPulseIsGenericActorName(directActorName)) return directActorName;

  const members = projectPulseGetProjectMembers(project);
  if (members.length === 1) return members[0];

  return project?.owner || project?.ownerId || project?.createdBy || project?.user || null;
}

function projectPulseGetActorName(activity, project) {
  const directName =
    activity?.actorName ||
    activity?.userName ||
    activity?.username ||
    activity?.displayName ||
    activity?.authorName ||
    activity?.createdByName ||
    activity?.updatedByName ||
    activity?.completedByName ||
    activity?.raw?.actorName ||
    activity?.raw?.userName ||
    activity?.details?.actorName ||
    activity?.metadata?.actorName ||
    "";

  if (!projectPulseIsGenericActorName(directName)) {
    return String(directName).trim();
  }

  const actorName = projectPulseGetPersonName(projectPulseResolveActor(activity, project));

  if (!projectPulseIsGenericActorName(actorName)) {
    return actorName;
  }

  return "Project member";
}

function projectPulseGetActorAvatar(activity, project) {
  const directAvatar = projectPulseNormalizeAvatarSrc(
    activity?.avatarUrl ||
      activity?.profilePicture ||
      activity?.profileImage ||
      activity?.photoUrl ||
      activity?.imageUrl ||
      activity?.actorAvatar ||
      activity?.userAvatar ||
      activity?.raw?.avatarUrl ||
      activity?.raw?.profilePicture ||
      activity?.details?.avatarUrl ||
      activity?.metadata?.avatarUrl
  );

  if (directAvatar) return directAvatar;

  return projectPulseGetPersonAvatar(projectPulseResolveActor(activity, project));
}

function projectPulseGetInitials(name) {
  const parts = String(name || "Project member")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "PM";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function projectPulseGetActivityText(activity) {
  return String(
    activity?.text ||
      activity?.message ||
      activity?.title ||
      activity?.description ||
      activity?.details?.description ||
      activity?.metadata?.description ||
      ""
  ).trim();
}

function projectPulseGetActionLabel(activity) {
  const raw = [
    activity?.action,
    activity?.type,
    activity?.status,
    projectPulseGetActivityText(activity),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (raw.includes("complete") || raw.includes("done")) return "completed";
  if (raw.includes("ship")) return "shipped";
  if (raw.includes("move")) return "moved";
  if (raw.includes("create") || raw.includes("new task")) return "created";
  if (raw.includes("start") || raw.includes("progress")) return "started";
  if (raw.includes("block")) return "blocked";

  return "updated";
}

function projectPulseCleanTargetFromText(text, actorName) {
  let cleaned = String(text || "").trim();

  if (!cleaned) return "";

  const safeActor = String(actorName || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  if (safeActor) {
    cleaned = cleaned.replace(new RegExp(`^${safeActor}\\s+`, "i"), "");
  }

  cleaned = cleaned
    .replace(/^Someone moved\s+/i, "")
    .replace(/^Someone\s+(moved|updated|completed|created|shipped|started|blocked)\s+/i, "")
    .replace(/^Someone\s+/i, "")
    .replace(/^Project member\s+/i, "")
    .replace(/^Team member\s+/i, "")
    .replace(/^(moved|updated|completed|created|shipped|started|blocked)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

function projectPulseGetTargetLabel(activity, actorName) {
  const explicitTarget =
    activity?.target ||
    activity?.targetName ||
    activity?.taskTitle ||
    activity?.taskName ||
    activity?.itemTitle ||
    activity?.projectTitle ||
    activity?.task?.title ||
    activity?.project?.name ||
    activity?.raw?.taskTitle ||
    activity?.raw?.taskName ||
    activity?.raw?.title ||
    activity?.details?.taskTitle ||
    activity?.details?.taskName ||
    activity?.details?.title ||
    activity?.metadata?.taskTitle ||
    activity?.metadata?.taskName ||
    activity?.metadata?.title ||
    "";

  if (explicitTarget) return String(explicitTarget).trim();

  return projectPulseCleanTargetFromText(projectPulseGetActivityText(activity), actorName) || "an item";
}

function projectPulseGetStatusLabel(activity) {
  const action = projectPulseGetActionLabel(activity);

  if (action === "completed") return "Completed";
  if (action === "shipped") return "Shipped";
  if (action === "blocked") return "Blocked";
  if (action === "started") return "In progress";
  if (action === "created") return "Created";
  if (action === "moved") return "Moved";

  return "Updated";
}

function projectPulseFormatTimeAgo(value) {
  if (!value) return "Now";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Now";

  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));

  if (diffMinutes < 1) return "Now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1d ago";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function ProjectActivityActorAvatar({ activity, actorName, project }) {
  const [failed, setFailed] = useState(false);
  const avatar = projectPulseGetActorAvatar(activity, project);

  if (avatar && !failed) {
    return (
      <img
        src={avatar}
        alt={`${actorName} avatar`}
        onError={() => setFailed(true)}
        className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm dark:ring-[#111113]"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-50 text-[11px] font-black text-violet-700 ring-2 ring-white shadow-sm dark:bg-violet-500/10 dark:text-violet-200 dark:ring-[#111113]">
      {projectPulseGetInitials(actorName)}
    </div>
  );
}

function ProjectLiveActivityRow({ item, index, project }) {
  const actorName = projectPulseGetActorName(item, project);
  const action = projectPulseGetActionLabel(item);
  const target = projectPulseGetTargetLabel(item, actorName);
  const status = projectPulseGetStatusLabel(item);
  const timestamp = item?.createdAt || item?.updatedAt || item?.timestamp || item?.time || item?.date || item?.ts;
  const isCompleted = status.toLowerCase() === "completed";

  return (
    <article
      key={item?._id || item?.id || `${actorName}-${target}-${index}`}
      className="rounded-[22px] border border-slate-200/80 bg-white/90 p-4 shadow-sm transition-all hover:border-violet-200 hover:shadow-md dark:border-white/[0.07] dark:bg-white/[0.035] dark:shadow-none dark:hover:border-violet-500/30"
    >
      <div className="flex items-start gap-3">
        <ProjectActivityActorAvatar activity={item} actorName={actorName} project={project} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                isCompleted
                  ? "border border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "border border-violet-100 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isCompleted ? "bg-emerald-400" : "bg-violet-400"}`} />
              {status}
            </span>

            <span className="shrink-0 text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
              {projectPulseFormatTimeAgo(timestamp)}
            </span>
          </div>

          <p className="mt-2 text-sm leading-5 text-slate-700 dark:text-zinc-200">
            <span className="font-black text-slate-900 dark:text-white">{actorName}</span>{" "}
            <span>{action}</span>{" "}
            <span className="font-black text-slate-900 dark:text-white">{target}</span>
          </p>
        </div>
      </div>
    </article>
  );
}

function ProjectLiveActivityCard({ activities = [], project = null }) {
  const items = Array.isArray(activities) ? activities.slice(0, 5) : [];
  const hasItems = items.length > 0;

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#111113] dark:shadow-none">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_12%,rgba(45,212,191,0.12),transparent_30%),radial-gradient(circle_at_12%_0%,rgba(124,58,237,0.08),transparent_34%)]" />

      <header className="relative z-10 flex items-start justify-between gap-4 border-b border-slate-100/90 px-5 py-4 dark:border-white/[0.06]">
        <div className="flex items-start gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Activity className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-[#111113]" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Live Activity</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Real-time execution signals from this project
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Now
        </span>
      </header>

      <div className="relative z-10 p-4">
        {hasItems ? (
          <div className="space-y-3">
            {items.map((item, index) => (
              <ProjectLiveActivityRow
                key={item?._id || item?.id || index}
                item={item}
                index={index}
                project={project}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-white/60 px-6 py-8 text-center dark:border-white/[0.07] dark:bg-white/[0.03]">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-300">
              <Activity className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100">No activity yet</p>
            <p className="mt-1 max-w-[260px] text-xs leading-5 text-slate-500 dark:text-zinc-400">
              Ship your first update to see the feed come alive.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}'''

def find_matching_brace(text, open_index):
    depth = 0
    in_single = False
    in_double = False
    in_template = False
    in_line_comment = False
    in_block_comment = False
    escaped = False

    for index in range(open_index, len(text)):
        char = text[index]
        nxt = text[index + 1] if index + 1 < len(text) else ""

        if in_line_comment:
            if char == "\n":
                in_line_comment = False
            continue

        if in_block_comment:
            if char == "*" and nxt == "/":
                in_block_comment = False
            continue

        if in_single:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == "'":
                in_single = False
            continue

        if in_double:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_double = False
            continue

        if in_template:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == "`":
                in_template = False
            continue

        if char == "/" and nxt == "/":
            in_line_comment = True
            continue

        if char == "/" and nxt == "*":
            in_block_comment = True
            continue

        if char == "'":
            in_single = True
            continue

        if char == '"':
            in_double = True
            continue

        if char == "`":
            in_template = True
            continue

        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return index + 1

    raise SystemExit("[recover_and_repatch_project_home_live_activity] ERROR: could not find matching closing brace")

def main():
    print("[recover_and_repatch_project_home_live_activity] starting")

    if not TARGET.exists():
        raise SystemExit(f"[recover_and_repatch_project_home_live_activity] ERROR: missing {TARGET}")

    current_text = TARGET.read_text()

    candidates = sorted(
        TARGET.parent.glob(BACKUP_GLOB),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )

    if not candidates:
        raise SystemExit(
            "[recover_and_repatch_project_home_live_activity] ERROR: no pre-live-activity backup found. "
            "Run: ls -lt src/pages/ProjectHome.jsx.bak* | head -20"
        )

    source_backup = candidates[0]
    source_text = source_backup.read_text()

    signature = "function ProjectLiveActivityCard({ activities = [] }) {"
    start = source_text.find(signature)

    if start == -1:
        raise SystemExit(
            f"[recover_and_repatch_project_home_live_activity] ERROR: original ProjectLiveActivityCard signature not found in {source_backup}"
        )

    open_brace = start + len(signature) - 1
    end = find_matching_brace(source_text, open_brace)

    updated = source_text[:start] + NEW_BLOCK + source_text[end:]

    if '<ProjectLiveActivityCard activities={liveActivity} />' in updated:
        updated = updated.replace(
            '<ProjectLiveActivityCard activities={liveActivity} />',
            '<ProjectLiveActivityCard activities={liveActivity} project={project} />',
            1,
        )

    required = [
        "PROJECT LIVE ACTIVITY ACTOR BRIDGE",
        "function ProjectLiveActivityCard({ activities = [], project = null })",
        "function ProjectActivityActorAvatar",
        "function ProjectLiveActivityRow",
        '<ProjectLiveActivityCard activities={liveActivity} project={project} />',
    ]

    for token in required:
        if token not in updated:
            raise SystemExit(
                f"[recover_and_repatch_project_home_live_activity] ERROR: verification failed, missing: {token}"
            )

    forbidden = [
        "}) {\n  const items = Array.isArray(activities) ? activities.slice(0, 5) : [];",
        "}) {\n    const items = Array.isArray(activities) ? activities.slice(0, 5) : [];",
    ]

    for token in forbidden:
        if token in updated:
            raise SystemExit(
                "[recover_and_repatch_project_home_live_activity] ERROR: forbidden stray tail still present in recovered output"
            )

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    broken_backup = TARGET.with_suffix(f".jsx.bak.broken-before-live-activity-recovery-{timestamp}")
    broken_backup.write_text(current_text)

    TARGET.write_text(updated)

    print(f"[recover_and_repatch_project_home_live_activity] restored clean base from: {source_backup}")
    print(f"[recover_and_repatch_project_home_live_activity] broken current file backed up to: {broken_backup}")
    print("[recover_and_repatch_project_home_live_activity] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "PROJECT LIVE ACTIVITY ACTOR BRIDGE|function ProjectLiveActivityCard|ProjectActivityActorAvatar|ProjectLiveActivityRow|project=\\{project\\}|\\}\\) \\{" src/pages/ProjectHome.jsx -C 8')
    print("  git diff -- src/pages/ProjectHome.jsx")

if __name__ == "__main__":
    main()
