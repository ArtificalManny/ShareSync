import React from "react";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  FileText,
  Lightbulb,
  Target,
  Users,
} from "lucide-react";

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatDate(value) {
  if (!value) return "Not recorded";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getProjectName(project) {
  return project?.name || project?.title || project?.projectName || "Untitled Project";
}

function getMission(project) {
  return (
    project?.mission ||
    project?.description ||
    project?.summary ||
    "No mission statement was added for this project."
  );
}

function getFinalResult(project) {
  return (
    project?.completionSummary ||
    project?.finalResult ||
    project?.result ||
    project?.outcome ||
    "This project was formally completed. A final result summary can be added later."
  );
}

function getLessons(project) {
  const lessons =
    project?.lessons ||
    project?.caseStudy?.lessons ||
    project?.caseStudyLessons ||
    [];

  if (Array.isArray(lessons)) {
    return lessons.filter(Boolean);
  }

  if (typeof lessons === "string" && lessons.trim()) {
    return [lessons.trim()];
  }

  return [];
}

function getContributors(project) {
  const members = Array.isArray(project?.members) ? project.members : [];

  return members
    .map((member) => {
      const user = member?.userId || member?.user || member?.member || member;
      return (
        user?.displayName ||
        user?.fullName ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
        user?.username ||
        member?.name ||
        member?.email ||
        ""
      );
    })
    .filter(Boolean);
}

function StatPill({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-zinc-400">
        <Icon className="h-4 w-4 text-violet-500" />
        {label}
      </div>
      <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
        {value}
      </div>
    </div>
  );
}

function CaseStudySection({ icon: Icon, title, children }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white/75 p-5 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-800 dark:text-white">
          {title}
        </h3>
      </div>

      <div className="text-sm leading-7 text-slate-600 dark:text-zinc-300">
        {children}
      </div>
    </section>
  );
}

export default function ProjectCaseStudyCard({ project }) {
  const projectName = getProjectName(project);

  const completedTasks = safeNumber(
    project?.completedTasks ?? project?.metrics?.completedTasks,
    0
  );

  const taskCount = safeNumber(
    project?.taskCount ?? project?.metrics?.totalTasks,
    0
  );

  const shipCount = safeNumber(
    project?.shipCount ?? project?.metrics?.totalShips,
    completedTasks
  );

  const contributors = getContributors(project);

  const memberCount =
    contributors.length ||
    safeNumber(project?.memberCount ?? project?.metrics?.memberCount, 0);

  const lessons = getLessons(project);

  return (
    <article
      id="project-case-study"
      className="scroll-mt-28 overflow-hidden rounded-[2rem] border border-violet-200/70 bg-gradient-to-br from-white via-violet-50/40 to-white shadow-xl shadow-violet-100/40 dark:border-violet-500/20 dark:from-[#111116] dark:via-violet-500/10 dark:to-[#111116] dark:shadow-none"
    >
      <div className="border-b border-violet-100/80 px-5 py-5 dark:border-white/[0.08] sm:px-7">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          <Award className="h-3.5 w-3.5" />
          Shipped Project Case Study
        </div>

        <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
          {projectName}
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-zinc-300">
          A generated proof-of-work snapshot based on project activity, contributors,
          completed work, and lifecycle data.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatPill
            icon={CheckCircle2}
            label="Tasks shipped"
            value={taskCount > 0 ? `${completedTasks}/${taskCount}` : completedTasks}
          />
          <StatPill icon={Award} label="Ships" value={shipCount} />
          <StatPill icon={Users} label="Contributors" value={memberCount} />
          <StatPill
            icon={CalendarDays}
            label="Timeline"
            value={`${formatDate(project?.createdAt)} → ${formatDate(project?.completedAt)}`}
          />
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:p-7 lg:grid-cols-2">
        <CaseStudySection icon={Target} title="Mission">
          {getMission(project)}
        </CaseStudySection>

        <CaseStudySection icon={CheckCircle2} title="Final Result">
          {getFinalResult(project)}
        </CaseStudySection>

        <CaseStudySection icon={Users} title="Contributors">
          {contributors.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {contributors.slice(0, 12).map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-zinc-300"
                >
                  {name}
                </span>
              ))}
            </div>
          ) : (
            "Contributor details can be added as project member data becomes available."
          )}
        </CaseStudySection>

        <CaseStudySection icon={Lightbulb} title="Lessons">
          {lessons.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5">
              {lessons.map((lesson) => (
                <li key={lesson}>{lesson}</li>
              ))}
            </ul>
          ) : (
            "Lessons learned can be added later. For now, this project is preserved as public proof of completed work."
          )}
        </CaseStudySection>

        <div className="lg:col-span-2">
          <CaseStudySection icon={FileText} title="Proof of Work">
            This view is generated from existing OpenShare project data. Later,
            it can evolve into a richer public artifact with outcomes, screenshots,
            milestones, testimonials, and contributor credits.
          </CaseStudySection>
        </div>
      </div>
    </article>
  );
}
