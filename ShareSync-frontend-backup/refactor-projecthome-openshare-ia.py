from pathlib import Path
from datetime import datetime
import re
import shutil

path = Path("src/pages/ProjectHome.jsx")

if not path.exists():
    raise FileNotFoundError(f"Could not find {path}")

text = path.read_text()
original = text

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = path.with_suffix(path.suffix + f".backup-openshare-ia-{stamp}")
shutil.copy2(path, backup)

def fail(message):
    path.write_text(original)
    raise RuntimeError(message + f"\nOriginal restored. Backup kept at: {backup}")

def replace_once(old, new, label):
    global text
    count = text.count(old)
    if count != 1:
        fail(f"Could not safely replace {label}. Expected 1 match, found {count}.")
    text = text.replace(old, new, 1)

# 1) Replace top-level nav from Asana-like universe to OpenShare IA.
new_project_views = '''const PROJECT_VIEWS = [
  {
    id: "overview",
    label: "Command",
    icon: Gauge,
    description: "Mission control: next move, blockers, owners, proof",
  },
  {
    id: "tasks",
    label: "Moves",
    icon: Layers,
    description: "Execution queue",
  },
  {
    id: "board",
    label: "Flow",
    icon: GitBranch,
    description: "Flow map",
  },
  {
    id: "roadmap",
    label: "Roadmap",
    icon: Map,
    description: "Milestones and schedule",
  },
  {
    id: "team",
    label: "Team Room",
    icon: MessageCircle,
    description: "Threads, announcements, files, decisions",
  },
  {
    id: "proof",
    label: "Proof",
    icon: CheckCircle2,
    description: "Shipping log, signals, completed work",
  },
];'''

text, count = re.subn(
    r"const PROJECT_VIEWS = \[\n.*?\n\];",
    new_project_views,
    text,
    count=1,
    flags=re.S,
)

if count != 1:
    fail("Could not replace PROJECT_VIEWS block.")

# 2) Insert grouped room components before OverviewView.
grouped_components = r'''
function ProjectSubnav({ items = [], active, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => {
        const Icon = item.icon || Sparkles;
        const isActive = active === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => !item.disabled && onChange(item.id)}
            disabled={item.disabled}
            className={`
              inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-semibold
              transition-all duration-200
              ${
                isActive
                  ? "border-violet-300 bg-violet-50 text-violet-700 shadow-sm dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-200"
                  : "border-slate-200 bg-white/80 text-slate-600 hover:border-violet-200 hover:text-violet-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:border-violet-500/25 dark:hover:text-violet-200"
              }
              ${item.disabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
            title={item.description}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{item.label}</span>
            {typeof item.count === "number" ? (
              <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-white/[0.08] dark:text-zinc-300">
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function RoadmapRoomView({
  projectId,
  liveTasks,
  selectedMilestoneId,
  onMilestoneClick,
  onAddMilestone,
  events,
  onAddEvent,
  onEventClick,
}) {
  const [mode, setMode] = useState("milestones");

  const modes = [
    {
      id: "milestones",
      label: "Milestones",
      icon: Flag,
      description: "Project targets and delivery checkpoints",
    },
    {
      id: "schedule",
      label: "Schedule",
      icon: Calendar,
      description: "Cadence, focus blocks, and calendar rhythm",
    },
  ];

  return (
    <div>
      <section className="px-10 pt-8 max-w-[1600px] mx-auto">
        <div className="rounded-[28px] border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.035] dark:shadow-none">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                  <Map className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Roadmap
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-zinc-400">
                    Milestones and schedule now live in one execution timeline.
                  </p>
                </div>
              </div>
            </div>

            <ProjectSubnav items={modes} active={mode} onChange={setMode} />
          </div>
        </div>
      </section>

      {mode === "milestones" ? (
        <RoadmapPanel
          projectId={projectId}
          liveTasks={liveTasks}
          selectedMilestoneId={selectedMilestoneId}
          onMilestoneClick={(milestoneId, milestone) => {
            onMilestoneClick?.(milestoneId, milestone);
          }}
          onAddMilestone={onAddMilestone}
        />
      ) : (
        <div className="p-10 max-w-[1600px] mx-auto">
          <RhythmView
            projectId={projectId}
            events={events || []}
            onAddEvent={onAddEvent}
            onEventClick={onEventClick}
          />
        </div>
      )}
    </div>
  );
}

function TeamRoomView({
  projectId,
  project,
  threads,
  announcements,
  files,
  onOpenFullChat,
  onUpload,
  onFileClick,
  onNewFolder,
}) {
  const [room, setRoom] = useState("threads");

  const threadCount = Array.isArray(threads) ? threads.length : 0;
  const announcementCount = Array.isArray(announcements) ? announcements.length : 0;
  const fileCount = Array.isArray(files) ? files.length : 0;

  const rooms = [
    {
      id: "threads",
      label: "Threads",
      icon: MessageCircle,
      count: threadCount,
      description: "Project-bound conversation",
    },
    {
      id: "announcements",
      label: "Announcements",
      icon: Megaphone,
      count: announcementCount,
      description: "High-signal broadcasts",
    },
    {
      id: "files",
      label: "Files",
      icon: Archive,
      count: fileCount,
      description: "Assets, uploads, and shared material",
    },
    {
      id: "decisions",
      label: "Decisions",
      icon: CheckCircle2,
      description: "Decision log placeholder",
    },
  ];

  return (
    <div className="p-10 max-w-[1600px] mx-auto">
      <section className="mb-6 overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#111113] dark:shadow-none">
        <div className="relative p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(124,58,237,0.10),transparent_32%),radial-gradient(circle_at_90%_10%,rgba(45,212,191,0.10),transparent_34%)]" />

          <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                <MessageCircle className="h-5 w-5" />
              </div>

              <div>
                <div className="mb-1 inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
                  Team Room
                </div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  One room for project context.
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-zinc-400">
                  Threads, announcements, files, and decisions are grouped together so the team has fewer places to search.
                </p>
              </div>
            </div>

            <ProjectSubnav items={rooms} active={room} onChange={setRoom} />
          </div>
        </div>
      </section>

      {room === "threads" ? (
        <ThreadsView
          projectId={projectId}
          project={project}
          threads={threads || []}
          onOpenFullChat={onOpenFullChat}
        />
      ) : null}

      {room === "announcements" ? (
        <AnnouncementsView
          projectId={projectId}
          announcements={announcements || []}
        />
      ) : null}

      {room === "files" ? (
        <VaultView
          projectId={projectId}
          files={files || []}
          onUpload={onUpload}
          onFileClick={onFileClick}
          onNewFolder={onNewFolder}
        />
      ) : null}

      {room === "decisions" ? (
        <section className="flex min-h-[260px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-white/80 p-8 text-center dark:border-white/[0.08] dark:bg-white/[0.03]">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Decision log coming next.
          </h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-zinc-400">
            This is where OpenShare can record major calls, tradeoffs, approvals, and reversals so the project keeps institutional memory.
          </p>
        </section>
      ) : null}
    </div>
  );
}

function ProofView({
  projectId,
  project,
  overview,
  finishLine,
  onReopenProject,
  isReopeningProject,
}) {
  const line = finishLine || overview?.finishLine || null;
  const liveActivity = Array.isArray(overview?.liveActivity) ? overview.liveActivity : [];
  const snapshot = line?.completionSnapshot || {};
  const completedTaskCount = readNumber(
    snapshot?.completedTaskCount,
    readNumber(overview?.pulse?.todayCompleted, 0)
  );
  const blockedCount = readNumber(overview?.summary?.blockedCount, 0);
  const activeGoalCount = Array.isArray(overview?.activeGoals)
    ? overview.activeGoals.length
    : 0;

  return (
    <div className="p-10 max-w-[1600px] mx-auto">
      <section className="mb-8 overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#111113] dark:shadow-none">
        <div className="relative p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(124,58,237,0.12),transparent_34%),radial-gradient(circle_at_90%_18%,rgba(45,212,191,0.12),transparent_34%),radial-gradient(circle_at_60%_100%,rgba(251,146,60,0.08),transparent_36%)]" />

          <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <div>
                <div className="mb-1 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                  Proof of Work
                </div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  Show what shipped, not just what was managed.
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-zinc-400">
                  Proof turns activity, completions, milestones, and signals into a visible record of progress.
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
              Live record
            </span>
          </div>
        </div>
      </section>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <OverviewSignalCard
          icon={CheckCircle2}
          label="Completed work"
          value={`${completedTaskCount}`}
          caption="Items that can be used as proof of execution"
          tone="teal"
        />
        <OverviewSignalCard
          icon={Activity}
          label="Execution signals"
          value={`${liveActivity.length}`}
          caption="Recent activity events captured for this project"
          tone="violet"
        />
        <OverviewSignalCard
          icon={AlertTriangle}
          label="Open friction"
          value={blockedCount === 0 ? "Clear" : `${blockedCount} blocker${blockedCount === 1 ? "" : "s"}`}
          caption={`${activeGoalCount} active goal${activeGoalCount === 1 ? "" : "s"} still shaping the mission`}
          tone={blockedCount > 0 ? "amber" : "neutral"}
        />
      </div>

      {line?.isCompleted ? (
        <div className="mb-8">
          <CompletedSnapshotPanel
            finishLine={line}
            onReopenProject={onReopenProject}
            isReopeningProject={isReopeningProject}
          />
        </div>
      ) : null}

      <div className="mb-8">
        <ProjectLiveActivityCard activities={liveActivity} project={project} />
      </div>

      <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#111113] dark:shadow-none">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Signals
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Analytics live inside Proof instead of sitting as another top-level tab.
          </p>
        </div>

        <InsightsTab projectId={projectId} />
      </section>
    </div>
  );
}

'''

if "function TeamRoomView(" not in text:
    marker = "function OverviewView({"
    if marker not in text:
        fail("Could not find OverviewView insertion point.")
    text = text.replace(marker, grouped_components + "\n" + marker, 1)

# 3) Give OverviewView access to projectId.
if "function OverviewView({\n  project,\n  projectId," not in text:
    replace_once(
        "function OverviewView({\n  project,\n",
        "function OverviewView({\n  project,\n  projectId,\n",
        "OverviewView projectId prop"
    )

# 4) Move Next Moves into Command by embedding SuggestionsPanel inside OverviewView.
if "project-command-next-moves" not in text:
    marker = '''      <div className="mb-8">
        <FinishLineCard'''
    insert = '''      <section className="project-command-next-moves mb-8 overflow-hidden rounded-[28px] border border-violet-200/80 bg-white shadow-sm dark:border-violet-500/20 dark:bg-[#111113] dark:shadow-none">
        <div className="border-b border-violet-100/80 px-5 py-4 dark:border-violet-500/10">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Command Brief
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Next Moves now live inside Command so the highest-leverage action is not hidden behind another tab.
          </p>
        </div>

        <div className="p-5">
          <SuggestionsPanel projectId={projectId} project={project} />
        </div>
      </section>

      <div className="mb-8">
        <FinishLineCard'''
    if marker not in text:
        fail("Could not find FinishLineCard marker for Command Brief insertion.")
    text = text.replace(marker, insert, 1)

# 5) Pass projectId into OverviewView render.
if "              projectId={id}\n              overview={overview}" not in text:
    replace_once(
        '''            <OverviewView
              project={project}
              overview={overview}''',
        '''            <OverviewView
              project={project}
              projectId={id}
              overview={overview}''',
        "OverviewView usage projectId"
    )

# 6) Update dynamic nav badge from Discussion-only to Team Room.
start = text.find("  const projectViews = useMemo(() => {")
end = text.find("  const overviewOnlineCount", start)
if start == -1 or end == -1:
    fail("Could not find projectViews useMemo block.")

new_project_views_memo = '''  const projectViews = useMemo(() => {
    const discussionCount = Array.isArray(threads) ? threads.length : 0;
    const announcementCount = Array.isArray(announcements) ? announcements.length : 0;
    const fileCount = Array.isArray(files) ? files.length : 0;
    const teamRoomCount = discussionCount + announcementCount + fileCount;

    return PROJECT_VIEWS.map((view) => {
      if (view.id === "team") {
        return {
          ...view,
          badge: teamRoomCount > 0 ? teamRoomCount : undefined,
        };
      }

      return view;
    });
  }, [threads, announcements, files]);

'''
text = text[:start] + new_project_views_memo + text[end:]

# 7) Replace Roadmap case with Roadmap + Schedule grouped room.
def replace_case(case_id, next_case_id, replacement):
    global text
    start = text.find(f'        case "{case_id}":')
    end = text.find(f'        case "{next_case_id}":', start)
    if start == -1 or end == -1:
        fail(f"Could not find switch case range {case_id} -> {next_case_id}.")
    text = text[:start] + replacement + "\n\n" + text[end:]

roadmap_case = '''        case "roadmap":
          return (
            <RoadmapRoomView
              projectId={id}
              liveTasks={liveTasks}
              selectedMilestoneId={selectedMilestoneId}
              onMilestoneClick={(milestoneId, milestone) => {
                console.log("Milestone clicked:", milestoneId, milestone);
                setSelectedMilestoneId(milestoneId);
                handleMilestoneClick?.(milestone);
              }}
              onAddMilestone={handleAddMilestone}
              events={events || []}
              onAddEvent={handleAddEvent}
              onEventClick={handleEventClick}
            />
          );'''

replace_case("roadmap", "schedule", roadmap_case)

# 8) Add Team Room and Proof cases before legacy Discussion case.
if '        case "team":' not in text:
    new_cases = '''        case "team":
          return (
            <TeamRoomView
              projectId={id}
              project={project}
              threads={threads || []}
              announcements={announcements || []}
              files={files || []}
              onOpenFullChat={() =>
                navigate("/messages", { state: { projectId: id } })
              }
              onUpload={handleUpload}
              onFileClick={handleFileClick}
              onNewFolder={handleNewFolder}
            />
          );

        case "proof":
          return (
            <ProofView
              projectId={id}
              project={project}
              overview={overview}
              finishLine={finishLine || overview?.finishLine || null}
              onReopenProject={handleReopenProject}
              isReopeningProject={isReopeningProject}
            />
          );

'''
    marker = '        case "discussion":'
    if marker not in text:
        fail("Could not find discussion case marker to insert Team Room / Proof cases.")
    text = text.replace(marker, new_cases + marker, 1)

# 9) Basic confidence checks.
required = [
    'label: "Command"',
    'label: "Moves"',
    'label: "Flow"',
    'label: "Team Room"',
    'label: "Proof"',
    'case "team":',
    'case "proof":',
    'function TeamRoomView(',
    'function ProofView(',
    'project-command-next-moves',
]

missing = [item for item in required if item not in text]
if missing:
    fail("Patch incomplete. Missing: " + ", ".join(missing))

path.write_text(text)

print("ProjectHome OpenShare IA refactor applied successfully.")
print(f"Updated file: {path}")
print(f"Backup file:  {backup}")
print("")
print("Changed:")
print("- Top-level tabs are now: Command, Moves, Flow, Roadmap, Team Room, Proof")
print("- Overview label changed to Command")
print("- Tasks label changed to Moves")
print("- Board label changed to Flow")
print("- Schedule is now grouped inside Roadmap")
print("- Discussion, Announcements, and Files are now grouped inside Team Room")
print("- Insights and activity proof are grouped inside Proof")
print("- Next Moves now appears inside Command")
print("")
print("No backend files touched.")
print("No API calls changed.")
print("Legacy cases for schedule/discussion/files/announcements/insights/suggestions were left in place as safety fallbacks.")
