// /src/pages/Projects.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import ProjectsHeader from '../components/projects/ProjectsHeader.jsx';
import ProjectsCreate from './ProjectsCreate.jsx';
import ProjectListItem from '../components/projects/ProjectListItem.jsx';
import ProjectSkeleton from '../components/projects/ProjectSkeleton.jsx';
import ProjectsEmpty from '../components/projects/ProjectsEmpty.jsx';
import RightRail from '../components/projects/RightRail.jsx';
import { listProjects } from '../api/projects';
import SectionHeader from '../components/ui/SectionHeader.jsx';

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
    status: p.get('status') ?? 'all',   // 'all' | 'not_started' | 'in_progress' | 'completed'
    owner:  p.get('owner')  ?? 'all',   // 'all' | 'me' | 'team'
    updated:p.get('updated')?? '7d',    // '7d' | '30d' | 'all'
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

export default function Projects() {
  const navigate = useNavigate();
  const location = useLocation();
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
    // perf mark for “first list paint” SLA
    try { performance?.mark?.('ss:projects:fetch:start'); } catch {}

    setLoading(true);
    setError('');

    // cancel any in-flight request
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

      // incremental-ish: first 10 asap, rest next tick
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
    const statusMap = {
      not_started: 'Not Started',
      in_progress: 'In Progress',
      completed: 'Completed',
    };

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
    if (newProject) setProjects((prev) => [newProject, ...prev]);
  };

  // --- PERF: mark when navigating to ProjectHome ---
  const goToProject = (id) => {
    try { performance?.mark?.('ss:nav-project-click'); } catch {}
    navigate(`/projects/${id}`);
  };

  return (
    <main id="main" role="main" tabIndex={-1}>
      <div
        data-accent="emerald"
        className="ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-6 bg-gray-100 dark:bg-gray-800 min-h-screen max-w-6xl mx-auto"
      >
        <ProjectsHeader
          query={query}
          onQueryChange={setQuery}
          status={status}
          onStatusChange={setStatus}
          owner={owner}
          onOwnerChange={setOwner}
          updated={updated}
          onUpdatedChange={setUpdated}
          onCreateProject={() => setShowCreate(true)}
        />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mt-4">
          {/* LEFT: Project list */}
          <div className="space-y-4">
            {loading && (
              <div className="grid grid-cols-1 gap-3" aria-busy="true" aria-live="polite">
                {[...Array(4)].map((_, i) => (
                  <ProjectSkeleton key={i} />
                ))}
              </div>
            )}

            {!!error && !loading && (
              <div className="rounded-2xl p-4 bg-white dark:bg-slate-800 border border-rose-200/60 dark:border-rose-400/20 motion-quick">
                <p className="text-rose-600 dark:text-rose-400 mb-3">{error}</p>
                <button
                  onClick={fetchProjects}
                  className="btn btn-primary"
                  aria-label="Retry loading projects"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <ProjectsEmpty onCreate={() => setShowCreate(true)} />
            )}

            {!loading && !error && filtered.length > 0 && (
              <div className="grid grid-cols-1 gap-3">
                {filtered.map((p) => (
                  <ProjectListItem
                    key={p._id || p.id}
                    project={p}
                    onClick={() => goToProject(p._id || p.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Rail */}
          <div className="hidden lg:block">
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
