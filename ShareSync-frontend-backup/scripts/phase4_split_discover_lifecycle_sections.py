from pathlib import Path

path = Path("src/components/ecosystem/FeaturedProjects.jsx")

if not path.exists():
    raise SystemExit(f"File not found: {path}")

text = path.read_text()

# 1) Add lifecycle grouping helpers.
helper_anchor = """function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}
"""

helpers = """function isDiscoverLiveProject(project) {
  return !isCompletedProject(project) && !isArchivedProject(project);
}

function hasCaseStudyData(project) {
  const caseStudy = project?.caseStudy || project?.caseStudyData || {};

  return Boolean(
    caseStudy?.summary ||
      caseStudy?.result ||
      caseStudy?.outcome ||
      caseStudy?.lessons ||
      project?.caseStudySummary ||
      project?.finalResult ||
      project?.result ||
      project?.results ||
      project?.outcome ||
      project?.lessons
  );
}

function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}
"""

if "function isDiscoverLiveProject(project)" not in text:
    if helper_anchor not in text:
      raise SystemExit("Could not find pluralize helper anchor.")
    text = text.replace(helper_anchor, helpers)

# 2) Add reusable FeaturedProjectsSection before the main export.
section_component = """function FeaturedProjectsSection({
  title,
  subtitle,
  projects,
  followStatuses,
  emptyState = null,
  showSortControls = false,
  sortBy,
  onSortChange,
  tone = 'emerald',
  icon: Icon = TrendingUp,
}) {
  if ((!projects || projects.length === 0) && !emptyState) {
    return null;
  }

  const toneClasses = {
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500',
    violet: 'text-violet-600 dark:text-violet-400 bg-violet-500',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-500',
    slate: 'text-slate-600 dark:text-zinc-300 bg-slate-400',
  };

  const activeTone = toneClasses[tone] || toneClasses.emerald;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeTone.split(' ').find((c) => c.startsWith('bg-')) || 'bg-emerald-500'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${activeTone.split(' ').find((c) => c.startsWith('bg-')) || 'bg-emerald-500'}`}></span>
            </span>

            <div className="min-w-0">
              <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${activeTone.replace(/bg-[^\\s]+/g, '').trim()}`}>
                <Icon className="w-3 h-3" />
                <span>{title}</span>
              </div>

              {subtitle && (
                <p className="mt-0.5 text-[11px] font-medium text-slate-400 dark:text-zinc-500 normal-case tracking-normal">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {showSortControls && (
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] shrink-0">
            {[
              { id: 'trending', label: 'Trending', icon: TrendingUp },
              { id: 'streak', label: 'Streaks', icon: Flame },
            ].map(({ id, label, icon: SortIcon }) => (
              <button
                key={id}
                onClick={() => onSortChange?.(id)}
                className={
                  'flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all '
                  + (sortBy === id
                    ? 'bg-white dark:bg-white/[0.10] text-slate-800 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/60')
                }
              >
                <SortIcon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {projects && projects.length > 0 ? (
          projects.map((project) => {
            const pid = project._id || project.id;
            return (
              <ProjectCard
                key={pid}
                project={project}
                initialFollowing={!!followStatuses[pid]}
              />
            );
          })
        ) : (
          emptyState
        )}
      </div>
    </section>
  );
}

"""

if "function FeaturedProjectsSection({" not in text:
    export_anchor = "export default function FeaturedProjects"
    if export_anchor not in text:
        raise SystemExit("Could not find FeaturedProjects export anchor.")
    text = text.replace(export_anchor, section_component + export_anchor)

# 3) Add lifecycle arrays after sorted.
sorted_block = """  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'trending') return (b.shipCount || 0) - (a.shipCount || 0);
    if (sortBy === 'newest') return 0; // preserve API order
    if (sortBy === 'streak') return (b.streak || 0) - (a.streak || 0);
    return 0;
  });
"""

sorted_replacement = """  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'trending') return (b.shipCount || 0) - (a.shipCount || 0);
    if (sortBy === 'newest') return 0; // preserve API order
    if (sortBy === 'streak') return (b.streak || 0) - (a.streak || 0);
    return 0;
  });

  const liveProjects = sorted.filter(isDiscoverLiveProject);
  const completedProjects = sorted.filter(isCompletedProject);
  const caseStudyProjects = completedProjects.filter(hasCaseStudyData);
  const recentlyShippedProjects = completedProjects.filter((project) => !hasCaseStudyData(project));
  const hasVisibleLifecycleProjects =
    liveProjects.length > 0 ||
    recentlyShippedProjects.length > 0 ||
    caseStudyProjects.length > 0;
"""

if "const liveProjects = sorted.filter(isDiscoverLiveProject);" not in text:
    if sorted_block not in text:
        raise SystemExit("Could not find sorted block.")
    text = text.replace(sorted_block, sorted_replacement)

# 4) Replace old single-section return block.
start = text.rfind('  return (\n    <div className="space-y-4">')
end = text.rfind('\n  );\n}')
if start == -1 or end == -1 or end <= start:
    raise SystemExit("Could not locate final FeaturedProjects return block.")

old_return = text[start:end + len('\n  );\n}')]
if "Live Ranking" not in old_return or "sorted.map" not in old_return:
    raise SystemExit("Final return block did not match expected FeaturedProjects shape.")

new_return = """  return (
    <div className="space-y-6">
      <FeaturedProjectsSection
        title="Live Ranking"
        subtitle="Active, planning, and ready-to-close projects."
        projects={liveProjects}
        followStatuses={followStatuses}
        sortBy={sortBy}
        onSortChange={setSortBy}
        showSortControls
        tone="emerald"
        icon={TrendingUp}
        emptyState={!hasVisibleLifecycleProjects ? <FeaturedProjectsEmptyState /> : null}
      />

      <FeaturedProjectsSection
        title="Recently Shipped"
        subtitle="Completed projects that have formally shipped."
        projects={recentlyShippedProjects}
        followStatuses={followStatuses}
        tone="violet"
        icon={Star}
      />

      <FeaturedProjectsSection
        title="Case Studies"
        subtitle="Completed projects with public proof, results, and lessons."
        projects={caseStudyProjects}
        followStatuses={followStatuses}
        tone="amber"
        icon={Zap}
      />
    </div>
  );
}
"""

text = text[:start] + new_return + text[end + len('\n  );\n}'):]

path.write_text(text)
print(f"Patched lifecycle sections in {path}")
