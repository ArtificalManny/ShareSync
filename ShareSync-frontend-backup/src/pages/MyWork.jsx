import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  ClipboardList,
  Flag,
  FolderKanban,
  RefreshCw,
} from 'lucide-react';

import YourMovesToday from '../components/focus/YourMovesToday';
import { getMyWork } from '../api/myWork';

const SECTION_ORDER = [
  'overdue',
  'today',
  'upcoming',
  'later',
  'completed',
];

const SECTION_META = {
  overdue: {
    title: 'Overdue',
    description: 'Work whose due date has passed.',
    icon: AlertTriangle,
  },
  today: {
    title: 'Today',
    description: 'Work due today.',
    icon: CalendarDays,
  },
  upcoming: {
    title: 'Upcoming',
    description: 'Work due during the next seven days.',
    icon: CircleDashed,
  },
  later: {
    title: 'Later',
    description: 'Longer-range work and items without a date.',
    icon: Flag,
  },
  completed: {
    title: 'Completed',
    description: 'Finished tasks, milestones, and checkpoints.',
    icon: CheckCircle2,
  },
};

function startOfLocalDay(date = new Date()) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
}

function getSection(item, now = new Date()) {
  if (item?.completed) return 'completed';

  const dueDate = item?.dueDate
    ? new Date(item.dueDate)
    : null;

  if (!dueDate || Number.isNaN(dueDate.getTime())) {
    return 'later';
  }

  const today = startOfLocalDay(now);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const upcomingEnd = new Date(today);
  upcomingEnd.setDate(upcomingEnd.getDate() + 8);

  if (dueDate < today) return 'overdue';
  if (dueDate < tomorrow) return 'today';
  if (dueDate < upcomingEnd) return 'upcoming';

  return 'later';
}

function formatDate(value) {
  if (!value) return 'No date';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year:
      date.getFullYear() !== new Date().getFullYear()
        ? 'numeric'
        : undefined,
  }).format(date);
}

function titleCase(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function WorkTypeIcon({ type }) {
  if (type === 'milestone') {
    return <Flag className="h-4 w-4" aria-hidden="true" />;
  }

  if (type === 'checkpoint') {
    return (
      <CheckCircle2
        className="h-4 w-4"
        aria-hidden="true"
      />
    );
  }

  return (
    <ClipboardList
      className="h-4 w-4"
      aria-hidden="true"
    />
  );
}

function WorkItemRow({ item, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="group flex w-full items-start gap-4 border-t border-slate-100 px-4 py-4 text-left transition first:border-t-0 hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/[0.04] sm:px-5"
    >
      <span
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
        style={{
          backgroundColor:
            item.projectColor || '#8B5CF6',
        }}
      >
        <WorkTypeIcon type={item.type} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-bold text-slate-900 dark:text-white">
            {item.title}
          </span>

          {item.blocked && (
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              Blocked
            </span>
          )}
        </span>

        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-500 dark:text-zinc-400">
          <span>{item.projectName}</span>
          <span aria-hidden="true">•</span>
          <span>{titleCase(item.type)}</span>
          <span aria-hidden="true">•</span>

          <span>
            {item.scope === 'assigned'
              ? 'Assigned to you'
              : 'Project work'}
          </span>

          {item.parentMilestone?.title && (
            <>
              <span aria-hidden="true">•</span>
              <span>{item.parentMilestone.title}</span>
            </>
          )}
        </span>

        <span className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600 dark:bg-white/10 dark:text-zinc-300">
            {formatDate(item.dueDate)}
          </span>

          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
            {titleCase(item.priority || 'normal')}
          </span>

          <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
            {titleCase(
              item.currentStage || item.status,
            )}
          </span>
        </span>
      </span>

      <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-violet-500 dark:text-zinc-600" />
    </button>
  );
}

export default function MyWork() {
  const navigate = useNavigate();

  const [payload, setPayload] = useState({
    generatedAt: null,
    projects: [],
    summary: {},
    items: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [projectFilter, setProjectFilter] =
    useState('all');

  const [typeFilter, setTypeFilter] =
    useState('all');

  const [priorityFilter, setPriorityFilter] =
    useState('all');

  const [statusFilter, setStatusFilter] =
    useState('all');

  const [completedExpanded, setCompletedExpanded] =
    useState(false);

  useEffect(() => {
    document.title = 'My Work | OpenShare';
  }, []);

  useEffect(() => {
    if (statusFilter === 'completed') {
      setCompletedExpanded(true);
    }
  }, [statusFilter]);

  const loadMyWork = useCallback(
    async ({ background = false } = {}) => {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      try {
        const result = await getMyWork();

        setPayload({
          generatedAt: result?.generatedAt || null,
          projects: Array.isArray(result?.projects)
            ? result.projects
            : [],
          summary: result?.summary || {},
          items: Array.isArray(result?.items)
            ? result.items
            : [],
        });
      } catch (requestError) {
        setError(
          requestError?.normalizedMessage ||
            requestError?.response?.data?.message ||
            requestError?.message ||
            'My Work could not be loaded.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadMyWork();
  }, [loadMyWork]);

  const filteredItems = useMemo(() => {
    return payload.items.filter((item) => {
      if (
        projectFilter !== 'all' &&
        item.projectId !== projectFilter
      ) {
        return false;
      }

      if (
        typeFilter !== 'all' &&
        item.type !== typeFilter
      ) {
        return false;
      }

      if (
        priorityFilter !== 'all' &&
        String(
          item.priority || 'normal',
        ).toLowerCase() !== priorityFilter
      ) {
        return false;
      }

      if (statusFilter === 'open' && item.completed) {
        return false;
      }

      if (
        statusFilter === 'completed' &&
        !item.completed
      ) {
        return false;
      }

      if (
        statusFilter === 'blocked' &&
        !item.blocked
      ) {
        return false;
      }

      const specialStatuses = [
        'all',
        'open',
        'completed',
        'blocked',
      ];

      if (
        !specialStatuses.includes(statusFilter) &&
        String(
          item.currentStage || item.status || '',
        ).toLowerCase() !== statusFilter
      ) {
        return false;
      }

      return true;
    });
  }, [
    payload.items,
    priorityFilter,
    projectFilter,
    statusFilter,
    typeFilter,
  ]);

  const groupedItems = useMemo(() => {
    const groups = {
      overdue: [],
      today: [],
      upcoming: [],
      later: [],
      completed: [],
    };

    filteredItems.forEach((item) => {
      groups[getSection(item)].push(item);
    });

    return groups;
  }, [filteredItems]);

  const openWorkItem = useCallback(
    (item) => {
      if (item?.href) {
        navigate(item.href);
      }
    },
    [navigate],
  );

  const openFocusMove = useCallback(
    (move) => {
      const projectId = String(
        move?.projectId || '',
      ).trim();

      if (projectId) {
        navigate(
          `/projects/${encodeURIComponent(projectId)}`,
        );
      }
    },
    [navigate],
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 dark:bg-[#09090b] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
              <FolderKanban className="h-4 w-4" />
              Personal execution
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              My Work
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600 dark:text-zinc-400">
              Assigned work and project commitments across
              OpenShare. Your 3 Moves highlights what
              matters most.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadMyWork({ background: true })
            }
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? 'animate-spin' : ''
              }`}
            />
            Refresh
          </button>
        </header>

        <section className="mb-8">
          <YourMovesToday
            variant="default"
            maxMoves={3}
            showHeader={true}
            showFooter={false}
            showRefresh={true}
            onMoveClick={openFocusMove}
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151519]">
          <div className="border-b border-slate-200 px-4 py-5 dark:border-white/10 sm:px-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">
                  All My Work
                </h2>

                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-zinc-400">
                  {filteredItems.length} of{' '}
                  {payload.items.length} items shown
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <select
                  value={projectFilter}
                  onChange={(event) =>
                    setProjectFilter(event.target.value)
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#0d0d10] dark:text-zinc-200"
                  aria-label="Filter by project"
                >
                  <option value="all">
                    All projects
                  </option>

                  {payload.projects.map((project) => (
                    <option
                      key={project.id}
                      value={project.id}
                    >
                      {project.name}
                    </option>
                  ))}
                </select>

                <select
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(event.target.value)
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#0d0d10] dark:text-zinc-200"
                  aria-label="Filter by work type"
                >
                  <option value="all">
                    All work types
                  </option>
                  <option value="task">Tasks</option>
                  <option value="milestone">
                    Milestones
                  </option>
                  <option value="checkpoint">
                    Checkpoints
                  </option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(event) =>
                    setPriorityFilter(event.target.value)
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#0d0d10] dark:text-zinc-200"
                  aria-label="Filter by priority"
                >
                  <option value="all">
                    All priorities
                  </option>
                  <option value="critical">
                    Critical
                  </option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#0d0d10] dark:text-zinc-200"
                  aria-label="Filter by status"
                >
                  <option value="all">
                    All statuses
                  </option>
                  <option value="open">Open</option>
                  <option value="backlog">
                    Backlog
                  </option>
                  <option value="todo">To do</option>
                  <option value="in_progress">
                    In progress
                  </option>
                  <option value="review">Review</option>
                  <option value="planned">
                    Planned
                  </option>
                  <option value="at_risk">
                    At risk
                  </option>
                  <option value="completed">
                    Completed
                  </option>
                  <option value="blocked">
                    Blocked
                  </option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-white/5"
                />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-white/10">
              {SECTION_ORDER.map((sectionKey) => {
                const section =
                  SECTION_META[sectionKey];

                const SectionIcon = section.icon;
                const items =
                  groupedItems[sectionKey];

                const isCompletedSection =
                  sectionKey === 'completed';

                const isExpanded =
                  !isCompletedSection ||
                  completedExpanded;

                const isEmpty = items.length === 0;

                const sectionDescription =
                  isCompletedSection &&
                  !completedExpanded &&
                  items.length > 0
                    ? `${items.length} finished items hidden to keep this view focused.`
                    : section.description;

                const headerContent = (
                  <>
                    <div className="flex min-w-0 items-center gap-3">
                      <SectionIcon className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" />

                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                          {section.title}
                        </h3>

                        <p className="truncate text-xs font-medium text-slate-500 dark:text-zinc-500">
                          {sectionDescription}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {isCompletedSection &&
                        items.length > 0 && (
                          <span className="hidden text-xs font-bold text-violet-600 dark:text-violet-300 sm:inline">
                            {completedExpanded
                              ? 'Hide completed'
                              : 'Show completed'}
                          </span>
                        )}

                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-600 shadow-sm ring-1 ring-slate-200 dark:bg-white/5 dark:text-zinc-300 dark:ring-white/10">
                        {items.length}
                      </span>

                      {isCompletedSection &&
                        items.length > 0 && (
                          <ChevronDown
                            className={`h-4 w-4 text-slate-400 transition-transform duration-200 dark:text-zinc-500 ${
                              completedExpanded
                                ? 'rotate-180'
                                : ''
                            }`}
                            aria-hidden="true"
                          />
                        )}
                    </div>
                  </>
                );

                return (
                  <section key={sectionKey}>
                    {isCompletedSection &&
                    items.length > 0 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setCompletedExpanded(
                            (current) => !current,
                          )
                        }
                        aria-expanded={completedExpanded}
                        className="flex w-full items-center justify-between bg-slate-50/80 px-4 py-3 text-left transition hover:bg-violet-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 dark:bg-white/[0.025] dark:hover:bg-violet-500/[0.06] sm:px-5"
                      >
                        {headerContent}
                      </button>
                    ) : (
                      <div
                        className={`flex items-center justify-between bg-slate-50/80 px-4 dark:bg-white/[0.025] sm:px-5 ${
                          isEmpty ? 'py-2.5' : 'py-3'
                        }`}
                      >
                        {headerContent}
                      </div>
                    )}

                    {!isEmpty &&
                      isExpanded &&
                      items.map((item) => (
                        <WorkItemRow
                          key={item.id}
                          item={item}
                          onOpen={openWorkItem}
                        />
                      ))}
                  </section>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
