// /src/pages/ProjectHome.jsx
import React, { useEffect, useMemo, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import {
  getProject,
  getProjectFeed,
  postProjectUpdate,
  createTask,
  patchTask,
} from "../api/projects";

import ProjectHeader from "../components/project/ProjectHeader";
import ProjectKpis from "../components/project/ProjectKpis";
import ProjectActivityFeed from "../components/project/ProjectActivityFeed";
import MyNextActions from "../components/project/MyNextActions";
import RisksPanel from "../components/project/RisksPanel";
import MembersPanel from "../components/project/MembersPanel";
import AuditLog from "../components/project/AuditLog";

// --- tiny helpers for User Timing API ---
const mark = (name) => { try { performance?.mark?.(name); } catch {} };
const measure = (name, start, end) => {
  try { performance?.measure?.(name, start, end); } catch {}
};

export default function ProjectHome() {
  const { id } = useParams();
  const { user } = useContext(AuthContext) || {};
  const [project, setProject] = useState(null);
  const [feed, setFeed] = useState({ items: [], nextCursor: null });
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(true);
  const [error, setError] = useState("");

  // mark mount (useful if you ever want to measure from mount)
  useEffect(() => {
    mark("ss:projecthome:mounted");
  }, []);

  // load project
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getProject(id);
        if (!ignore) setProject(data);
      } catch (e) {
        if (!ignore) setError(e?.message || "Failed to load project");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [id]);

  // PERF: when project has loaded, record data-ready and a measure from nav-click if present
  useEffect(() => {
    if (!loading && project) {
      mark("ss:projecthome:data-ready");
      measure("perf:projecthome:data", "ss:nav-project-click", "ss:projecthome:data-ready");
      try {
        const entries = performance.getEntriesByName("perf:projecthome:data");
        const last = entries[entries.length - 1];
        if (last) {
          // eslint-disable-next-line no-console
          console.log(`[Perf] ProjectHome data ready: ${Math.round(last.duration)} ms`);
        }
      } catch {}
    }
  }, [loading, project]);

  // load feed
  const loadFeed = async (cursor) => {
    setFeedLoading(true);
    try {
      const res = await getProjectFeed(id, { limit: 20, cursor });
      setFeed((prev) =>
        cursor
          ? { items: [...prev.items, ...res.items], nextCursor: res.nextCursor }
          : { items: res.items, nextCursor: res.nextCursor }
      );
    } catch (e) {
      // non-fatal
    } finally {
      setFeedLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    loadFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // PERF: first activity render measure
  useEffect(() => {
    if (!feedLoading && feed.items.length > 0) {
      mark("ss:projecthome:first-activity");
      measure("perf:projecthome:first-activity", "ss:nav-project-click", "ss:projecthome:first-activity");
      try {
        const entries = performance.getEntriesByName("perf:projecthome:first-activity");
        const last = entries[entries.length - 1];
        if (last) {
          // eslint-disable-next-line no-console
          console.log(`[Perf] First activity render: ${Math.round(last.duration)} ms`);
        }
      } catch {}
    }
  }, [feedLoading, feed.items.length]);

  const handlePostUpdate = async (text) => {
    if (!text.trim()) return;
    const optimistic = {
      _id: `tmp-${Date.now()}`,
      text,
      userId: user?._id,
      createdAt: new Date().toISOString(),
    };
    setFeed((prev) => ({ ...prev, items: [optimistic, ...prev.items] }));
    try {
      const created = await postProjectUpdate(id, { text, mentions: [], files: [] });
      setFeed((prev) => ({
        ...prev,
        items: prev.items.map((it) => (it._id === optimistic._id ? created : it)),
      }));
    } catch (e) {
      setFeed((prev) => ({ ...prev, items: prev.items.filter((it) => it._id !== optimistic._id) }));
      throw e;
    }
  };

  const tasks = useMemo(() => project?.tasks ?? [], [project]);

  const handleAddTask = async (title) => {
    const created = await createTask(id, { title, status: "Not Started" });
    setProject((p) => ({ ...p, tasks: [created, ...(p?.tasks || [])] }));
  };

  const handlePatchTask = async (taskId, patch) => {
    const updated = await patchTask(id, taskId, patch);
    setProject((p) => ({
      ...p,
      tasks: (p?.tasks || []).map((t) => (String(t._id) === String(taskId) ? updated : t)),
    }));
  };

  if (loading) {
    return (
      <main id="main" role="main" tabIndex={-1}>
        <div className="ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-24 rounded-2xl bg-slate-200/60" />
            <div className="h-24 rounded-2xl bg-slate-200/60" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main id="main" role="main" tabIndex={-1}>
        <div className="ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-10 max-w-2xl mx-auto">
          <div className="rounded-2xl border border-rose-200/60 bg-white p-6">
            <h1 className="text-lg font-semibold text-rose-600">Failed to load project</h1>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-white"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!project) return null;

  return (
    <main id="main" role="main" tabIndex={-1}>
      <div className="ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-6 bg-ink-100 dark:bg-gray-900 min-h-screen max-w-6xl mx-auto">
        {/* Header */}
        <ProjectHeader project={project} onAddTask={handleAddTask} />

        {/* KPIs */}
        <div className="mt-4">
          <ProjectKpis project={project} />
        </div>

        {/* Main grid */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main: Activity feed (8 cols) */}
          <div className="lg:col-span-8">
            <ProjectActivityFeed
              items={feed.items}
              loading={feedLoading}
              onLoadMore={() => feed.nextCursor && loadFeed(feed.nextCursor)}
              hasMore={!!feed.nextCursor}
              onPostUpdate={handlePostUpdate}
            />
          </div>

          {/* Side rail (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <MyNextActions tasks={tasks} meId={user?._id} onPatchTask={handlePatchTask} />
            <RisksPanel project={project} />
            <MembersPanel members={project.members || []} />
            <AuditLog projectId={project._id} />
          </div>
        </div>
      </div>
    </main>
  );
}
