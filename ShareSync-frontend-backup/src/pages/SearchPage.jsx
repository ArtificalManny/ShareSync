// /src/pages/SearchPage.jsx
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Loader2,
  Folder,
  CheckCircle2,
  User as UserIcon,
  MessageSquare,
  File as FileIcon,
  Megaphone,
  MessageCircle,
} from "lucide-react";
import {
  searchAll,
  searchProjectContent,
} from "../api/search";
import { trackSearchUsed, trackSearchFilterApplied } from "../utils/telemetry";
import "../styles/card.css";
import "../styles/search.css";

// Result cards
import ProjectResultCard from "../components/search/cards/ProjectResultCard";
import UserResultCard from "../components/search/cards/UserResultCard";
import PostResultCard from "../components/search/cards/PostResultCard";
import FileResultCard from "../components/search/cards/FileResultCard";
import TaskResultCard from "../components/search/cards/TaskResultCard";

// Filters
import SearchFilters from "../components/search/SearchFilters";
// Tokens
import { parseSearchTokens, normalizeTypes } from "../utils/searchTokens";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { useAuth } from "../context/AuthContext";

const TYPE_META = {
  project: {
    icon: Folder,
    label: "Projects",
  },
  task: {
    icon: CheckCircle2,
    label: "Moves",
  },
  user: {
    icon: UserIcon,
    label: "People",
  },
  post: {
    icon: MessageSquare,
    label: "Posts",
  },
  file: {
    icon: FileIcon,
    label: "Files",
  },
  announcement: {
    icon: Megaphone,
    label: "Announcements",
  },
  teamRoom: {
    icon: MessageCircle,
    label: "Team Room",
  },
};

const ALL_TYPES =
  Object.keys(TYPE_META);

// ═══════════════════════════════════════════════════════════════════════════════
// ⭐ WORLD-CLASS FIX: Data Adapter Pattern
// Resolves the impedance mismatch between api/search.js (flat array)
// and SearchPage UI (categorized object). Also extracts the 'raw' payload
// so child cards get exactly the database document they expect!
// ═══════════════════════════════════════════════════════════════════════════════
function coerceResults(data) {
  const result = {
    projects: [],
    tasks: [],
    users: [],
    posts: [],
    files: [],
    announcements: [],
    teamRoom: [],
  };

  // 1. Handle modern unified flat array from searchAll()
  if (Array.isArray(data)) {
    data.forEach(item => {
      // Extract raw DB document so standard cards render perfectly
      const payload = item.raw || item; 
      
      if (item.type === 'project') result.projects.push(payload);
      else if (item.type === 'task') result.tasks.push(payload);
      else if (item.type === 'person' || item.type === 'user') result.users.push(payload);
      else if (item.type === 'post') result.posts.push(payload);
      else if (item.type === 'file') result.files.push(payload);
      else if (item.type === 'announcement') result.announcements.push(payload);
      else if (item.type === 'teamRoom') result.teamRoom.push(payload);
    });
    return result;
  }

  // 2. Handle legacy object shape
  result.projects = Array.isArray(data?.projects) ? data.projects : [];
  result.tasks    = Array.isArray(data?.tasks) ? data.tasks : [];
  result.users    = Array.isArray(data?.users) ? data.users : [];
  result.posts    = Array.isArray(data?.posts) ? data.posts : [];
  result.files    = Array.isArray(data?.files) ? data.files : [];
  result.announcements =
    Array.isArray(data?.announcements)
      ? data.announcements
      : [];
  result.teamRoom =
    Array.isArray(data?.teamRoom)
      ? data.teamRoom
      : [];
  
  return result;
}

function normalizeComparable(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeId(value) {
  return String(value || "").trim();
}

// unified-project-search-page-v1
function stripSearchMarkup(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function ProjectContentResultCard({
  item,
  type,
  onOpen,
}) {
  const meta =
    TYPE_META[type] ||
    TYPE_META.file;

  const Icon =
    meta.icon;

  const title =
    item?.title ||
    item?.originalName ||
    item?.threadTitle ||
    (
      type === 'announcement'
        ? 'Untitled Announcement'
        : type === 'teamRoom'
          ? 'Team Room result'
          : type === 'task'
            ? 'Untitled Move'
            : 'Untitled File'
    );

  const body = stripSearchMarkup(
    item?.description ||
    item?.message ||
    item?.content ||
    item?.mimeType ||
    item?.category ||
    '',
  );

  const subtype =
    item?.subtype === 'message'
      ? 'Message'
      : item?.subtype === 'thread'
        ? 'Thread'
        : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start gap-3 text-left"
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/15">
        <Icon
          className="h-4 w-4"
          aria-hidden="true"
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-bold text-slate-900 dark:text-white">
            {title}
          </span>

          {subtype ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:bg-white/[0.06] dark:text-zinc-400">
              {subtype}
            </span>
          ) : null}
        </span>

        {body ? (
          <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500 dark:text-zinc-400">
            {body}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export default function SearchPage() {
  useDocumentTitle("Search");
  const { user: authUser } = useAuth();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const initialQ =
    params.get("q") || "";

  const initialSort =
    params.get("sort") ||
    "relevance";

  const projectId =
    params.get("projectId") ||
    "";

  const initialTypes =
    normalizeTypes(
      params.get("types"),
      ALL_TYPES,
    );

  const requestedScope =
    params.get("scope") ||
    "all";

  const initialScope =
    requestedScope === "project" &&
    !projectId
      ? "all"
      : requestedScope;

  const [q, setQ] = useState(initialQ);
  const [types, setTypes] = useState(initialTypes.length ? initialTypes : ALL_TYPES);
  const [sort, setSort] = useState(initialSort);
  const [scope, setScope] = useState(initialScope);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    projects: [],
    tasks: [],
    users: [],
    posts: [],
    files: [],
    announcements: [],
    teamRoom: [],
  });

  // React Router can keep this page mounted while the address-bar query
  // changes. Resynchronize local search state so deep links and project
  // scoped URLs are respected instead of being overwritten by stale state.
  useLayoutEffect(() => {
    const urlParams = new URLSearchParams(location.search);

    const nextQ =
      urlParams.get("q") ||
      "";

    const nextSort =
      urlParams.get("sort") ||
      "relevance";

    const nextProjectId =
      urlParams.get("projectId") ||
      "";

    const requestedNextScope =
      urlParams.get("scope") ||
      "all";

    const nextScope =
      requestedNextScope === "project" &&
      !nextProjectId
        ? "all"
        : requestedNextScope;

    const parsedTypes =
      normalizeTypes(
        urlParams.get("types"),
        ALL_TYPES,
      );

    const nextTypes =
      parsedTypes.length
        ? parsedTypes
        : ALL_TYPES;

    setQ((current) =>
      current === nextQ
        ? current
        : nextQ,
    );

    setSort((current) =>
      current === nextSort
        ? current
        : nextSort,
    );

    setScope((current) =>
      current === nextScope
        ? current
        : nextScope,
    );

    setTypes((current) => {
      const unchanged =
        current.length === nextTypes.length &&
        current.every(
          (value, index) =>
            value === nextTypes[index],
        );

      return unchanged
        ? current
        : nextTypes;
    });
  }, [location.search]);

  // For a11y: count live region
  const liveRef = useRef(null);

  // Keyboard nav across the flattened result list
  const [activeIdx, setActiveIdx] = useState(0);
  const flat = useMemo(() => {
    const seq = [];
    if (types.includes("project")) results.projects.forEach((x) => seq.push({ type: "project", data: x }));
    if (types.includes("task"))    results.tasks.forEach((x) => seq.push({ type: "task", data: x }));
    if (types.includes("user"))    results.users.forEach((x) => seq.push({ type: "user", data: x }));
    if (types.includes("post"))    results.posts.forEach((x) => seq.push({ type: "post", data: x }));
    if (types.includes("file"))    results.files.forEach((x) => seq.push({ type: "file", data: x }));
    if (types.includes("announcement")) results.announcements.forEach((x) => seq.push({ type: "announcement", data: x }));
    if (types.includes("teamRoom")) results.teamRoom.forEach((x) => seq.push({ type: "teamRoom", data: x }));
    return seq;
  }, [results, types]);

  const tokens = useMemo(() => parseSearchTokens(q || ""), [q]);

  // Run search when q/types/sort/scope changes (debounced)
  useEffect(() => {
    let alive = true;

    const doSearch = async () => {
      // keep URL in sync
      const queryTypes = types.join(",");
      const nextParams = new URLSearchParams(location.search);
      nextParams.set("q", q);
      nextParams.set("sort", sort);
      nextParams.set("types", queryTypes);
      nextParams.set("scope", scope);

      const nextSearch =
        nextParams.toString();

      const currentSearch =
        location.search.startsWith("?")
          ? location.search.slice(1)
          : location.search;

      if (nextSearch !== currentSearch) {
        setParams(nextParams, {
          replace: true,
        });
      }

      const payload = {
        q,
        types,
        sort,
        scope,
        page: 1,
        limit: 25,
      };

      setLoading(true);
      try {
        let data;

        if (
          scope === "project" &&
          projectId
        ) {
          const projectResults =
            await searchProjectContent(
              projectId,
              q,
              payload.limit,
            );

          data = projectResults.filter((item) => {
            // Project search returns people as "person", while the UI filter
            // uses the canonical type "user". Normalize before filtering so
            // valid People results are not discarded.
            const normalizedType =
              item?.type === "person"
                ? "user"
                : item?.type;

            return types.includes(normalizedType);
          });
        } else {
          try {
            data =
              await searchAll(payload);
          } catch {
            data =
              await searchAll(q);
          }
        }

        if (!alive) return;
        const coerced = coerceResults(data);
        setResults(coerced);

        // live region announce
        const total = [
          "projects",
          "tasks",
          "users",
          "posts",
          "files",
          "announcements",
          "teamRoom",
        ].reduce(
          (count, key) =>
            count +
            (
              coerced[key]?.length ||
              0
            ),
          0,
        );
        if (liveRef.current) liveRef.current.textContent = `${total} results`;

        try { trackSearchUsed?.({ q, types, sort, scope }); } catch {}
      } catch (err) {
        if (alive) {
          setResults({
            projects: [],
            tasks: [],
            users: [],
            posts: [],
            files: [],
            announcements: [],
            teamRoom: [],
          });
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    const timer = setTimeout(doSearch, 150);
    return () => { alive = false; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, types.join("|"), sort, scope, projectId]);

  const toggleType = (t) => {
    setTypes((prev) => {
      const has = prev.includes(t);
      const next = has ? prev.filter((x) => x !== t) : [...prev, t];
      try { trackSearchFilterApplied?.({ type: t, enabled: !has }); } catch {}
      return next.length ? next : prev; // avoid zero-type state
    });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    // Effect already fires telemetry; this covers explicit submit actions too
    try { trackSearchUsed?.({ q, types, sort, scope, submit: true }); } catch {}
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, Math.max(0, flat.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    }
  };

  const openItem = (item) => {
    if (!item) return;

    const {
      type,
      data,
    } = item;

    if (type === "project") {
      navigate(
        `/projects/${data._id || data.id}`,
      );
      return;
    }

    if (type === "task") {
      const resultProjectId =
        data.projectId ||
        data.project_id ||
        data.project?._id ||
        data.project?.id;

      if (resultProjectId) {
        const target =
          new URLSearchParams({
            view: "tasks",
          });

        const taskId =
          data._id ||
          data.id;

        if (taskId) {
          target.set(
            "task",
            taskId,
          );
        }

        navigate(
          `/projects/${resultProjectId}?${target.toString()}`,
        );
      } else {
        navigate("/projects");
      }

      return;
    }

    if (type === "user") {
      const profileKey =
        data.username ||
        data.handle ||
        data.slug ||
        data._id ||
        data.id;

      const resultUsername =
        normalizeComparable(
          data.username ||
          data.handle ||
          data.slug,
        );

      const resultId =
        normalizeId(
          data._id ||
          data.id ||
          data.userId,
        );

      const authUsername =
        normalizeComparable(
          authUser?.username ||
          authUser?.handle ||
          authUser?.slug,
        );

      const authId =
        normalizeId(
          authUser?._id ||
          authUser?.id ||
          authUser?.userId,
        );

      const isCurrentUser =
        Boolean(
          resultUsername &&
          authUsername &&
          resultUsername === authUsername,
        ) ||
        Boolean(
          resultId &&
          authId &&
          resultId === authId,
        );

      navigate(
        isCurrentUser
          ? "/profile"
          : profileKey
            ? `/profile/${encodeURIComponent(
                String(profileKey),
              )}`
            : "/profile",
      );

      return;
    }

    if (type === "post") {
      const resultProjectId =
        data.projectId ||
        data.project?.id ||
        data.project?._id;

      if (resultProjectId) {
        navigate(
          `/projects/${resultProjectId}`,
        );
      }

      return;
    }

    if (type === "file") {
      const resultProjectId =
        data.projectId ||
        data.project?.id ||
        data.project?._id;

      if (resultProjectId) {
        const target =
          new URLSearchParams({
            view: "files",
          });

        const fileId =
          data._id ||
          data.id;

        if (fileId) {
          target.set(
            "file",
            fileId,
          );
        }

        navigate(
          `/projects/${resultProjectId}?${target.toString()}`,
        );
      }

      return;
    }

    if (type === "announcement") {
      const resultProjectId =
        data.projectId;

      if (resultProjectId) {
        const target =
          new URLSearchParams({
            view: "announcements",
          });

        const announcementId =
          data._id ||
          data.id;

        if (announcementId) {
          target.set(
            "announcement",
            announcementId,
          );
        }

        navigate(
          `/projects/${resultProjectId}?${target.toString()}`,
        );
      }

      return;
    }

    if (type === "teamRoom") {
      const resultProjectId =
        data.projectId;

      if (!resultProjectId) {
        return;
      }

      const target =
        new URLSearchParams({
          view: "discussion",
        });

      const threadId =
        data.threadId ||
        (
          data.subtype === "thread"
            ? data._id || data.id
            : ""
        );

      if (threadId) {
        target.set(
          "thread",
          threadId,
        );
      }

      if (data.subtype === "message") {
        const messageId =
          data._id ||
          data.id;

        if (messageId) {
          target.set(
            "message",
            messageId,
          );
        }
      }

      navigate(
        `/projects/${resultProjectId}?${target.toString()}`,
      );
    }
  };

  const renderGroup = (tKey, rows) => {
    if (!types.includes(tKey) || rows.length === 0) return null;
    const { icon: Icon, label } = TYPE_META[tKey] || {};
    const rawItems = (() => {
      const isProjectContent =
        scope === "project" &&
        [
          "task",
          "file",
          "announcement",
          "teamRoom",
        ].includes(tKey);

      if (isProjectContent) {
        return rows.map((row) => (
          <ProjectContentResultCard
            key={`${row.subtype || tKey}:${row._id || row.id}`}
            item={row}
            type={tKey}
            onOpen={() =>
              openItem({
                type: tKey,
                data: row,
              })
            }
          />
        ));
      }

      if (tKey === "project") return rows.map(r => <ProjectResultCard key={r._id || r.id} project={r} />);
      if (tKey === "user")    return rows.map(r => <UserResultCard    key={r._id || r.id || r.username} user={r} />);
      if (tKey === "post")    return rows.map(r => <PostResultCard    key={r._id || r.id} post={r} />);
      if (tKey === "file")    return rows.map(r => <FileResultCard    key={r._id || r.id} file={r} />);
      if (tKey === "task")    return rows.map(r => <TaskResultCard    key={r._id || r.id} task={r} />);

      if (
        tKey === "announcement" ||
        tKey === "teamRoom"
      ) {
        return rows.map((row) => (
          <ProjectContentResultCard
            key={`${tKey}:${row._id || row.id}`}
            item={row}
            type={tKey}
            onOpen={() =>
              openItem({
                type: tKey,
                data: row,
              })
            }
          />
        ));
      }

      return null;
    })();

    const items = React.Children.toArray(rawItems).map((child, index) => (
      <div
        key={child.key || `${tKey}:${index}`}
        className="search-result-card-refined group rounded-2xl border border-violet-100/70 bg-white/90 ring-1 ring-transparent shadow-[0_1px_0_rgba(79,70,229,0.04)] transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-violet-200 hover:bg-white hover:shadow-[0_16px_40px_rgba(79,70,229,0.10)] dark:border-violet-500/10 dark:bg-[#131318]/90 dark:shadow-none dark:hover:border-violet-500/30 dark:hover:bg-[#17171d] [&>a]:block [&>a]:px-4 [&>a]:py-3 sm:[&>a]:px-5 sm:[&>a]:py-3.5 [&>button]:block [&>button]:w-full [&>button]:px-4 [&>button]:py-3 sm:[&>button]:px-5 sm:[&>button]:py-3.5 [&>div]:px-4 [&>div]:py-3 sm:[&>div]:px-5 sm:[&>div]:py-3.5"
      >
        {child}
      </div>
    ));

    return (
      <section className="search-result-section-refined mt-5" aria-label={label}>
        <div className="overflow-hidden rounded-[1.5rem] border border-violet-100/80 bg-gradient-to-br from-white via-violet-50/45 to-slate-50 shadow-[0_18px_55px_rgba(79,70,229,0.08)] backdrop-blur dark:border-violet-500/15 dark:from-[#101014]/95 dark:via-violet-950/15 dark:to-[#0b0b10]/95 dark:shadow-none">
          <div className="search-group-header-refined flex items-center gap-3 border-b border-violet-100/80 bg-gradient-to-r from-violet-50/80 via-white/75 to-sky-50/60 px-4 py-3 sm:px-5 dark:border-violet-500/15 dark:from-violet-950/20 dark:via-white/[0.02] dark:to-sky-950/10">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/15">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
                {label}
              </div>
              <div className="text-xs text-slate-400 dark:text-zinc-500">
                {rows.length} result{rows.length === 1 ? "" : "s"}
              </div>
            </div>

            <span className="ml-auto inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-100 px-2.5 text-[11px] font-semibold text-slate-500 dark:bg-white/[0.05] dark:text-zinc-400">
              {rows.length}
            </span>
          </div>

          <div className="space-y-2 p-2.5 sm:p-3" role="list">
            {items}
          </div>
        </div>
      </section>
    );
  };

  const totalResults = [
    "projects",
    "tasks",
    "users",
    "posts",
    "files",
    "announcements",
    "teamRoom",
  ].reduce(
    (count, key) =>
      count +
      (
        results[key]?.length ||
        0
      ),
    0,
  );

  return (
    <main id="main" role="main" tabIndex={-1} onKeyDown={onKeyDown} className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.08),transparent_34%),linear-gradient(180deg,#F8FAFC_0%,#F5F7FF_46%,#F8FAFC_Available)] dark:bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.12),transparent_34%),linear-gradient(180deg,#09090B_0%,#101014_48%,#09090B_Available)]">
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
        
        {/* Search Header */}
        <div className="search-heading-polished mb-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600 shadow-sm dark:border-violet-500/15 dark:bg-white/[0.03] dark:text-violet-300">
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            Workspace index
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-[1.7rem]">
            Search OpenShare
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-zinc-400">
            Find projects, people, tasks, posts, and files across your workspace.
          </p>
        </div>

        <div className="search-panel-polished search-hue-refined relative overflow-hidden rounded-[1.35rem] border border-violet-100/80 bg-gradient-to-br from-white via-violet-50/70 to-sky-50/55 p-4 shadow-[0_18px_60px_rgba(79,70,229,0.10)] backdrop-blur dark:border-violet-500/15 dark:from-[#111113] dark:via-violet-950/20 dark:to-sky-950/10 dark:shadow-none">
          {/* Search input */}
          <form onSubmit={onSubmit} role="search" aria-label="Global search">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50 ring-1 ring-violet-100 dark:bg-violet-500/10 dark:ring-violet-500/15">
                <Search className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden="true" />
              </div>
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setActiveIdx(0); }}
                placeholder="Search @users, #projects, and more…"
                className="flex-1 border-none bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-zinc-600"
                aria-label="Search query"
              />
              <button
                type="submit"
                className="rounded-xl bg-slate-100 px-5 py-2 text-sm font-bold text-slate-700 transition-all hover:bg-violet-600 hover:text-white dark:bg-[#1f1f23] dark:text-zinc-300"
                aria-label="Run search"
              >
                Search
              </button>
            </div>
          </form>

          {/* Parsed tokens */}
          {tokens.atUsers.length > 0 || tokens.hashProjects.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2" aria-hidden="false">
              {tokens.atUsers.map((u) => (
                <span key={`u:${u}`} className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30">@{u}</span>
              ))}
              {tokens.hashProjects.map((p) => (
                <span key={`p:${p}`} className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">#{p}</span>
              ))}
            </div>
          ) : null}

          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-[#1f1f23]">
            {/* Filters (types / scope / sort) */}
            <SearchFilters
              types={types}
              allTypes={ALL_TYPES}
              onToggleType={toggleType}
              sort={sort}
              onChangeSort={setSort}
              scope={scope}
              onChangeScope={setScope}
              projectScopeAvailable={Boolean(projectId)}
            />
          </div>
        </div>

        {/* Live result count for screen readers */}
        <div ref={liveRef} aria-live="polite" className="sr-only">
          {totalResults} results
        </div>

        {/* Results Area */}
        <div role="listbox" aria-label="Search results" className="mt-6">
          
          {loading && (
            <div className="flex items-center justify-center py-12 text-slate-500 dark:text-zinc-400 gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-violet-500" /> 
              <span className="font-medium">Scouring the database…</span>
            </div>
          )}

          {/* ⭐ MetaLab Principle: Honest data or no data. Engage the user on empty state. */}
          {!loading && totalResults === 0 && q.length > 1 && (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in duration-500">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#1f1f23] flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-slate-400 dark:text-zinc-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No results found for "{q}"</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                We couldn't find anything matching your search. Try adjusting your filters or using different keywords.
              </p>
            </div>
          )}

          {/* Grouped lists */}
          {renderGroup("project", results.projects)}
          {renderGroup("task", results.tasks)}
          {renderGroup("user", results.users)}
          {renderGroup("post", results.posts)}
          {renderGroup("file", results.files)}
          {renderGroup(
            "announcement",
            results.announcements,
          )}
          {renderGroup(
            "teamRoom",
            results.teamRoom,
          )}
        </div>
      </div>
    </main>
  );
}
