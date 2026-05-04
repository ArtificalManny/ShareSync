from pathlib import Path

path = Path("src/pages/ProjectHome.jsx")

if not path.exists():
    raise SystemExit(f"File not found: {path}")

text = path.read_text()

# 1) Import ProjectCaseStudyCard.
old_import = 'import ProjectAvatar from "../components/project/ProjectAvatar";'
new_import = '''import ProjectAvatar from "../components/project/ProjectAvatar";
import ProjectCaseStudyCard from "../components/project/ProjectCaseStudyCard";'''

if "ProjectCaseStudyCard" not in text:
    if old_import not in text:
        raise SystemExit("Could not find ProjectAvatar import anchor.")
    text = text.replace(old_import, new_import)

# 2) Add onViewCaseStudy to CompletedSnapshotPanel props.
old_completed_sig = """function CompletedSnapshotPanel({
  finishLine,
  onReopenProject,
  isReopeningProject = false,
}) {"""

new_completed_sig = """function CompletedSnapshotPanel({
  finishLine,
  onReopenProject,
  isReopeningProject = false,
  onViewCaseStudy,
}) {"""

if old_completed_sig in text:
    text = text.replace(old_completed_sig, new_completed_sig)

# 3) Add onViewCaseStudy to HistoricalModeBanner props.
old_historical_sig = """function HistoricalModeBanner({
  project,
  onReopenProject,
  isReopeningProject = false,
}) {"""

new_historical_sig = """function HistoricalModeBanner({
  project,
  onReopenProject,
  isReopeningProject = false,
  onViewCaseStudy,
}) {"""

if old_historical_sig in text:
    text = text.replace(old_historical_sig, new_historical_sig)

# 4) Replace existing standalone Reopen button blocks with View Case Study + Reopen group.
old_reopen_button = """          <button
            type="button"
            onClick={onReopenProject}
            disabled={isReopeningProject}
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isReopeningProject ? "Reopening…" : "Reopen Project"}</span>
          </button>"""

new_button_group = """          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onViewCaseStudy}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 shadow-sm transition-all dark:bg-white/[0.05] dark:text-emerald-300 dark:border-emerald-500/20 dark:hover:bg-emerald-500/10"
            >
              <FileText className="w-4 h-4" />
              <span>View Case Study</span>
            </button>

            <button
              type="button"
              onClick={onReopenProject}
              disabled={isReopeningProject}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isReopeningProject ? "Reopening…" : "Reopen Project"}</span>
            </button>
          </div>"""

if old_reopen_button not in text:
    raise SystemExit("Could not find Reopen Project button block.")

text = text.replace(old_reopen_button, new_button_group)

# 5) Add FileText to lucide imports if not already imported.
old_icon_import_tail = """  Bell,
  BellOff,
  Loader2,
} from "lucide-react";"""

new_icon_import_tail = """  Bell,
  BellOff,
  Loader2,
  FileText,
} from "lucide-react";"""

if "FileText," not in text:
    if old_icon_import_tail not in text:
        raise SystemExit("Could not find lucide import tail.")
    text = text.replace(old_icon_import_tail, new_icon_import_tail)

# 6) Add onViewCaseStudy prop to OverviewView signature.
old_overview_sig = """  onFinishLineAction,
  onReopenProject,
  isReopeningProject,
  isStartingSprint = false,
  projectOnlineCount = 0,
}) {"""

new_overview_sig = """  onFinishLineAction,
  onReopenProject,
  onViewCaseStudy,
  isReopeningProject,
  isStartingSprint = false,
  projectOnlineCount = 0,
}) {"""

if old_overview_sig in text:
    text = text.replace(old_overview_sig, new_overview_sig)

# 7) Add completed/case-study derived data in OverviewView.
old_team_metrics = """  const teamMetrics = {
    ...metrics,
    teamCapacity,
  };

  return ("""

new_team_metrics = """  const teamMetrics = {
    ...metrics,
    teamCapacity,
  };

  const isCompletedProject = Boolean(
    finishLine?.isCompleted ||
      String(project?.status || "").toLowerCase() === "completed" ||
      project?.completedAt
  );

  const caseStudyProject = {
    ...project,
    completedAt:
      finishLine?.completedAt ||
      finishLine?.completionSnapshot?.completedAt ||
      project?.completedAt,
    completionSummary:
      finishLine?.closureSummary ||
      finishLine?.completionSnapshot?.summary ||
      project?.completionSummary,
    outcomeStatus:
      finishLine?.outcomeStatus ||
      finishLine?.completionSnapshot?.outcomeStatus ||
      project?.outcomeStatus,
    completedTasks:
      finishLine?.completionSnapshot?.completedTaskCount ??
      project?.completedTasks,
    taskCount:
      finishLine?.completionSnapshot?.totalTaskCount ??
      project?.taskCount,
  };

  return ("""

if "const isCompletedProject = Boolean(" not in text:
    if old_team_metrics not in text:
        raise SystemExit("Could not find teamMetrics block.")
    text = text.replace(old_team_metrics, new_team_metrics)

# 8) Replace completed snapshot block with snapshot + case study card.
old_completed_block = """      {finishLine?.isCompleted ? (
        <div className="mb-8">
          <CompletedSnapshotPanel
            finishLine={finishLine}
            onReopenProject={onReopenProject}
            isReopeningProject={isReopeningProject}
          />
        </div>
      ) : null}"""

new_completed_block = """      {isCompletedProject ? (
        <>
          <div className="mb-8">
            <CompletedSnapshotPanel
              finishLine={finishLine}
              onReopenProject={onReopenProject}
              isReopeningProject={isReopeningProject}
              onViewCaseStudy={onViewCaseStudy}
            />
          </div>

          <div className="mb-8">
            <ProjectCaseStudyCard project={caseStudyProject} />
          </div>
        </>
      ) : null}"""

if old_completed_block not in text:
    raise SystemExit("Could not find completed snapshot render block.")

text = text.replace(old_completed_block, new_completed_block)

# 9) Add scroll handler in main ProjectHome before loading guards.
old_lifecycle_block = """  const projectLifecycleState = String(project?.status || "").toLowerCase();
  const isHistoricalProject = projectLifecycleState === "completed";
  const showHistoricalBanner = isHistoricalProject && activeView !== "overview";

  if (loading) return <LoadingState />;"""

new_lifecycle_block = """  const projectLifecycleState = String(project?.status || "").toLowerCase();
  const isHistoricalProject = projectLifecycleState === "completed";
  const showHistoricalBanner = isHistoricalProject && activeView !== "overview";

  const handleViewCaseStudy = useCallback(() => {
    if (activeView !== "overview") {
      setActiveView("overview");
    }

    if (typeof window === "undefined") return;

    window.setTimeout(() => {
      const target = document.getElementById("project-case-study");
      target?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }, [activeView]);

  if (loading) return <LoadingState />;"""

if "const handleViewCaseStudy = useCallback(() =>" not in text:
    if old_lifecycle_block not in text:
        raise SystemExit("Could not find lifecycle block.")
    text = text.replace(old_lifecycle_block, new_lifecycle_block)

# 10) Pass onViewCaseStudy into OverviewView.
old_overview_render_prop = """              onFinishLineAction={handleFinishLineAction}
              onReopenProject={handleReopenProject}
              isReopeningProject={isReopeningProject}"""

new_overview_render_prop = """              onFinishLineAction={handleFinishLineAction}
              onReopenProject={handleReopenProject}
              onViewCaseStudy={handleViewCaseStudy}
              isReopeningProject={isReopeningProject}"""

if old_overview_render_prop not in text:
    raise SystemExit("Could not find OverviewView prop block.")

text = text.replace(old_overview_render_prop, new_overview_render_prop)

# 11) Pass onViewCaseStudy into HistoricalModeBanner.
old_historical_render_prop = """          onReopenProject={handleReopenProject}
          isReopeningProject={isReopeningProject}
        />"""

new_historical_render_prop = """          onReopenProject={handleReopenProject}
          isReopeningProject={isReopeningProject}
          onViewCaseStudy={handleViewCaseStudy}
        />"""

# Only replace the HistoricalModeBanner occurrence by anchoring near showHistoricalBanner.
hist_index = text.find("<HistoricalModeBanner")
if hist_index == -1:
    raise SystemExit("Could not find HistoricalModeBanner render.")

tail = text[hist_index:]
if old_historical_render_prop not in tail:
    raise SystemExit("Could not find HistoricalModeBanner prop tail.")

tail = tail.replace(old_historical_render_prop, new_historical_render_prop, 1)
text = text[:hist_index] + tail

path.write_text(text)
print(f"Patched Phase 5 case-study mode in {path}")
