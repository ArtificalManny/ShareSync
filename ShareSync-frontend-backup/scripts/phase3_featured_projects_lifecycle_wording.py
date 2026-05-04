from pathlib import Path

path = Path("src/components/ecosystem/FeaturedProjects.jsx")

if not path.exists():
    raise SystemExit(f"File not found: {path}")

text = path.read_text()

old_helpers_anchor = """function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(safeNumber(value, 0))));
}
"""

new_helpers = """function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(safeNumber(value, 0))));
}

function getProjectLifecycleStatus(project) {
  return String(
    project?.status ||
      project?.lifecycleStatus ||
      project?.state ||
      ""
  ).toLowerCase();
}

function isCompletedProject(project) {
  const status = getProjectLifecycleStatus(project);
  return status === "completed" || Boolean(project?.completedAt);
}

function isArchivedProject(project) {
  const status = getProjectLifecycleStatus(project);
  return status === "archived" || Boolean(project?.isArchived);
}

function isReadyToCloseProject(project, progress = 0) {
  return !isCompletedProject(project) && !isArchivedProject(project) && progress >= 100;
}

function getProjectRelationshipLabel(project) {
  if (isCompletedProject(project)) {
    return "View Case Study";
  }

  if (isArchivedProject(project)) {
    return "Save";
  }

  return "Follow";
}
"""

if "function getProjectRelationshipLabel(project)" not in text:
    if old_helpers_anchor not in text:
        raise SystemExit("Could not find clampPercent helper anchor.")
    text = text.replace(old_helpers_anchor, new_helpers)

old_get_momentum_meta = """function getMomentumMeta(project, progress) {
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
"""

new_get_momentum_meta = """function getMomentumMeta(project, progress) {
  const raw = String(project?.momentumState || project?.momentum || '').trim().toLowerCase();

  if (isCompletedProject(project)) {
    return {
      label: 'Completed',
      tone: 'emerald',
      chip: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20',
    };
  }

  if (isArchivedProject(project)) {
    return {
      label: 'Archived',
      tone: 'slate',
      chip: 'bg-slate-50 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-white/[0.08]',
    };
  }

  if (isReadyToCloseProject(project, progress)) {
    return {
      label: 'Ready to close',
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
"""

if old_get_momentum_meta not in text:
    raise SystemExit("Could not find exact getMomentumMeta block.")
text = text.replace(old_get_momentum_meta, new_get_momentum_meta)

old_project_card_vars = """  const projectName = project.name || project.title || project.projectName || 'Untitled Project';
  const description = project.description || project.subtitle || project.category || '';
"""

new_project_card_vars = """  const projectName = project.name || project.title || project.projectName || 'Untitled Project';
  const description = project.description || project.subtitle || project.category || '';
  const relationshipLabel = getProjectRelationshipLabel(project);
  const relationshipButtonText =
    following && relationshipLabel === 'Follow' ? 'Following' : relationshipLabel;
"""

if old_project_card_vars not in text:
    raise SystemExit("Could not find ProjectCard variable block.")
text = text.replace(old_project_card_vars, new_project_card_vars)

old_button_text = """            {following ? 'Following' : 'Follow'}
"""

new_button_text = """            {relationshipButtonText}
"""

if old_button_text not in text:
    raise SystemExit("Could not find hardcoded Follow button text.")
text = text.replace(old_button_text, new_button_text)

path.write_text(text)
print(f"Patched {path}")
