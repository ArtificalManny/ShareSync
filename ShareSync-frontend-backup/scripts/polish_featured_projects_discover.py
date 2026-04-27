#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup")
TARGET = ROOT / "src/components/ecosystem/FeaturedProjects.jsx"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")


def fail(message: str):
    print(f"\n[polish_featured_projects_discover] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)


def main():
    print("[polish_featured_projects_discover] starting")

    if not TARGET.exists():
        fail(f"Missing file: {TARGET}")

    source = TARGET.read_text(encoding="utf-8")
    original = source

    required_markers = [
        "import client from '../../api/client';",
        "function ProgressBar({ value = 0 }) {",
        "function ProjectCard({ project, initialFollowing }) {",
        "{/* Emoji avatar */}",
        "completionRate: p.metrics?.completedTasks && p.metrics?.totalTasks",
    ]

    for marker in required_markers:
        if marker not in source:
            fail(f"Missing expected marker before patch: {marker}")

    # 1) Add shared ProjectAvatar import.
    old_import = """import client from '../../api/client';
import { useFollow } from '../../hooks/useFollow';
import { getBulkFollowStatus } from '../../api/follows';"""

    new_import = """import client from '../../api/client';
import { useFollow } from '../../hooks/useFollow';
import { getBulkFollowStatus } from '../../api/follows';
import ProjectAvatar from '../project/ProjectAvatar';"""

    if new_import not in source:
        if old_import not in source:
            fail("Could not find import insertion point for ProjectAvatar.")
        source = source.replace(old_import, new_import, 1)
        print("[polish_featured_projects_discover] added ProjectAvatar import")
    else:
        print("[polish_featured_projects_discover] ProjectAvatar import already present")

    # 2) Add safe display helpers after ProgressBar.
    helper_marker = "function getFeaturedProgress(project) {"
    old_progress_block = """function ProgressBar({ value = 0 }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
        style={{ width: clamped + '%' }}
      />
    </div>
  );
}"""

    new_progress_block = """function ProgressBar({ value = 0, tone = 'violet' }) {
  const clamped = Math.max(0, Math.min(100, value));
  const gradients = {
    violet: 'from-violet-500 to-fuchsia-500',
    emerald: 'from-emerald-500 to-teal-400',
    amber: 'from-amber-500 to-orange-400',
    slate: 'from-slate-400 to-slate-500',
  };

  return (
    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${gradients[tone] || gradients.violet} transition-all duration-500`}
        style={{ width: clamped + '%' }}
      />
    </div>
  );
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(safeNumber(value, 0))));
}

function getFeaturedProgress(project) {
  const metrics = project?.metrics || {};
  const direct =
    project?.computedProgress ??
    project?.progress ??
    project?.completionRate ??
    metrics?.computedProgress ??
    metrics?.progress ??
    null;

  if (direct !== null && direct !== undefined) {
    return clampPercent(direct);
  }

  const completed = safeNumber(project?.completedTasks ?? metrics?.completedTasks, 0);
  const total = safeNumber(project?.taskCount ?? metrics?.totalTasks, 0);

  if (total <= 0) return 0;
  return clampPercent((completed / total) * 100);
}

function getMomentumMeta(project, progress) {
  const raw = String(project?.momentumState || project?.momentum || '').trim().toLowerCase();

  if (raw.includes('complete') || progress >= 100) {
    return {
      label: 'Completed',
      tone: 'emerald',
      chip: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20',
    };
  }

  if (raw.includes('block') || raw.includes('stalled')) {
    return {
      label: 'Blocked',
      tone: 'amber',
      chip: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20',
    };
  }

  if (raw.includes('strong') || progress >= 80) {
    return {
      label: 'Strong',
      tone: 'emerald',
      chip: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20',
    };
  }

  if (raw.includes('building') || progress > 0) {
    return {
      label: 'Building',
      tone: 'violet',
      chip: 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/20',
    };
  }

  return {
    label: 'Planning',
    tone: 'slate',
    chip: 'bg-slate-50 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-white/[0.08]',
  };
}

function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}"""

    if helper_marker not in source:
      if old_progress_block not in source:
          fail("Could not find exact ProgressBar block to replace.")
      source = source.replace(old_progress_block, new_progress_block, 1)
      print("[polish_featured_projects_discover] upgraded ProgressBar and inserted display helpers")
    else:
      print("[polish_featured_projects_discover] display helpers already present")

    # 3) Add ProjectCard computed values.
    old_project_card_start = """function ProjectCard({ project, initialFollowing }) {
  const navigate = useNavigate();
  const pid = project._id || project.id;
  const isDemo = pid?.startsWith('demo-');"""

    new_project_card_start = """function ProjectCard({ project, initialFollowing }) {
  const navigate = useNavigate();
  const pid = project._id || project.id;
  const isDemo = pid?.startsWith('demo-');
  const progress = getFeaturedProgress(project);
  const momentumMeta = getMomentumMeta(project, progress);
  const taskCount = safeNumber(project.taskCount ?? project.metrics?.totalTasks, 0);
  const completedTasks = safeNumber(project.completedTasks ?? project.metrics?.completedTasks, 0);
  const openTaskCount = safeNumber(
    project.openTaskCount,
    Math.max(taskCount - completedTasks, 0)
  );
  const projectName = project.name || project.title || project.projectName || 'Untitled Project';
  const description = project.description || project.subtitle || project.category || '';"""

    if "const progress = getFeaturedProgress(project);" not in source:
        if old_project_card_start not in source:
            fail("Could not find ProjectCard variable insertion point.")
        source = source.replace(old_project_card_start, new_project_card_start, 1)
        print("[polish_featured_projects_discover] added ProjectCard computed display values")
    else:
        print("[polish_featured_projects_discover] ProjectCard display values already present")

    # 4) Replace emoji avatar with ProjectAvatar.
    old_avatar = """        {/* Emoji avatar */}
        <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 flex items-center justify-center text-2xl shrink-0">
          {project.emoji || '📦'}
        </div>"""

    new_avatar = """        {/* Shared project identity avatar — matches Projects.jsx / ProjectCardV2 */}
        <ProjectAvatar
          project={project}
          size="md"
          className="transition-transform duration-200 group-hover:scale-105"
        />"""

    if old_avatar in source:
        source = source.replace(old_avatar, new_avatar, 1)
        print("[polish_featured_projects_discover] replaced emoji avatar with ProjectAvatar")
    elif "<ProjectAvatar" in source:
        print("[polish_featured_projects_discover] ProjectAvatar already rendered")
    else:
        fail("Could not find emoji avatar block to replace.")

    # 5) Improve project title/description and add momentum chip.
    old_title_block = """          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-base font-semibold text-slate-800 dark:text-white truncate">
              {project.name || project.title}
            </h4>
            <MomentumBadge streak={project.streak || project.streakDays} />
          </div>

          {project.description && (
            <p className="text-sm text-slate-500 dark:text-zinc-400 line-clamp-1 mb-3">
              {project.description}
            </p>
          )}"""

    new_title_block = """          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-base font-semibold text-slate-800 dark:text-white truncate">
              {projectName}
            </h4>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${momentumMeta.chip}`}>
              <Zap className="w-3 h-3" />
              {momentumMeta.label}
            </span>
            <MomentumBadge streak={project.streak || project.streakDays} />
          </div>

          {description && (
            <p className="text-sm text-slate-500 dark:text-zinc-400 line-clamp-1 mb-3">
              {description}
            </p>
          )}"""

    if old_title_block in source:
        source = source.replace(old_title_block, new_title_block, 1)
        print("[polish_featured_projects_discover] upgraded title row and description fallback")
    elif "momentumMeta.label" in source:
        print("[polish_featured_projects_discover] title row already upgraded")
    else:
        fail("Could not find title/description block to replace.")

    # 6) Replace progress block to use computed progress.
    old_progress_usage = """          {/* Progress */}
          {(project.completionRate > 0) && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-slate-400 dark:text-white/30">Progress</span>
                <span className="text-[10px] font-bold text-slate-600 dark:text-white/50">{project.completionRate}%</span>
              </div>
              <ProgressBar value={project.completionRate} />
            </div>
          )}"""

    new_progress_usage = """          {/* Progress */}
          {progress > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-slate-400 dark:text-white/30">Progress</span>
                <span className="text-[10px] font-bold text-slate-600 dark:text-white/50">{progress}%</span>
              </div>
              <ProgressBar value={progress} tone={momentumMeta.tone} />
            </div>
          )}"""

    if old_progress_usage in source:
        source = source.replace(old_progress_usage, new_progress_usage, 1)
        print("[polish_featured_projects_discover] wired progress to computed project progress")
    elif "ProgressBar value={progress}" in source:
        print("[polish_featured_projects_discover] progress block already upgraded")
    else:
        fail("Could not find progress usage block to replace.")

    # 7) Replace stats row with richer project-card signal row.
    old_stats_row = """          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-zinc-500">
            {project.memberCount > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {project.memberCount}
              </span>
            )}
            {project.shipCount > 0 && (
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {project.shipCount} ships
              </span>
            )}
            {project.tags?.length > 0 && (
              <div className="flex gap-1">
                {project.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>"""

    new_stats_row = """          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 dark:text-zinc-500">
            {project.memberCount > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {project.memberCount}
              </span>
            )}
            {taskCount > 0 && (
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {completedTasks}/{taskCount} tasks
              </span>
            )}
            {openTaskCount > 0 && (
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {pluralize(openTaskCount, 'open task', 'open tasks')}
              </span>
            )}
            {project.shipCount > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                {project.shipCount} ships
              </span>
            )}
            {project.tags?.length > 0 && (
              <div className="flex gap-1">
                {project.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>"""

    if old_stats_row in source:
        source = source.replace(old_stats_row, new_stats_row, 1)
        print("[polish_featured_projects_discover] upgraded stats row")
    elif "completedTasks}/{taskCount} tasks" in source:
        print("[polish_featured_projects_discover] stats row already upgraded")
    else:
        fail("Could not find stats row block to replace.")

    # 8) Improve mapper so it preserves enriched project-card fields.
    old_mapping = """          const mapped = items.length > 0 ? items.slice(0, maxVisible).map(p => ({
            ...p,
            id: p._id || p.id,
            name: p.name || p.projectName,
            memberCount: p.metrics?.memberCount || p.memberCount || 0,
            shipCount: p.metrics?.totalShips || p.shipCount || 0,
            streak: p.streakDays || p.streak || 0,
            completionRate: p.metrics?.completedTasks && p.metrics?.totalTasks
              ? Math.round((p.metrics.completedTasks / p.metrics.totalTasks) * 100)
              : (p.completionRate || 0),
          })) : FALLBACK_FEATURED;"""

    new_mapping = """          const mapped = items.length > 0 ? items.slice(0, maxVisible).map(p => {
            const metrics = p.metrics || {};
            const taskCount = safeNumber(p.taskCount ?? metrics.totalTasks, 0);
            const completedTasks = safeNumber(p.completedTasks ?? metrics.completedTasks, 0);
            const computedProgress =
              p.computedProgress ??
              p.progress ??
              p.completionRate ??
              (taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0);

            return {
              ...p,
              id: p._id || p.id,
              name: p.name || p.projectName || p.title,
              title: p.title || p.name || p.projectName,
              memberCount: metrics.memberCount || p.memberCount || 0,
              shipCount: metrics.totalShips || p.shipCount || p.totalShips || 0,
              streak: p.streakDays || p.streak || 0,
              taskCount,
              completedTasks,
              openTaskCount: safeNumber(
                p.openTaskCount,
                Math.max(taskCount - completedTasks, 0)
              ),
              computedProgress: clampPercent(computedProgress),
              progress: clampPercent(p.progress ?? computedProgress),
              completionRate: clampPercent(computedProgress),
              momentumState: p.momentumState || p.state || '',
            };
          }) : FALLBACK_FEATURED;"""

    if old_mapping in source:
        source = source.replace(old_mapping, new_mapping, 1)
        print("[polish_featured_projects_discover] upgraded discovery project mapper")
    elif "const computedProgress =" in source and "completionRate: clampPercent(computedProgress)" in source:
        print("[polish_featured_projects_discover] mapper already upgraded")
    else:
        fail("Could not find mapped project block to replace.")

    # Safety checks.
    required_after = [
        "import ProjectAvatar from '../project/ProjectAvatar';",
        "function getFeaturedProgress(project) {",
        "const momentumMeta = getMomentumMeta(project, progress);",
        "<ProjectAvatar",
        "ProgressBar value={progress} tone={momentumMeta.tone}",
        "completionRate: clampPercent(computedProgress)",
    ]

    for marker in required_after:
        if marker not in source:
            fail(f"Safety check failed after patch. Missing marker: {marker}")

    if source == original:
        print("[polish_featured_projects_discover] no changes needed")
        return

    backup = TARGET.with_name(f"{TARGET.name}.bak-discover-polish-{STAMP}")
    backup.write_text(original, encoding="utf-8")
    print(f"[polish_featured_projects_discover] backup created: {backup}")

    TARGET.write_text(source, encoding="utf-8")
    print(f"[polish_featured_projects_discover] patched: {TARGET}")

    print("")
    print("[polish_featured_projects_discover] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"ProjectAvatar|getFeaturedProgress|getMomentumMeta|momentumMeta|completedTasks}/{taskCount}|completionRate: clampPercent\" src/components/ecosystem/FeaturedProjects.jsx -C 6")
    print("  git diff -- src/components/ecosystem/FeaturedProjects.jsx")


if __name__ == "__main__":
    main()
