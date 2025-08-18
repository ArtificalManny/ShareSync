// /src/pages/Home.jsx
import React, { useState, useEffect, useContext, Suspense } from 'react';
import client from '../api/client';
import { getProjectsQuick } from '../api/projects';
import { getUserStats } from '../api/stats';

import WelcomeCard from '../components/WelcomeCard';
import HighlightsPanel from '../components/analytics/HighlightsPanel.jsx';
import KpiRow from '../components/analytics/KpiRow.jsx';
import ProjectsCreate from './ProjectsCreate.jsx';
import ProjectsRail from '../components/home/ProjectsRail.jsx';
import InviteModal from '../components/invite/InviteModal';
import formatProfilePicture from '../utils/formatProfilePicture';
import { getRandomTip } from '../utils/productivityTips';
import { generateDailyGoal } from '../utils/generateDailyGoal';
import { fetchAISuggestion } from '../api/ai';
import { AuthContext } from '../AuthContext';
import HomeHeader from '../components/home/HomeHeader.jsx';

// ✅ Lazy chunks (keeps initial JS light for /home)
const MomentumRing        = React.lazy(() => import('../components/MomentumRing.jsx'));
const ActivityOverTimeLive = React.lazy(() => import('../components/analytics/ActivityOverTimeLive.jsx'));
const MomentumForecast     = React.lazy(() => import('../components/analytics/MomentumForecast'));
const ChartModal           = React.lazy(() => import('../components/analytics/ChartModal.jsx'));
const WeeklyReportModal    = React.lazy(() => import('../components/analytics/WeeklyReportModal.jsx'));
const LeaderboardCard      = React.lazy(() => import('../components/LeaderboardCard'));
const SocialPanel          = React.lazy(() => import('../components/social/SocialPanel'));
const PublicStreakFeed     = React.lazy(() => import('../components/feed/PublicStreakFeed'));
const LiveActivityFeed     = React.lazy(() => import('../components/LiveActivityFeed'));
const AssignedTasksPanel   = React.lazy(() => import('../components/AssignedTasksPanel'));
const PinnedForumPanel     = React.lazy(() => import('../components/PinnedForumPanel'));
const YourProjectsPanel    = React.lazy(() => import('../components/project/YourProjectsPanel'));
const AISuggestionCard     = React.lazy(() => import('../components/AISuggestionCard'));

const DEFAULT_PROFILE_PIC = '/default-profile.png';
const getTierFromXP = (xp) => (xp >= 2000 ? 'Legend' : xp >= 1000 ? 'Elite' : xp >= 500 ? 'Rising Star' : 'Novice');

// Idle helper to defer non-critical work
const onIdle = (fn) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1200 }) : setTimeout(fn, 0));

export default function Home() {
  const { user: authUser } = useContext(AuthContext) || {};
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [feedItems, setFeedItems] = useState([]);
  const [forumPosts, setForumPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);

  // legacy/kept
  const [taskCompletionRate, setTaskCompletionRate] = useState(0);
  const [daysActive, setDaysActive] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [activityData, setActivityData] = useState([]);
  const [showChart, setShowChart] = useState(false);
  const [xpHistory, setXpHistory] = useState([]);
  const [streakData, setStreakData] = useState([]);
  const [streakDays, setStreakDays] = useState(0);
  const [tier, setTier] = useState('Newcomer');
  const [xp, setXp] = useState(0);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const [weeklyData, setWeeklyData] = useState({ tasksCompleted: 0, xpEarned: 0, streakChange: 0, tip: getRandomTip() });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');

  // rail
  const [quickProjects, setQuickProjects] = useState([]);
  const [quickLoading, setQuickLoading] = useState(false);

  // live stats
  const [statsRange, setStatsRange] = useState(30);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');

  const smartGoal = generateDailyGoal(xp, streakDays);

  // initial data
  useEffect(() => {
    Promise.all([client.get('/projects'), client.get('/feed'), client.get('/user/me')])
      .then(([projRes, feedRes, userRes]) => {
        setProjects(projRes.data);
        setFeedItems(feedRes.data);
        setUser(userRes.data);

        const today = new Date();
        const isMonday = today.getDay() === 1;
        const lastLoginDate = new Date(userRes.data.lastLogin);
        const isTodayLogin = lastLoginDate.toDateString() === today.toDateString();

        if (isMonday && isTodayLogin) {
          onIdle(() => {
            client.get('/user/activity-summary?range=7d')
              .then((res) => {
                setWeeklyData({
                  tasksCompleted: res.data.tasksCompleted,
                  xpEarned: res.data.xpEarned,
                  streakChange: res.data.streakChange,
                  tip: getRandomTip(),
                });
                setShowWeeklyReport(true);
              })
              .catch(() => {});
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // legacy summary (defer AI)
  useEffect(() => {
    client.get('/user/activity-summary')
      .then((res) => {
        setXpHistory(res.data.xpHistory);
        setStreakData(res.data.streakData);
        setXp(res.data.totalXP);
        setStreakDays(res.data.streakDays);
        setTier(res.data.tier || getTierFromXP(res.data.totalXP));
        setTaskCompletionRate(res.data.taskCompletionRate || 0);
        setDaysActive(res.data.daysActive || 0);
        setLongestStreak(res.data.longestStreak || 0);
        setActivityData(res.data.activityCalendar || []);

        onIdle(() => {
          fetchAISuggestion({
            streakDays: res.data.streakDays,
            totalXP: res.data.totalXP,
            tasksCompletedToday: res.data.tasksToday ?? 0,
            tasksThisWeek:
              res.data.tasksThisWeek ??
              (res.data.activityCalendar?.slice?.(-7)?.reduce?.((a, d) => a + (d.count || 0), 0) || 0),
            longestStreak: res.data.longestStreak ?? 0,
            taskCompletionRate: res.data.taskCompletionRate ?? 0,
          })
            .then(({ suggestion }) => setAiSuggestion(suggestion))
            .catch(() => setAiSuggestion('Stay consistent and finish strong'));
        });
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
    return () => { ignore = true; };
  }, []);

  // sockets (idle-load socket.io-client)
  useEffect(() => {
    let cleanup = () => {};
    const id = onIdle(async () => {
      try {
        const { io } = await import('socket.io-client');
        const socket = io();
        socket.on('newActivity', (a) => setFeedItems((prev) => [a, ...prev]));
        cleanup = () => socket.disconnect();
      } catch {}
    });
    return () => {
      typeof cancelIdleCallback === 'function' ? cancelIdleCallback(id) : clearTimeout(id);
      cleanup();
    };
  }, []);

  // live stats
  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    setStatsError('');
    getUserStats(statsRange)
      .then((data) => { if (!cancelled) setStats(data); })
      .catch((e) => { if (!cancelled) setStatsError(String(e)); })
      .finally(() => { if (!cancelled) setStatsLoading(false); });
    return () => { cancelled = true; };
  }, [statsRange]);

  const handleProjectCreated = (newProj) => {
    setShowProjectModal(false);
    setProjects((prev) => [newProj, ...prev]);
    window.location.href = `/projects/${newProj._id}`;
  };

  const firstName = user?.firstName || 'User';
  const username = user?.username;
  const profilePic = user?.profilePicture || DEFAULT_PROFILE_PIC;
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-6 bg-gray-100 dark:bg-gray-800 min-h-screen max-w-6xl mx-auto space-y-10">
      <HomeHeader
        username={username}
        firstName={firstName}
        profilePic={formatProfilePicture(profilePic)}
        tier={tier}
        xp={xp}
        onInvite={() => setInviteOpen(true)}
      />

      <ProjectsRail items={quickProjects} loading={quickLoading} />

      {/* KPI row (live) */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Your KPIs</h2>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Range</label>
          <select
            value={statsRange}
            onChange={(e) => setStatsRange(Number(e.target.value))}
            className="text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1"
            aria-label="Stats time range"
          >
            <option value={7}>7d</option>
            <option value={30}>30d</option>
            <option value={90}>90d</option>
          </select>
        </div>
      </div>

      {statsLoading ? (
        <div className="rounded-xl border border-slate-200/70 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 p-4 animate-pulse">
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

      {/* Chart & heavier panels deferred via Suspense */}
      <Suspense fallback={<div className="h-28 rounded-2xl bg-white/60 dark:bg-slate-900/60 animate-pulse" />}>
        <ActivityOverTimeLive series={stats?.activitySeries ?? []} range={statsRange} />
      </Suspense>

      <Suspense fallback={<div className="h-24 rounded-2xl bg-white/60 dark:bg-slate-900/60 animate-pulse" />}>
        <WelcomeCard
          greeting={`${greeting}, ${firstName}`}
          suggestion={generateDailyGoal(xp, streakDays)}
          profilePic={formatProfilePicture(profilePic)}
          streakDays={streakDays}
          tasksCompleted={weeklyData.tasksCompleted}
          lastLogin={user?.lastLogin}
        />
      </Suspense>

      <Suspense fallback={<div className="h-24 rounded-2xl bg-white/60 dark:bg-slate-900/60 animate-pulse" />}>
        <HighlightsPanel user={user} xp={xp} onSyncUser={(u) => setUser(u)} />
      </Suspense>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Suspense fallback={<div className="h-40 rounded-2xl bg-white/60 dark:bg-slate-900/60 animate-pulse" />}>
          <MomentumRing streakDays={streakDays} xp={xp} tier={tier} onClick={() => setShowChart(true)} />
        </Suspense>
        <Suspense fallback={<div className="h-36 rounded-2xl bg-white/60 dark:bg-slate-900/60 animate-pulse" />}>
          <LeaderboardCard currentUserId={user?.id} />
        </Suspense>
        <Suspense fallback={<div className="h-36 rounded-2xl bg-white/60 dark:bg-slate-900/60 animate-pulse" />}>
          <SocialPanel />
        </Suspense>
      </div>

      <Suspense fallback={<div className="h-24 rounded-2xl bg-white/60 dark:bg-slate-900/60 animate-pulse" />}>
        <YourProjectsPanel projects={projects} />
      </Suspense>

      <Suspense fallback={null}>
        <MomentumForecast streakDays={streakDays} tasksThisWeek={weeklyData.tasksCompleted} xp={xp} />
      </Suspense>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Suspense fallback={<div className="h-40 rounded-2xl bg-white/60 dark:bg-slate-900/60 animate-pulse" />}>
          <AssignedTasksPanel tasks={user?.assignedTasks || []} />
        </Suspense>
        <Suspense fallback={<div className="h-40 rounded-2xl bg-white/60 dark:bg-slate-900/60 animate-pulse" />}>
          <PinnedForumPanel
            posts={forumPosts}
            onPostSubmit={(post) => setForumPosts((prev) => [post, ...prev])}
          />
        </Suspense>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-indigo-500 dark:text-indigo-300">Public Cadence Feed</h2>
        <Suspense fallback={<div className="h-32 rounded-2xl bg-white/60 dark:bg-slate-900/60 animate-pulse" />}>
          <PublicStreakFeed />
        </Suspense>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-indigo-500 dark:text-indigo-300">Your Team Activity</h2>
        <Suspense fallback={<div className="h-32 rounded-2xl bg-white/60 dark:bg-slate-900/60 animate-pulse" />}>
          <LiveActivityFeed feedItems={feedItems} />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <AISuggestionCard message={aiSuggestion || 'Stay consistent and finish strong'} />
      </Suspense>

      {showProjectModal && (
        <ProjectsCreate onClose={() => setShowProjectModal(false)} onCreated={handleProjectCreated} />
      )}

      <Suspense fallback={null}>
        {showWeeklyReport && (
          <WeeklyReportModal
            isOpen={showWeeklyReport}
            onClose={() => setShowWeeklyReport(false)}
            data={weeklyData}
          />
        )}
        {showChart && (
          <ChartModal
            xpHistory={xpHistory}
            streakData={streakData}
            xpTierColor="#8B5CF6"
            onClose={() => setShowChart(false)}
          />
        )}
      </Suspense>

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