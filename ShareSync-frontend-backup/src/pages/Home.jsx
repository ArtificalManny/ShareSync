// /src/pages/Home.jsx
import React, { useState, useEffect, useContext, Suspense, useRef } from 'react';
import client from '../api/client';
import { getProjectsQuick } from '../api/projects';
import { AuthContext } from '../AuthContext';

import HomeHeader from '../components/home/HomeHeader.jsx';
import ProjectsRail from '../components/home/ProjectsRail.jsx';
import KpiRow from '../components/analytics/KpiRow.jsx';
import SectionHeader from '../components/ui/SectionHeader.jsx';
import AuditList from '../components/audit/AuditList.jsx';
import InviteModal from '../components/invite/InviteModal';
import FocusSprint from '../components/home/FocusSprint.jsx'; // ✅

const ActivityOverTimeLive = React.lazy(() => import('../components/analytics/ActivityOverTimeLive.jsx'));

const DEFAULT_PROFILE_PIC = '/default-profile.png';

export default function Home() {
  const { user: authUser } = useContext(AuthContext) || {};
  const [user, setUser] = useState(null);

  // Projects rail
  const [quickProjects, setQuickProjects] = useState([]);
  const [quickLoading, setQuickLoading] = useState(false);

  // Live KPI controls/state
  const [projects, setProjects] = useState([]);
  const [statsRange, setStatsRange] = useState(30); // 7 | 30 | 90
  const [statsProjectId, setStatsProjectId] = useState('all'); // 'all' or project _id
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');

  const [inviteOpen, setInviteOpen] = useState(false);

  // ---- Initial minimal loads ----
  useEffect(() => {
    // fetch user + full projects list (for KPI filter dropdown)
    Promise.all([
      client.get('/users/me').catch(() => client.get('/user/me')),
      client.get('/projects').catch(() => ({ data: [] })),
    ])
      .then(([userRes, projRes]) => {
        setUser(userRes.data);
        setProjects(Array.isArray(projRes.data) ? projRes.data : []);
      })
      .catch(() => {});
  }, []);

  // quick rail
  useEffect(() => {
    let ignore = false;
    setQuickLoading(true);
    getProjectsQuick()
      .then((list) => !ignore && setQuickProjects(list))
      .catch(() => {})
      .finally(() => !ignore && setQuickLoading(false));
    return () => {
      ignore = true;
    };
  }, []);

  // ---- KPIs: robust debounced fetcher (with cancellation + race safety) ----
  const debounceRef = useRef(null);
  const requestRef = useRef({ abort: () => {} }); // track the latest request to abort on change/unmount
  const latestParamsRef = useRef({ range: statsRange, projectId: statsProjectId });

  useEffect(() => {
    latestParamsRef.current = { range: statsRange, projectId: statsProjectId };

    // clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    // create an AbortController for this cycle
    const controller = new AbortController();
    // abort any in-flight request from the previous cycle
    if (requestRef.current && typeof requestRef.current.abort === 'function') {
      requestRef.current.abort();
    }
    requestRef.current = controller;

    // debounce a bit to avoid hammering the API on quick changes
    debounceRef.current = setTimeout(() => {
      const { range, projectId } = latestParamsRef.current;
      setStatsLoading(true);
      setStatsError('');
      const params = { range };
      if (projectId && projectId !== 'all') params.projectId = projectId;

      client
        .get('/users/me/stats', { params, signal: controller.signal })
        .then((res) => {
          // only apply if this is still the latest cycle (i.e., not aborted)
          if (!controller.signal.aborted) {
            setStats(res.data);
          }
        })
        .catch((e) => {
          if (!controller.signal.aborted) {
            setStatsError(String(e?.message || e));
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setStatsLoading(false);
          }
        });
    }, 220);

    // cleanup: cancel debounce + request if range/project changes or unmounts
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      controller.abort();
    };
  }, [statsRange, statsProjectId]);

  // ---- Derived/header bits ----
  const firstName = user?.firstName || 'User';
  const username = user?.username;
  const profilePic = user?.profilePicture || DEFAULT_PROFILE_PIC;

  return (
    <div className="ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-6 bg-bg text-text min-h-screen max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <HomeHeader
        username={username}
        firstName={firstName}
        profilePic={profilePic}
        tier={user?.tier || 'Newcomer'}
        xp={user?.totalXP || 0}
        onInvite={() => setInviteOpen(true)}
      />

      {/* ✅ Focus Sprint (signature feature) */}
      <FocusSprint
        nextTask={null}
        onFinish={() => {
          // optional: toast or small celebration
        }}
      />

      {/* Your Projects: quick rail (cards link to detail) */}
      <ProjectsRail items={quickProjects} loading={quickLoading} />

      {/* KPIs */}
      <div className="card accent-kpi rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <SectionHeader icon="BarChartBig">Your KPIs</SectionHeader>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted">Project</label>
            <select
              value={statsProjectId}
              onChange={(e) => setStatsProjectId(e.target.value)}
              className="text-sm rounded-md border border-border bg-surface text-text px-2 py-1"
              aria-label="Project filter"
            >
              <option value="all">All projects</option>
              {projects.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  {p.title}
                </option>
              ))}
            </select>

            <label className="text-xs text-muted ml-2">Range</label>
            <select
              value={statsRange}
              onChange={(e) => setStatsRange(Number(e.target.value))}
              className="text-sm rounded-md border border-border bg-surface text-text px-2 py-1"
              aria-label="Stats time range"
            >
              <option value={7}>7d</option>
              <option value={30}>30d</option>
              <option value={90}>90d</option>
            </select>
          </div>
        </div>

        <div className="mt-3">
          {statsLoading ? (
            <div className="rounded-xl border border-border bg-surface p-4 animate-pulse">
              Loading KPIs…
            </div>
          ) : statsError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 p-3">
              Failed to load stats: {statsError}
            </div>
          ) : (
            <KpiRow
              cadence={stats?.cadence}
              onTimeCompletion={stats?.onTimeCompletion}
              activeDays={stats?.activeDays}
              throughputPerWeek={stats?.throughputPerWeek}
            />
          )}
        </div>
      </div>

      {/* Activity Over Time (uses same range/project filters) */}
      <div className="card accent-activity rounded-2xl border border-border bg-surface p-4">
        <SectionHeader icon="ActivitySquare">Activity Over Time</SectionHeader>
        <Suspense fallback={<div className="h-28 rounded-2xl bg-surface animate-pulse" />}>
          <ActivityOverTimeLive
            // This component can fetch on its own, or just render provided series.
            // We pass the same filter props for consistency.
            range={statsRange}
            projectId={statsProjectId !== 'all' ? statsProjectId : undefined}
            series={stats?.activitySeries ?? []}
          />
        </Suspense>
      </div>

      {/* Recent Activity (user scope; self-contained filters/export) */}
      <div className="card accent-activity rounded-2xl border border-border bg-surface p-4">
        <SectionHeader icon="History">Recent Activity</SectionHeader>
        <div className="mt-2">
          <AuditList scope="user" />
        </div>
      </div>

      {/* Invite teammates */}
      {inviteOpen && (
        <InviteModal
          isOpen={inviteOpen}
          onClose={() => setInviteOpen(false)}
          inviterId={authUser?._id || user?._id || null}
          projectId={null}
        />
      )}
    </div>
  );
}