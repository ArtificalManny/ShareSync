import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import ProjectsCreate from './ProjectsCreate.jsx';
import ProjectListItem from '../components/projects/ProjectListItem.jsx';
import ProjectSkeleton from '../components/projects/ProjectSkeleton.jsx';
import ProjectsEmpty from '../components/projects/ProjectsEmpty.jsx';
import RightRail from '../components/projects/RightRail.jsx';
import { listProjects } from '../api/projects';
import SectionHeader from '../components/ui/SectionHeader.jsx';
import TraceOutline from '../components/ui/TraceOutline.jsx';
import { bindShine } from '../utils/shine';
import GradientText from '../components/ui/GradientText.jsx';
import { labelledTimestamp } from '../utils/formatters.js';
import './Projects.css';

import { Users, Clock, Search } from 'lucide-react';
import { track } from '../utils/telemetry';
import { toast } from '../components/ui/Toaster.jsx';

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

function initials(nameOrEmail = '') {
  const name = String(nameOrEmail || '').trim();
  if (!name) return '•';
  const parts = name.split(/\s+/);
  if (parts.length === 1) {
    const at = name.indexOf('@');
    if (at > 0) return name.slice(0, 2).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

function Avatar({ user, size = 24 }) {
  const { avatarUrl, displayName, name, username, email } = user || {};
  const label = displayName || name || username || email || '';
  const scaleHover = 'transition-transform duration-200 ease-out group-hover:scale-[1.06]';
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={label}
        className={`inline-block rounded-full ring-2 ring-white dark:ring-slate-900 object-cover ${scaleHover}`}
        style={{ width: size, height: size }}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div
      className={`inline-grid place-items-center rounded-full bg-surface text-text ring-2 ring-white dark:ring-slate-900 text-[11px] font-semibold ${scaleHover}`}
      style={{ width: size, height: size }}
      aria-label={label}
      title={label}
    >
      {initials(label)}
    </div>
  );
}

function AvatarGroup({ members = [], max = 5 }) {
  const shown = members.slice(0, max);
  const extra = Math.max(0, members.length - shown.length);
  return (
    <div className="flex -space-x-2">
      {shown.map((m, i) => (
        <div key={m.id || m._id || m.username || m.email || i} className="inline-block">
          <Avatar user={m} />
        </div>
      ))}
      {extra > 0 && (
        <div
          className="inline-grid place-items-center rounded-full bg-surface text-text ring-2 ring-white dark:ring-slate-900 text-[11px] font-semibold transition-transform duration-200 ease-out group-hover:scale-[1.06]"
          style={{ width: 24, height: 24 }}
          title={`+${extra} more`}
        >
          +{extra}
        </div>
      )}
    </div>
  );
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

export default function Projects() {
  const navigate = useNavigate();
  const location = useLocation();
  const rootRef = useRef(null);
  const init = readParams(location.search);

  // UI + filter state
  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const [query, setQuery]     = useState(init.query);
  const [status, setStatus]   = useState(init.status);
  const [owner, setOwner]     = useState(init.owner);
  const [updated, setUpdated] = useState(init.updated);

  // marching-outline hover control
  const [hoverId, setHoverId] = useState(null);

  // Bind blue-shine to this page only
  useEffect(() => {
    const unbind = bindShine(rootRef.current || document);
    return () => unbind();
  }, []);

  // keep URL in sync
  useEffect(() => {
    const next = writeParams({ query, status, owner, updated });
    const current = location.search || '';
    if (next !== current) {
      navigate({ pathname: location.pathname, search: next }, { replace: true });
    }
  }, [query, status, owner, updated, location.pathname, location.search, navigate]);

  const debouncedQuery = useDebounce(query, 350);

  // === FETCH PROJECTS (with abort + robust errors) ===
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

      const first = Array.isArray(items) ? items.slice(0, 10) : [];
      const rest  = Array.isArray(items) ? items.slice(10) : [];
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
      // ✅ Toast + Telemetry on list fetch error
      try { toast({ title: 'Failed to load projects', variant: 'error' }); } catch {}
      try { track('projects_load_error'); } catch {}
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, status, owner, updated]);

  // client-side filtering fallback (if backend ignores params)
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

  // when a project is created, prepend and close modal
  const handleProjectCreated = (newProject) => {
    setShowCreate(false);
    if (newProject) {
      setProjects((prev) => [newProject, ...prev]);
      // ✅ Toast + Telemetry on create
      try { toast({ title: 'Project created', variant: 'success' }); } catch {}
      try { track('project_created', { projectId: newProject._id || newProject.id }); } catch {}
    }
  };

  // --- PERF: mark when navigating to ProjectHome ---
  const goToProject = (id) => {
    try { performance?.mark?.('ss:nav-project-click'); } catch {}
    navigate(`/projects/${id}`);
  };

  return (
    <main id="main" role="main" tabIndex={-1}>
      <div
        ref={rootRef}
        data-accent="emerald"
        className="px-4 sm:px-6 lg:px-8 py-6 bg-bg text-text min-h-screen max-w-6xl mx-auto"
      >
        {/* ✅ Unified header: title + subtitle + search/filters + CTA */}
        <section className="card accent-bar rounded-2xl border border-border bg-surface">
          <span className="accent-bar__left" aria-hidden="true" />
          <div className="px-4 sm:px-6 md:px-8 py-4">
            {/* Title + CTA */}
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

            {/* Controls row (search + filters) */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-2">
              {/* Search */}
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

              {/* Status */}
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

              {/* Owner */}
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

              {/* Updated within */}
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
        </section>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mt-4">
          {/* LEFT: Project list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <SectionHeader icon="FolderKanban">All Projects</SectionHeader>
            </div>

            {loading && (
              <div className="grid grid-cols-1 gap-3" aria-busy="true" aria-live="polite">
                {[...Array(4)].map((_, i) => (
                  <ProjectSkeleton key={i} />
                ))}
              </div>
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
              <ProjectsEmpty onCreate={() => setShowCreate(true)} />
            )}

            {!loading && !error && filtered.length > 0 && (
              <div className="grid grid-cols-1 gap-3">
                {filtered.map((p) => {
                  const pid = p._id || p.id;
                  const lastTs = p.lastActivityAt || p.updatedAt || p.createdAt;

                  const rawStatus = p.status || '';
                  const key =
                    rawStatus === 'In Progress' ? 'in_progress' :
                    rawStatus === 'Completed'   ? 'completed'   : 'not_started';
                  const accent = statusAccent(key);

                  const isHovered = hoverId === pid;

                  return (
                    <TraceOutline key={pid} radius={16} paused={!isHovered}>
                      {/* OUTER CARD */}
                      <div
                        className="group project-card relative rounded-2xl border border-border bg-surface shadow-sm overflow-hidden transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(16,24,40,0.12)]"
                        data-shine
                        role="button"
                        tabIndex={0}
                        aria-label={`Open project ${p.title || 'untitled'}`}
                        onMouseEnter={() => setHoverId(pid)}
                        onMouseLeave={() => setHoverId(null)}
                        onClick={() => goToProject(pid)}
                        onKeyDown={(e) => { if (e.key === 'Enter') goToProject(pid); }}
                      >
                        {/* Color bar (left) */}
                        <div
                          className={`absolute left-0 top-0 h-full w-1 origin-left bg-gradient-to-b ${accent.bar} transition-transform duration-300 ease-out group-hover:scale-x-[1.4]`}
                          aria-hidden="true"
                        />

                        {/* Sweep */}
                        <div
                          className="pointer-events-none absolute inset-0 -translate-x-full opacity-0 bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10 transition duration-700 ease-out group-hover:opacity-100 group-hover:translate-x-full"
                          aria-hidden="true"
                        />

                        {/* Content */}
                        <ProjectListItem project={p} />

                        {/* Footer */}
                        <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-t border-border bg-white/60 dark:bg-slate-900/40">
                          <div className="min-w-0 flex items-center gap-3">
                            <AvatarGroup members={Array.isArray(p.members) ? p.members : []} />
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${accent.chip}`}>
                              <Users className="w-3 h-3" />
                              {accent.label}
                            </span>
                          </div>
                          <div
                            className="whitespace-nowrap inline-flex items-center gap-1 timestamp"
                            title={lastTs ? new Date(lastTs).toLocaleString() : undefined}
                          >
                            <Clock className="w-3 h-3" />
                            {labelledTimestamp(lastTs, 'Updated')}
                          </div>
                        </div>
                      </div>
                    </TraceOutline>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Rail */}
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

        {/* Create modal */}
        {showCreate && (
          <ProjectsCreate
            onClose={() => setShowCreate(false)}
            onProjectCreated={handleProjectCreated}
          />
        )}
      </div>
    </main>
  );
}
