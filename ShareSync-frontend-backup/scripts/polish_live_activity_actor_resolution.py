from pathlib import Path

path = Path("src/pages/ProjectHome.jsx")
text = path.read_text()

def find_function_bounds(source, name):
    start = source.find(f"function {name}(")
    if start == -1:
        raise SystemExit(f"❌ Could not find function {name}.")

    brace = source.find("{", start)
    if brace == -1:
        raise SystemExit(f"❌ Could not find opening brace for {name}.")

    depth = 0
    for i in range(brace, len(source)):
        char = source[i]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return start, i + 1

    raise SystemExit(f"❌ Could not find closing brace for {name}.")

def replace_function(source, name, replacement):
    start, end = find_function_bounds(source, name)
    return source[:start] + replacement.strip() + "\n" + source[end:]

helper_block = r'''
function projectPulseGetEntityId(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value !== "object") return "";

  const direct =
    value._id ||
    value.id ||
    value.userId ||
    value.user ||
    value.memberId ||
    value.member ||
    value.actorId ||
    value.actor ||
    value.createdBy ||
    value.updatedBy ||
    value.completedBy ||
    "";

  if (typeof direct === "string") return direct.trim();

  if (direct && typeof direct === "object" && direct !== value) {
    return projectPulseGetEntityId(direct);
  }

  return "";
}

function projectPulseNormalizeMemberRecord(member) {
  if (!member) return null;

  const nested =
    typeof member.userId === "object"
      ? member.userId
      : typeof member.user === "object"
        ? member.user
        : typeof member.memberId === "object"
          ? member.memberId
          : typeof member.member === "object"
            ? member.member
            : typeof member.profile === "object"
              ? member.profile
              : null;

  const id =
    projectPulseGetEntityId(nested) ||
    projectPulseGetEntityId(member) ||
    "";

  const firstName = member.firstName || nested?.firstName || "";
  const lastName = member.lastName || nested?.lastName || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return {
    ...(nested || {}),
    ...(typeof member === "object" ? member : {}),
    _id: id || nested?._id || member?._id,
    id: id || nested?.id || member?.id,
    firstName,
    lastName,
    name:
      member.name ||
      nested?.name ||
      member.fullName ||
      nested?.fullName ||
      member.displayName ||
      nested?.displayName ||
      fullName ||
      member.username ||
      nested?.username ||
      member.email ||
      nested?.email ||
      "",
    fullName:
      member.fullName ||
      nested?.fullName ||
      member.displayName ||
      nested?.displayName ||
      fullName ||
      "",
    email: member.email || nested?.email || "",
    username: member.username || nested?.username || "",
    avatarUrl:
      member.avatarUrl ||
      nested?.avatarUrl ||
      member.profilePicture ||
      nested?.profilePicture ||
      member.profileImage ||
      nested?.profileImage ||
      member.photoUrl ||
      nested?.photoUrl ||
      member.avatar ||
      nested?.avatar ||
      "",
    profilePicture:
      member.profilePicture ||
      nested?.profilePicture ||
      member.avatarUrl ||
      nested?.avatarUrl ||
      "",
  };
}

function projectPulseGetProjectMembers(project) {
  const rawMembers = Array.isArray(project?.members) ? project.members : [];

  const ownerCandidates = [
    project?.ownerId,
    project?.owner,
    project?.createdById,
    project?.createdBy,
  ].filter(Boolean);

  const normalized = [
    ...rawMembers.map(projectPulseNormalizeMemberRecord),
    ...ownerCandidates.map(projectPulseNormalizeMemberRecord),
  ].filter(Boolean);

  const seen = new Set();

  return normalized.filter((member) => {
    const key =
      projectPulseGetEntityId(member) ||
      String(member.email || "").toLowerCase() ||
      String(member.username || "").toLowerCase() ||
      String(member.name || "").toLowerCase();

    if (!key) return true;
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}
'''

# Insert/replace the member helper functions.
text = replace_function(text, "projectPulseGetProjectMembers", helper_block)

resolve_actor = r'''
function projectPulseResolveActor(activity, project) {
  const projectMembers = projectPulseGetProjectMembers(project);

  const directActor =
    activity?.actor ||
    activity?.actorUser ||
    activity?.user ||
    activity?.member ||
    activity?.author ||
    activity?.createdBy ||
    activity?.updatedBy ||
    activity?.completedBy ||
    activity?.raw?.actor ||
    activity?.raw?.user ||
    activity?.details?.actor ||
    activity?.details?.user ||
    activity?.metadata?.actor ||
    activity?.metadata?.user ||
    null;

  const directId = projectPulseGetEntityId(directActor);

  const candidateIds = [
    directId,
    activity?.actorId,
    activity?.userId,
    activity?.memberId,
    activity?.authorId,
    activity?.createdById,
    activity?.updatedById,
    activity?.completedById,
    activity?.createdBy,
    activity?.updatedBy,
    activity?.completedBy,
    activity?.raw?.actorId,
    activity?.raw?.userId,
    activity?.raw?.memberId,
    activity?.details?.actorId,
    activity?.details?.userId,
    activity?.details?.memberId,
    activity?.metadata?.actorId,
    activity?.metadata?.userId,
    activity?.metadata?.memberId,
  ]
    .map(projectPulseGetEntityId)
    .filter(Boolean);

  const candidateEmails = [
    activity?.actorEmail,
    activity?.userEmail,
    activity?.email,
    activity?.raw?.actorEmail,
    activity?.raw?.userEmail,
    activity?.details?.actorEmail,
    activity?.details?.userEmail,
    activity?.metadata?.actorEmail,
    activity?.metadata?.userEmail,
    directActor?.email,
  ]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);

  const matchedMember = projectMembers.find((member) => {
    const memberId = projectPulseGetEntityId(member);
    const memberEmail = String(member?.email || "").trim().toLowerCase();

    return (
      (memberId && candidateIds.includes(memberId)) ||
      (memberEmail && candidateEmails.includes(memberEmail))
    );
  });

  if (matchedMember) {
    return {
      ...(typeof directActor === "object" && directActor ? directActor : {}),
      ...matchedMember,
    };
  }

  if (directActor && typeof directActor === "object") {
    return directActor;
  }

  if (projectMembers.length === 1) {
    return projectMembers[0];
  }

  return null;
}
'''

text = replace_function(text, "projectPulseResolveActor", resolve_actor)

actor_name = r'''
function projectPulseGetActorName(activity, project) {
  const directNameCandidates = [
    activity?.actorName,
    activity?.userName,
    activity?.username,
    activity?.displayName,
    activity?.authorName,
    activity?.createdByName,
    activity?.updatedByName,
    activity?.completedByName,
    activity?.raw?.actorName,
    activity?.raw?.userName,
    activity?.details?.actorName,
    activity?.details?.userName,
    activity?.metadata?.actorName,
    activity?.metadata?.userName,
  ];

  const directName = directNameCandidates.find(
    (value) => !projectPulseIsGenericActorName(value)
  );

  if (directName) return String(directName).trim();

  const actor = projectPulseResolveActor(activity, project);
  const actorName = projectPulseGetPersonName(actor);

  if (!projectPulseIsGenericActorName(actorName)) {
    return actorName;
  }

  return "Project member";
}
'''

text = replace_function(text, "projectPulseGetActorName", actor_name)

row = r'''
function ProjectLiveActivityRow({ item, index, project }) {
  const actorName = projectPulseGetActorName(item, project);
  const action = projectPulseGetActionLabel(item);
  const target = projectPulseGetTargetLabel(item, actorName);
  const status = projectPulseGetStatusLabel(item);
  const timestamp =
    item?.createdAt ||
    item?.updatedAt ||
    item?.timestamp ||
    item?.time ||
    item?.date ||
    null;

  const tone =
    action === "completed" || action === "shipped"
      ? {
          dot: "bg-emerald-400",
          badge: "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
          rail: "from-emerald-400 to-cyan-400",
          icon: CheckCircle2,
        }
      : action === "blocked"
        ? {
            dot: "bg-rose-400",
            badge: "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
            rail: "from-rose-400 to-orange-400",
            icon: Activity,
          }
        : {
            dot: "bg-violet-400",
            badge: "border-violet-100 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300",
            rail: "from-violet-400 to-cyan-400",
            icon: Activity,
          };

  const StatusIcon = tone.icon;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-violet-500/25">
      <div className={`absolute inset-y-4 left-0 w-1 rounded-r-full bg-gradient-to-b ${tone.rail}`} />

      <div className="flex items-start gap-3 pl-2">
        <ProjectActivityActorAvatar
          activity={item}
          actorName={actorName}
          project={project}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${tone.badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
              <StatusIcon className="h-3.5 w-3.5" />
              {status}
            </span>

            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
              <Clock className="h-3.5 w-3.5" />
              {projectPulseFormatTimeAgo(timestamp)}
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-zinc-200">
            <span className="font-black text-slate-950 dark:text-white">
              {actorName}
            </span>{" "}
            <span>{action}</span>{" "}
            <span className="font-black text-slate-950 dark:text-white">
              {target}
            </span>
          </p>
        </div>
      </div>
    </article>
  );
}
'''

text = replace_function(text, "ProjectLiveActivityRow", row)

card = r'''
function ProjectLiveActivityCard({ activities = [], project = null }) {
  const items = Array.isArray(activities) ? activities.slice(0, 5) : [];
  const hasItems = items.length > 0;

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-emerald-100/80 bg-white shadow-sm dark:border-emerald-500/20 dark:bg-[#111113] dark:shadow-none">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_12%,rgba(45,212,191,0.14),transparent_30%),radial-gradient(circle_at_12%_0%,rgba(124,58,237,0.08),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400" />

      <header className="relative z-10 flex items-start justify-between gap-4 border-b border-slate-100/90 px-5 py-4 dark:border-white/[0.06]">
        <div className="flex items-start gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Activity className="h-6 w-6" />
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-[#111113]" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-black text-slate-950 dark:text-white">
                Live Activity
              </h3>
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                Realtime
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Real-time execution signals from this project
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Now
        </span>
      </header>

      <div className="relative z-10 p-4">
        {hasItems ? (
          <div className="space-y-3">
            {items.map((item, index) => (
              <ProjectLiveActivityRow
                key={item?._id || item?.id || item?.createdAt || index}
                item={item}
                index={index}
                project={project}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-5 text-sm text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-400">
            No live activity yet. Ship an update, complete a task, or resolve a blocker to create the first signal.
          </div>
        )}
      </div>
    </section>
  );
}
'''

text = replace_function(text, "ProjectLiveActivityCard", card)

path.write_text(text)

print("✅ Live Activity actor resolution improved.")
print("✅ Live Activity visual polish applied.")
print("")
print("Inspect:")
print('rg -n "projectPulseGetEntityId|projectPulseNormalizeMemberRecord|function projectPulseResolveActor|function ProjectLiveActivityRow|function ProjectLiveActivityCard" src/pages/ProjectHome.jsx -C 8')
