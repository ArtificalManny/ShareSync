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

export default function ProjectHome() {
  const { id } = useParams();
  const { user } = useContext(AuthContext) || {};
  const [project, setProject] = useState(null);
  const [feed, setFeed] = useState({ items: [], nextCursor: null });
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(true);
  const [error, setError] = useState("");

  // load project
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getProject(id);
        if (!ignore) {
          setProject(data);
          // mark when base data arrives (used by feed perf mark)
          performance.mark('project_data_ready');
        }
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
    } catch {
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

  const handlePostUpdate = async (text) => {
    if (!text.trim()) return;
    // optimistic add
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
      // rollback optimistic
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
      <div className="ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-24 rounded-2xl bg-slate-200/60" />
          <div className="h-24 rounded-2xl bg-slate-200/60" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  if (!project) return null;

  return (
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
            projectId={project._id}
            items={feed.items}
            loading={feedLoading}
            hasMore={!!feed.nextCursor}
            onLoadMore={() => feed.nextCursor && loadFeed(feed.nextCursor)}
            onPostUpdate={handlePostUpdate}
            onRefetch={() => loadFeed()}
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
  );
}
