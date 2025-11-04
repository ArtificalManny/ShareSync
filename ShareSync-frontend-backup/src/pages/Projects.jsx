// src/pages/Projects.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import ProjectsCreate from './ProjectsCreate.jsx';
import ProjectCard from '../components/discovery/ProjectCard.jsx';
import SkeletonBlock from '../components/skeleton/SkeletonBlock.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import RightRail from '../components/projects/RightRail.jsx';
import { listProjects } from '../api/projects';
import SectionHeader from '../components/ui/SectionHeader.jsx';
import TraceOutline from '../components/ui/TraceOutline.jsx';
import { bindShine } from '../utils/shine';
import GradientText from '../components/ui/GradientText.jsx';
import GradientPanel from "../components/frame/GradientPanel.jsx";
import Page from "../components/layout/Page.jsx";
import './Projects.css';

import { Search } from 'lucide-react';
import { track } from '../utils/telemetry';
import { toast } from '../components/ui/toast.jsx';

import { useDebounce, readParams, writeParams } from '../utils/urlParams';

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

  if (!window.__SS_USER) {
    return (
      <Page>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Page>
    );
  }

  const meId = window.__SS_USER.id || window.__SS_USER._id;

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

      const matchOwner =
        owner === 'all' ||
        (owner === 'me' && (p.ownerId === meId || p.owner === meId)) ||
        (owner === 'team' && (p.ownerId !== meId && p.owner !== meId));

      const matchUpdated = withinWindow(p.updatedAt || p.lastActivityAt || p.createdAt);

      return matchQ && matchStatus && matchOwner && matchUpdated;
    });
  }, [projects, debouncedQuery, status, owner, updated, meId]);

  const handleProjectCreated = (newProject) => {
    setShowCreate(false);
    if (newProject) {
      setProjects((prev) => [newProject, ...prev]);
      toast({ title: 'Project created', variant: 'success' });
      track('project_created', { projectId: newProject._id });
      navigate(`/projects/${newProject._id}`);
    }
  };

  const prefetchProject = (id) => {
    track('project_card_hover', { projectId: id });
  };

  const goToProject = (id) => {
    track('project_card_click', { projectId: id });
    navigate(`/projects/${id}`);
  };

  const handleShip = (project) => {
    track('project_ship_clicked', { projectId: project._id });
    setShipProject(project);
  };

  return (
    <Page>
      <div ref={rootRef} className="px-4 sm:px-6 lg:px-8 py-6 bg-bg text-text min-h-screen max-w-6xl mx-auto">
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
                <p className="text-sm text-muted mt-0.5">Organize work by outcomes, not just tasks.</p>
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
              <div className="rounded-2xl p-4 bg-surface border border-rose-200/60 dark:border-rose-400/20">
                <p className="text-rose-600 dark:text-rose-400 mb-3">{error}</p>
                <button onClick={fetchProjects} className="btn btn-primary">Retry</button>
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
                  if (!pid) return null;
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
      </div>
    </Page>
  );
}