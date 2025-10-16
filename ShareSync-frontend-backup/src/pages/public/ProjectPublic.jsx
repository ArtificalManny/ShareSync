// src/pages/public/ProjectPublic.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPublicProject, getPublicActivity } from "../../api/public";
import { setMeta } from "../../utils/seo";
import SectionHeader from "../../components/ui/SectionHeader.jsx";
import Card from "../../components/ui/Card.jsx";
import ProjectKpis from "../../components/project/ProjectKpis.jsx";
import ProjectActivityFeed from "../../components/project/ProjectActivityFeed.jsx";
import "../../styles/public.css";

function useAsync(fn, deps) {
  const [state, setState] = useState({ loading: true, error: "", data: null });
  useEffect(() => {
    let ignore = false;
    setState({ loading: true, error: "", data: null });
    fn()
      .then((data) => !ignore && setState({ loading: false, error: "", data }))
      .catch((e) => !ignore && setState({ loading: false, error: e?.message || "Failed", data: null }));
    return () => { ignore = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

export default function ProjectPublic() {
  const { token } = useParams();

  const projState = useAsync(() => getPublicProject(token), [token]);
  const [page, setPage] = useState(1);
  const [feed, setFeed] = useState({ items: [], hasMore: true, loading: false });

  const project = projState.data;

  // SEO
  useEffect(() => {
    if (!project) return;
    setMeta({
      title: `${project.title} – Public status`,
      description: project.description || "Live momentum, updates, and recent activity.",
      image: `${window.location.origin}/og/project.png`,
    });
  }, [project]);

  // Activity fetch (public-only items, backend filtered)
  useEffect(() => {
    let ignore = false;
    async function load(p = 1) {
      setFeed((f) => ({ ...f, loading: true }));
      try {
        const res = await getPublicActivity(token, { page: p, limit: 20 });
        const items = Array.isArray(res?.items) ? res.items : [];
        const hasMore = (res?.total || items.length) > p * 20;
        if (!ignore) {
          setFeed((prev) => ({
            items: p === 1 ? items : [...prev.items, ...items],
            hasMore,
            loading: false,
          }));
        }
      } catch (e) {
        if (!ignore) setFeed((f) => ({ ...f, loading: false }));
      }
    }
    load(page);
    return () => { ignore = true; };
  }, [token, page]);

  const onLoadMore = () => setPage((p) => p + 1);

  const hero = useMemo(() => {
    if (!project) return null;
    const icon = project.icon || project.emoji || "📁";
    return (
      <header className="public-card">
        <div className="flex items-start gap-3">
          <div className="text-3xl select-none" aria-hidden="true">{icon}</div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">{project.title || "Project"}</h1>
            {project.description && (
              <p className="text-sm text-muted mt-1">{project.description}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300">
                Public status
              </span>
              {project.updatedAt && (
                <span className="text-[11px] text-muted">
                  Updated {new Date(project.updatedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }, [project]);

  if (projState.loading) {
    return (
      <main className="public-shell">
        <div className="public-watermark" />
        <div className="public-card animate-pulse h-28" />
        <div className="public-grid mt-3">
          <div className="public-card animate-pulse h-40" />
          <div className="public-card animate-pulse h-40" />
        </div>
      </main>
    );
  }

  if (projState.error || !project) {
    return (
      <main className="public-shell">
        <div className="public-watermark" />
        <div className="public-card">
          <h1 className="text-lg font-semibold">Project not found</h1>
          <p className="text-sm text-muted mt-1">
            This public project link may be invalid or disabled.
          </p>
          <div className="mt-3">
            <Link className="public-link" to="/signup">Create your own project →</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="public-shell">
      <div className="public-watermark" />

      {/* Hero */}
      {hero}

      {/* KPIs + About */}
      <section className="public-grid mt-3">
        <div className="public-card">
          <SectionHeader icon="Gauge">Momentum KPIs</SectionHeader>
          <div className="mt-3">
            {/* ProjectKpis tolerates partial data; if not, you can replace this with a 2–4 stat bar */}
            <ProjectKpis project={project} />
          </div>
        </div>

        <div className="public-card">
          <SectionHeader icon="Info">About</SectionHeader>
          <div className="mt-3 text-sm text-muted">
            <p>
              This is a read-only public snapshot. Private tasks, files, and comments are hidden.
            </p>
            {project.url && (
              <p className="mt-2">
                More:{" "}
                <a className="public-link" href={project.url} target="_blank" rel="noreferrer">
                  {project.url}
                </a>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Activity */}
      <section className="public-card mt-3">
        <SectionHeader icon="History">Recent public activity</SectionHeader>
        <div className="mt-3">
          <ProjectActivityFeed
            projectId={project._id || project.id || "public"}
            items={feed.items}
            loading={feed.loading}
            hasMore={feed.hasMore}
            onLoadMore={onLoadMore}
            // no composer, no refetch, no current user in public view
            onRefetch={undefined}
            onPostUpdate={undefined}
            currentUserId={null}
          />
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="public-card mt-3 text-center">
        <div className="text-sm">
          Like what you see?{" "}
          <Link className="public-link" to="/signup">
            Create your own project →
          </Link>
        </div>
      </footer>
    </main>
  );
}
