// src/pages/admin/AdminConsole.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import FeatureGate from "../../utils/FeatureGate.jsx";
import GradientPanel from "../../components/frame/GradientPanel.jsx";
import SectionHeader from "../../components/ui/SectionHeader.jsx";
import UsersTable from "./UsersTable.jsx";
import ProjectsTable from "./ProjectsTable.jsx";
import InvitesTable from "./ProjectsTable.jsx";
import { track } from "../../utils/telemetry";
import { bumpCounter, pushEvent } from "../../state/metrics";
import "../../styles/admin.css";
import { Search, Users, FolderKanban, Mail } from "lucide-react";

/** Try to import the admin API; fall back to safe stubs if missing. */
async function getAdminApi() {
  try {
    const mod = await import("../../api/admin.js");
    return {
      listUsers: mod.listUsers ?? (async () => ({ items: [], total: 0 })),
      listProjects: mod.listProjects ?? (async () => ({ items: [], total: 0 })),
      listInvites: mod.listInvites ?? (async () => ({ items: [], total: 0 })),
    };
  } catch {
    // Soft fallback (keeps UI alive even if backend not wired yet)
    return {
      listUsers: async () => ({ items: [], total: 0 }),
      listProjects: async () => ({ items: [], total: 0 }),
      listInvites: async () => ({ items: [], total: 0 }),
    };
  }
}

const TABS = [
  { key: "users", label: "Users", icon: Users },
  { key: "projects", label: "Projects", icon: FolderKanban },
  { key: "invites", label: "Invites", icon: Mail },
];

const DEFAULT_PAGE_SIZE = 25;

export default function AdminConsole() {
  // ── Traceability & telemetry ───────────────────────────────────────────────
  useEffect(() => {
    bumpCounter("admin_console_views", 1);
    track("admin_console_opened", {});
  }, []);

  // ── Tab / filters / paging / sorting state ─────────────────────────────────
  const [tab, setTab] = useState("users"); // 'users' | 'projects' | 'invites'
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState({ key: "createdAt", dir: "desc" });

  // Additional light filters (role/status for users; public? for projects)
  const [role, setRole] = useState("");     // '', 'owner', 'member', 'viewer', 'admin'
  const [status, setStatus] = useState(""); // '', 'active', 'invited', 'disabled'
  const [pub, setPub] = useState("");       // '', 'yes', 'no'

  // ── Data buckets ───────────────────────────────────────────────────────────
  const [users, setUsers] = useState({ items: [], total: 0, loading: true, error: "" });
  const [projects, setProjects] = useState({ items: [], total: 0, loading: true, error: "" });
  const [invites, setInvites] = useState({ items: [], total: 0, loading: true, error: "" });

  const apiRef = useRef(null);

  // Load API module once
  useEffect(() => {
    let ignore = false;
    getAdminApi().then((api) => {
      if (!ignore) apiRef.current = api;
    });
    return () => { ignore = true; };
  }, []);

  // Reset page when tab or query/filter changes
  useEffect(() => {
    setPage(1);
  }, [tab, q, role, status, pub]);

  // Track tab/filter changes
  useEffect(() => {
    track("admin_console_tab_changed", { tab });
  }, [tab]);
  useEffect(() => {
    // debounce filter/queries a bit
    const t = setTimeout(() => {
      track("admin_console_filter_changed", { tab, q, role, status, public: pub });
      pushEvent("admin_console_filter", { tab, q, role, status, public: pub });
    }, 350);
    return () => clearTimeout(t);
  }, [tab, q, role, status, pub]);

  // Sort handler (toggle asc/desc)
  const handleSortChange = useCallback((key) => {
    setSort((s) => {
      if (s.key === key) return { key, dir: s.dir === "asc" ? "desc" : "asc" };
      return { key, dir: "asc" };
    });
  }, []);

  // ── Data loading per tab ───────────────────────────────────────────────────
  useEffect(() => {
    let ignore = false;
    const run = async () => {
      if (!apiRef.current) return;
      const common = { q, page, pageSize, sort: `${sort.key}:${sort.dir}` };

      if (tab === "users") {
        setUsers((s) => ({ ...s, loading: true, error: "" }));
        try {
          const res = await apiRef.current.listUsers({ ...common, role, status });
          if (!ignore) setUsers({ items: res.items || [], total: res.total || 0, loading: false, error: "" });
        } catch (e) {
          if (!ignore) setUsers((s) => ({ ...s, loading: false, error: e?.message || "Failed to load users" }));
        }
      }

      if (tab === "projects") {
        setProjects((s) => ({ ...s, loading: true, error: "" }));
        try {
          const res = await apiRef.current.listProjects({ ...common, public: pub });
          if (!ignore) setProjects({ items: res.items || [], total: res.total || 0, loading: false, error: "" });
        } catch (e) {
          if (!ignore) setProjects((s) => ({ ...s, loading: false, error: e?.message || "Failed to load projects" }));
        }
      }

      if (tab === "invites") {
        setInvites((s) => ({ ...s, loading: true, error: "" }));
        try {
          const res = await apiRef.current.listInvites({ ...common });
          if (!ignore) setInvites({ items: res.items || [], total: res.total || 0, loading: false, error: "" });
        } catch (e) {
          if (!ignore) setInvites((s) => ({ ...s, loading: false, error: e?.message || "Failed to load invites" }));
        }
      }
    };
    run();
    return () => { ignore = true; };
  }, [tab, q, role, status, pub, page, pageSize, sort.key, sort.dir]);

  // ── Header chips (tabs) ────────────────────────────────────────────────────
  const TabChip = ({ k, Icon, children }) => {
    const active = tab === k;
    return (
      <button
        type="button"
        onClick={() => setTab(k)}
        className={[
          "chip",
          active ? "is-selected" : "",
          "inline-flex items-center gap-1.5"
        ].join(" ")}
        aria-pressed={active ? "true" : "false"}
      >
        <Icon className="w-3.5 h-3.5" />
        {children}
      </button>
    );
  };

  return (
    <FeatureGate flag="ADMIN_CONSOLE_V1">
      <div className="px-4 sm:px-6 lg:px-8 py-6 bg-bg text-text min-h-screen max-w-6xl mx-auto space-y-6">
        <GradientPanel>
          <div className="flex items-start justify-between">
            <SectionHeader icon="ShieldCheck">Admin Console (read-only)</SectionHeader>
            {/* lightweight search */}
            <div className="inline-flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-muted absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search…"
                  className="pl-7 pr-3 py-1.5 rounded-lg border border-border bg-surface text-sm w-[220px]"
                />
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <TabChip k="users" Icon={Users}>Users</TabChip>
            <TabChip k="projects" Icon={FolderKanban}>Projects</TabChip>
            <TabChip k="invites" Icon={Mail}>Invites</TabChip>
          </div>
        </GradientPanel>

        {/* Filters row (contextual) */}
        <div className="rounded-2xl border border-border bg-surface p-3">
          {tab === "users" && (
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-xs text-muted">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="text-sm rounded-lg border border-border bg-surface px-2 py-1"
              >
                <option value="">Any</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>

              <label className="text-xs text-muted ml-3">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="text-sm rounded-lg border border-border bg-surface px-2 py-1"
              >
                <option value="">Any</option>
                <option value="active">Active</option>
                <option value="invited">Invited</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          )}

          {tab === "projects" && (
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-xs text-muted">Public</label>
              <select
                value={pub}
                onChange={(e) => setPub(e.target.value)}
                className="text-sm rounded-lg border border-border bg-surface px-2 py-1"
              >
                <option value="">Any</option>
                <option value="yes">Public only</option>
                <option value="no">Private only</option>
              </select>
            </div>
          )}

{tab === "invites" && (
  <InvitesTable
    rows={invites.items}
    loading={invites.loading}
    page={page}
    pageSize={pageSize}
    total={invites.total}
    sort={sort}
    onPageChange={setPage}
    onSortChange={handleSortChange}
  />
)}
        </div>

        {/* Tables */}
        {tab === "users" && (
          <UsersTable
            rows={users.items}
            loading={users.loading}
            page={page}
            pageSize={pageSize}
            total={users.total}
            sort={sort}
            onPageChange={setPage}
            onSortChange={handleSortChange}
          />
        )}

        {tab === "projects" && (
          <ProjectsTable
            rows={projects.items}
            loading={projects.loading}
            page={page}
            pageSize={pageSize}
            total={projects.total}
            sort={sort}
            onPageChange={setPage}
            onSortChange={handleSortChange}
          />
        )}

        {tab === "invites" && (
          <div className="rounded-2xl border border-border bg-surface p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-border text-sm font-semibold">Invites</div>
            <div className="overflow-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Project</th>
                    <th>Inviter</th>
                    <th>Status</th>
                    <th>Sent At</th>
                  </tr>
                </thead>
                <tbody>
                  {invites.loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={5} className="p-3 text-sm text-muted">Loading…</td>
                      </tr>
                    ))
                  ) : (invites.items || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-3 text-sm text-muted">No invites found.</td>
                    </tr>
                  ) : (
                    invites.items.map((it) => (
                      <tr key={it.id || it._id}>
                        <td>{it.email || "—"}</td>
                        <td>{it.projectName || it.projectId || "—"}</td>
                        <td>{it.inviterName || it.inviterEmail || "—"}</td>
                        <td>{(it.status || "pending").toString()}</td>
                        <td>{it.createdAt ? new Date(it.createdAt).toLocaleString() : "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Simple pager */}
            <div className="px-3 py-2 border-t border-border flex items-center justify-between text-sm">
              <div className="text-muted">
                Total: <span className="font-medium">{invites.total || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-ghost px-2 py-1 rounded-lg border border-border"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || invites.loading}
                >
                  Prev
                </button>
                <div className="px-2">Page <span className="font-medium">{page}</span></div>
                <button
                  className="btn btn-ghost px-2 py-1 rounded-lg border border-border"
                  onClick={() => {
                    const totalPages = Math.max(1, Math.ceil((invites.total || 0) / pageSize));
                    setPage((p) => Math.min(totalPages, p + 1));
                  }}
                  disabled={invites.loading || (page >= Math.ceil((invites.total || 0) / pageSize))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
