// src/pages/Projects.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import ProjectsCreate from './ProjectsCreate.jsx';
import ProjectListItem from '../components/projects/ProjectListItem.jsx';
import SkeletonBlock from '../components/skeleton/SkeletonBlock.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import RightRail from '../components/projects/RightRail.jsx';
import { listProjects } from '../api/projects';
import SectionHeader from '../components/ui/SectionHeader.jsx';
import TraceOutline from '../components/ui/TraceOutline.jsx';
import { bindShine } from '../utils/shine';
import GradientText from '../components/ui/GradientText.jsx';
import GradientPanel from "../components/frame/GradientPanel.jsx";
import { labelledTimestamp } from '../utils/formatters.js';
import Page from "../components/layout/Page.jsx";
import './Projects.css';

import { Users, Clock, Search, Rocket } from 'lucide-react';
import { track } from '../utils/telemetry';
import { toast } from '../components/ui/toast.jsx';

// Shared avatars with presence dots
import AvatarGroup from '../components/ui/AvatarGroup.jsx';

// NEW: Ship Celebration
import ShipCelebration from '../components/momentum/ShipCelebration.jsx';

/** Debounce a value to limit API calls while typing */
function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Read filters from URL */
function readParams(search) {
  const p = new URLSearchParams(search);
  return {
    query: p.get('query') ?? '',
    status: p.get('status') ?? 'all',
    owner:  p.get('owner')  ?? 'all',
    updated:p.get('updated')?? '7d',
  };
}

/** Write filters to URL */
function writeParams({ query, status, owner, updated }) {
  const p = new URLSearchParams();
  if (query) p.set('query', query);
  if (status && status !== 'all') p.set('status', status);
  if (owner && owner !== 'all') p.set('owner', owner);
  if (updated && updated !== '7d') p.set('updated', updated);
  const s = p.toString();
  return s ? `?${s}` : '';
}

/** Map status -> colorful accent */
function statusAccent(status) {
  const key = (status || '').toString().toLowerCase().replace(/\s+/g, '_');
  switch (key) {
    case 'in_progress':
    case 'inprogress':
    case 'in progress':
      return { bar: 'from-indigo-500 via-fuchsia-500 to-pink-500', chip: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'In Progress' };
    case 'completed':
      return { bar: 'from-emerald-500 via-teal-500 to-cyan-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Completed' };
    case 'not_started':
    case 'not started':
    default:
      return { bar: 'from-slate-400 via-slate-500 to-slate-600', chip: 'bg-slate-50 text-slate-700 border-slate-200', label: 'Not Started' };
  }
}

/* ───────────────────────── ProjectCard (local) ───────────────────────── */
function ProjectCard({ project, onOpen, onPrefetch, isHovered, onShip }) {
  const pid = project._id || project.id;
  const lastTs = project.lastActivityAt || project.updatedAt || project.createdAt;
  const rawStatus = project.status || '';
  const key =
    rawStatus === 'In Progress' ? 'in_progress' :
    rawStatus === 'Completed'   ? 'completed'   : 'not_started';
  const accent = statusAccent(key);

  // Mini KPIs (safe fallbacks)
  const m = project.metrics || {};
  const onTime = (m.onTimePct ?? m.onTime ?? null);
  const openTasks = (project.openTasks ?? m.openTasks ?? null);
  const tput = (m.throughputPerWeek?.value ?? m.tputWk ?? null);

  const members = Array.isArray(project.members) ? project.members.map((u) => ({
    id: u.id || u._id || u.userId || u.username || u.email,
    name: u.displayName || u.name || u.username || u.email,
    avatar: u.avatar || u.avatarUrl || u.photoURL || u.profilePicture || '',
  })) : [];

  return (
    <TraceOutline radius={16} paused={!isHovered}>
      <div
        className="group relative card glass rounded-2xl border border-border bg-surface shadow-sm overflow-hidden transition-all duration-300 hover:shadow-[0_8px_24px_rgba(16,24,40,0.12)] focus-ring"
        data-shine
        role="link"
        tabIndex={0}
        aria-label={`Open project ${project.title || 'untitled'}`}
        onClick={onOpen}
        onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}
        onMouseEnter={onPrefetch}
      >
        {/* DNA + Pulse */}
        <div
          className="project-dna"
          style={{ "--pulse": `${project.pulse || 2}s` }}
        >
          <span
            className="icon"
            style={{ color: project.color || "var(--accent)" }}
          >
            {project.icon || "Briefcase"}
          </span>
        </div>

        {/* Accent bar */}
        <div
          className={`absolute left-0 top-0 h-full w-1 origin-left bg-gradient-to-b ${accent.bar} transition-transform duration-300 ease-out group-hover:scale-x-[1.4]`}
          aria-hidden="true"
        />

        {/* Sweep */}
        <div
          className="pointer-events-none absolute inset-0 -translate-x-full opacity-0 bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10 transition duration-700 ease-out group-hover:opacity-100 group-hover:translate-x-full"
          aria-hidden="true"
        />

        {/* Main content */}
        <div className="px-3 sm:px-4 pt-3">
          <ProjectListItem project={project} />
        </div>

        {/* Mini KPIs + members */}
        <div className="px-3 sm:px-4 py-2 grid grid-cols-2 gap-2">
          <div className="rounded-md border border-border/60 bg-white/60 dark:bg-slate-900/40 px-2 py-1.5">
            <div className="text-[10px] text-muted">On-time %</div>
            <div className="text-sm font-semibold">{onTime ?? '—'}</div>
          </div>
          <div className="rounded-md border border-border/60 bg-white/60 dark:bg-slate-900/40 px-2 py-1.5">
            <div className="text-[10px] text-muted">Open tasks</div>
            <div className="text-sm font-semibold">{openTasks ?? '—'}</div>
          </div>
          <div className="rounded-md border border-border/60 bg-white/60 dark:bg-slate-900/40 px-2 py-1.5 col-span-2">
            <div className="text-[10px] text-muted">Throughput / wk</div>
            <div className="text-sm font-semibold">{tput ?? '—'}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-t border-border bg-white/60 dark:bg-slate-900/40">
          <div className="min-w-0 flex items-center gap-3">
            <AvatarGroup members={members} />
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${accent.chip}`}>
              <Users className="w-3 h-3" />
              {accent.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="whitespace-nowrap inline-flex items-center gap-1 timestamp"
              title={lastTs ? new Date(lastTs).toLocaleString() : undefined}
            >
              <Clock className="w-3 h-3" />
              {labelledTimestamp(lastTs, 'Updated')}
            </div>

            {/* SHIP BUTTON */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShip(project);
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1.5 text-xs font-medium text-white shadow-md hover:shadow-lg transition-all hover:scale-105 focus-ring"
              aria-label={`Ship project ${project.title}`}
            >
              <Rocket className="w-3.5 h-3.5" />
              Ship
            </button>
          </div>
        </div>

        <style jsx>{`
          .project-dna {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 36px;
            height: 36px;
            border-radius: 12px;
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(6px);
            display: grid;
            place-items: center;
            border: 1px solid rgba(255,255,255,0.2);
            z-index: 10;
          }
          .project-dna .icon {
            font-size: 18px;
            animation: pulse var(--pulse, 2s) infinite;
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
          }
        `}</style>
      </div>
    </TraceOutline>
  );
}

/* ───────────────────────────── Page ───────────────────────────── */
export default function Projects() {
  const navigate = useNavigate();
  const location = useLocation();
  const rootRef = useRef(null);
  const init = readParams(location.search);

  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const [query, setQuery]     = useState(init.query);
  const [status, setStatus]   = useState(init.status);
  const [owner, setOwner]     = useState(init.owner);
  const [updated, setUpdated] = useState(init.updated);

  const [hoverId, setHoverId] = useState(null);
  const [shipProject, setShipProject] = useState(null);

  useEffect(() => {
    const unbind = bindShine(rootRef.current || document);
    return () => unbind();
  }, []);

  useEffect(() => {
    const next = writeParams({ query, status, owner, updated });
    const current = location.search || '';
    if (next !== current) {
      navigate({ pathname: location.pathname, search: next }, { replace: true });
    }
  }, [query, status, owner, updated, location.pathname, location.search, navigate]);

  const debouncedQuery = useDebounce(query, 350);

  const abortRef = useRef(null);

  async function fetchProjects() {
    try { performance?.mark?.('ss:projects:fetch:start'); } catch {}

    setLoading(true);
    setError('');

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const items = await listProjects({
        query: debouncedQuery,
        status,
        owner,
        updated,
        signal: controller.signal,
      });

      const first = Array.isArray(items) ? items.slice(0, 12) : [];
      const rest  = Array.isArray(items) ? items.slice(12) : [];
      setProjects(first);
      setTimeout(() => {
        if (!controller.signal.aborted) {
          setProjects((prev) => [...prev, ...rest]);
          try {
            performance?.mark?.('ss:projects:fetch:end');
            performance?.measure?.('perf:projects:list-first-chunk', 'ss:projects:fetch:start', 'ss:projects:fetch:end');
          } catch {}
        }
      }, 0);
    } catch (e) {
      if (controller.signal.aborted) return;
      console.error('[Projects] load error', e);
      setError('Failed to load projects.');
      try { toast({ title: 'Failed to load projects', variant: 'error' }); } catch {}
      try { track('projects_load_error'); } catch {}
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
    return () => abortRef.current?.abort();
  }, [debouncedQuery, status, owner, updated]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const now = Date.now();

    const withinWindow = (iso) => {
      if (updated === 'all') return true;
      const dt = new Date(iso || Date.now()).getTime();
      const windowMs = updated === '7d' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
      return now - dt <= windowMs;
    };
    const statusMap = { not_started: 'Not Started', in_progress: 'In Progress', completed: 'Completed' };

    return (projects || []).filter((p) => {
      const matchQ =
        !q ||
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (Array.isArray(p.members) &&
          p.members.some((m) => (m?.username || m?.email || '').toLowerCase().includes(q)));

      const matchStatus = status === 'all' || (p.status && p.status === statusMap[status]);

      const meId = (window.__SS_USER && window.__SS_USER.id) || null;
      const matchOwner =
        owner === 'all' ||
        (owner === 'me' && (p.ownerId === meId || p.owner === meId)) ||
        (owner === 'team' && (p.ownerId !== meId && p.owner !== meId));

      const matchUpdated = withinWindow(p.updatedAt || p.lastActivityAt || p.createdAt);

      return matchQ && matchStatus && matchOwner && matchUpdated;
    });
  }, [projects, debouncedQuery, status, owner, updated]);

  const handleProjectCreated = (newProject) => {
    setShowCreate(false);
    if (newProject) {
      setProjects((prev) => [newProject, ...prev]);
      try { toast({ title: 'Project created', variant: 'success' }); } catch {}
      try { track('project_created', { projectId: newProject._id || newProject.id }); } catch {}
    }
  };

  const prefetchProject = (id) => {
    try { track('project_card_hover', { projectId: id }); } catch {}
  };

  const goToProject = (id) => {
    try { performance?.mark?.('ss:nav-project-click'); } catch {}
    try { track('project_card_click', { projectId: id }); } catch {}
    navigate(`/projects/${id}`);
  };

  const handleShip = (project) => {
    try { track('project_ship_clicked', { projectId: project._id }); } catch {}
    setShipProject(project);
  };

  return (
    <Page>
      <div
        ref={rootRef}
        data-accent="emerald"
        className="px-4 sm:px-6 lg:px-8 py-6 bg-bg text-text min-h-screen max-w-6xl mx-auto"
      >
        <h1 className="h-hero">Projects</h1>
        <p className="h-sub mt-1">Organize work by outcomes, track momentum.</p>

        <GradientPanel className="card accent-bar rounded-2xl border border-border bg-surface p-4 p-gradient specular">
          <span className="accent-bar__left" aria-hidden="true" />
          <div className="px-4 sm:px-6 md:px-8 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">
                  <GradientText variant="pandora">Projects</GradientText>
                </h1>
                <p className="text-sm text-muted mt-0.5">
                  Organize work by outcomes, not just tasks.
                </p>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                >
                  + New Project
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-2">
              <label className="relative flex items-center">
                <span className="sr-only">Search projects</span>
                <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search projects..."
                  className="search-bar w-full pl-9"
                  aria-label="Search projects"
                />
              </label>

              <label className="block">
                <span className="sr-only">Status</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  aria-label="Filter by status"
                >
                  <option value="all">All status</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="not_started">Not Started</option>
                </select>
              </label>

              <label className="block">
                <span className="sr-only">Owner</span>
                <select
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  aria-label="Filter by owner"
                >
                  <option value="all">All owners</option>
                  <option value="me">Owned by me</option>
                  <option value="team">Owned by teammates</option>
                </select>
              </label>

              <label className="block">
                <span className="sr-only">Updated window</span>
                <select
                  value={updated}
                  onChange={(e) => setUpdated(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  aria-label="Filter by last updated"
                >
                  <option value="7d">Updated in 7 days</option>
                  <option value="30d">Updated in 30 days</option>
                  <option value="all">Any time</option>
                </select>
              </label>
            </div>
          </div>
        </GradientPanel>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <SectionHeader icon="FolderKanban">All Projects</SectionHeader>
            </div>

            {loading && (
              <SkeletonBlock
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                height={164}
                radius={16}
                repeat={6}
              />
            )}

            {!!error && !loading && (
              <div className="rounded-2xl p-4 bg-surface border border-rose-200/60 dark:border-rose-400/20 motion-quick">
                <p className="text-rose-600 dark:text-rose-400 mb-3">{error}</p>
                <button onClick={fetchProjects} className="btn btn-primary" aria-label="Retry loading projects">
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <EmptyState
                icon="folder"
                title="No projects match your filters"
                primary={{ label: "+ New Project", onClick: () => setShowCreate(true) }}
                secondary={{ label: "Clear filters", onClick: () => { setQuery(''); setStatus('all'); setOwner('all'); setUpdated('7d'); } }}
              >
                Try adjusting filters or start your first project.
              </EmptyState>
            )}

            {!loading && !error && filtered.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[var(--g-gap,12px)]">
                {filtered.map((p) => {
                  const pid = p._id || p.id;
                  const isHovered = hoverId === pid;
                  return (
                    <ProjectCard
                      key={pid}
                      project={p}
                      isHovered={isHovered}
                      onOpen={() => goToProject(pid)}
                      onPrefetch={() => {
                        setHoverId(pid);
                        prefetchProject(pid);
                      }}
                      onShip={handleShip}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div className="hidden lg:block">
            <div className="mb-2">
              <SectionHeader icon="Users">Your workspace</SectionHeader>
            </div>
            <RightRail
              onQuickStatus={(s) => setStatus(s)}
              onQuickOwner={(o) => setOwner(o)}
              onQuickUpdated={(u) => setUpdated(u)}
            />
          </div>
        </div>

        {showCreate && (
          <ProjectsCreate
            onClose={() => setShowCreate(false)}
            onProjectCreated={handleProjectCreated}
          />
        )}

        {/* SHIP CELEBRATION */}
        <ShipCelebration
          project={shipProject}
          open={!!shipProject}
          onClose={() => setShipProject(null)}
        />
      </div>
    </Page>
  );
}