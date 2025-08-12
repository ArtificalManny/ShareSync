// /src/pages/Home.jsx
import React, { useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { Link } from 'react-router-dom';

import client from '../api/client';
import { getActivitySummary } from "../api/user.js";

import WelcomeCard from '../components/WelcomeCard';
import MomentumRing from '../components/MomentumRing.jsx';
import HighlightsPanel from '../components/analytics/HighlightsPanel.jsx';
import ActivityLineGraph from '../components/analytics/ActivityLineGraph';
import MomentumForecast from '../components/analytics/MomentumForecast';
import ChartModal from '../components/analytics/ChartModal.jsx';
import WeeklyReportModal from '../components/analytics/WeeklyReportModal.jsx';
import ProjectsCreate from './ProjectsCreate.jsx';

import formatProfilePicture from '../utils/formatProfilePicture';
import { getRandomTip } from '../utils/productivityTips';
import { generateDailyGoal } from '../utils/generateDailyGoal';

import LeaderboardCard from '../components/LeaderboardCard';
import SocialPanel from '../components/social/SocialPanel';
import PublicStreakFeed from '../components/feed/PublicStreakFeed';
import LiveActivityFeed from '../components/LiveActivityFeed';
import AssignedTasksPanel from '../components/AssignedTasksPanel';
import PinnedForumPanel from '../components/PinnedForumPanel';
import YourProjectsPanel from '../components/project/YourProjectsPanel';
import AISuggestionCard from '../components/AISuggestionCard';
import InviteModal from '../components/invite/InviteModal';
import { AuthContext } from '../AuthContext';

const DEFAULT_PROFILE_PIC = '/default-profile.png';

const getTierFromXP = (xp) => {
  if (xp >= 2000) return 'Legend';
  if (xp >= 1000) return 'Elite';
  if (xp >= 500) return 'Rising Star';
  return 'Novice';
};

const XPProgressRing = ({ xp }) => {
  const radius = 40;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const maxXP = 2000;
  const progress = Math.min(xp / maxXP, 1);
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <svg height={radius * 2} width={radius * 2} className="mx-auto block">
      <circle stroke="#ccc" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
      <circle
        stroke="#8B5CF6"
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={circumference + ' ' + circumference}
        style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease' }}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-xs font-bold text-gray-800">
        {xp} XP
      </text>
    </svg>
  );
};

export default function Home() {
  const { user: authUser } = useContext(AuthContext) || {};
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [feedItems, setFeedItems] = useState([]);
  const [forumPosts, setForumPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);

  // KPIs
  const [taskCompletionRate, setTaskCompletionRate] = useState(0);
  const [daysActive, setDaysActive] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [tasksThisWeek, setTasksThisWeek] = useState(0);

  // Chart + extras
  const [activitySeries, setActivitySeries] = useState([]); // [{date, value}]
  const [xpHistory, setXpHistory] = useState([]);
  const [streakData, setStreakData] = useState([]);
  const [showChart, setShowChart] = useState(false);

  // User progress
  const [streakDays, setStreakDays] = useState(0);
  const [tier, setTier] = useState('Newcomer');
  const [xp, setXp] = useState(0);

  // Weekly modal / AI
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const [weeklyData, setWeeklyData] = useState({ tasksCompleted: 0, xpEarned: 0, streakChange: 0, tip: getRandomTip() });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');

  // derived
  const smartGoal = generateDailyGoal(xp, streakDays);

  // Initial page fetches
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
          client
            .get('/user/activity-summary?range=7d')
            .then((res) => {
              setWeeklyData({
                tasksCompleted: res.data.tasksCompleted,
                xpEarned: res.data.xpEarned,
                streakChange: res.data.streakChange,
                tip: getRandomTip(),
              });
              setShowWeeklyReport(true);
            })
            .catch((err) => console.error('Error fetching weekly summary:', err));
        }
      })
      .catch((err) => console.error('[Home] fetch error', err))
      .finally(() => setLoading(false));
  }, []);

  // Activity summary (KPI + chart)
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const s = await getActivitySummary('28d');

        if (ignore) return;

        // KPIs
        setXp(Number(s.totalXP ?? 0));
        setStreakDays(Number(s.streakDays ?? 0));
        setTier(s.tier || getTierFromXP(Number(s.totalXP ?? 0)));
        setTaskCompletionRate(Number(s.taskCompletionRate ?? 0));
        setDaysActive(Number(s.daysActive ?? 0));
        setLongestStreak(Number(s.longestStreak ?? 0));
        setTasksThisWeek(
          Number(
            s.tasksThisWeek ??
              (Array.isArray(s.activityCalendar)
                ? s.activityCalendar.slice(-7).reduce((acc, d) => acc + Number(d.count || 0), 0)
                : 0)
          )
        );

        // Time-series for chart
        const series =
          Array.isArray(s.activityCalendar) && s.activityCalendar.length
            ? s.activityCalendar.map((d) => ({
                date: d.date || d.day || d.ts || d._id,
                value: Number(d.count ?? d.value ?? 0),
              }))
            : [];

        setActivitySeries(series);

        // Extras (for ChartModal)
        setXpHistory(Array.isArray(s.xpHistory) ? s.xpHistory : []);
        setStreakData(Array.isArray(s.streakData) ? s.streakData : []);

        // AI suggestion (best-effort)
        try {
          const { data } = await client.post('/ai/suggestion', {
            streakDays: s.streakDays,
            totalXP: s.totalXP,
            tasksCompletedToday: s.tasksToday ?? 0,
            tasksThisWeek:
              s.tasksThisWeek ??
              (Array.isArray(s.activityCalendar) ? s.activityCalendar.slice(-7).reduce((a, d) => a + (d.count || 0), 0) : 0),
            longestStreak: s.longestStreak ?? 0,
            taskCompletionRate: s.taskCompletionRate ?? 0,
          });
          setAiSuggestion(data?.suggestion || 'Stay consistent and finish strong 💪');
        } catch {
          setAiSuggestion('Stay consistent and finish strong 💪');
        }
      } catch (e) {
        console.error('[Home] activity-summary error', e);
      }
    })();
    return () => { ignore = true; };
  }, []);

  // Realtime (optional)
  useEffect(() => {
    const socket = io();
    socket.on('newActivity', (activity) => setFeedItems((prev) => [activity, ...prev]));
    return () => socket.disconnect();
  }, []);

  const handleProjectCreated = (newProj) => {
    setShowProjectModal(false);
    setProjects((prev) => [newProj, ...prev]);
    window.location.href = `/projects/${newProj._id}`;
  };

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const firstName = user?.firstName || 'User';
  const username = user?.username;
  const profilePic = user?.profilePicture || DEFAULT_PROFILE_PIC;

  return (
    <div className="ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-6 bg-gray-100 dark:bg-gray-800 min-h-screen max-w-6xl mx-auto space-y-10">

      {/* Header strip (CNBC-ish) */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${username}`} className="shrink-0">
            <img
              src={formatProfilePicture(profilePic)}
              alt="User profile"
              className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-600"
            />
          </Link>
          <div>
            <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {greeting}, {firstName}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Welcome back 👋</div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-center">
            <XPProgressRing xp={xp} />
            <div className="text-xs mt-1 text-slate-500 dark:text-slate-400">Experience</div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-500 dark:text-slate-400">Tier</div>
            <div className="text-indigo-600 dark:text-indigo-300 font-semibold">{tier}</div>
          </div>

          <button
            onClick={() => setInviteOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl shadow"
          >
            Invite Teammate
          </button>
        </div>
      </div>

      {/* Invite Modal */}
      {inviteOpen && (
        <InviteModal
          isOpen={inviteOpen}
          onClose={() => setInviteOpen(false)}
          inviterId={authUser?._id || user?._id || null}
          projectId={null}
        />
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 p-4">
          <div className="text-xs text-slate-500">Streak</div>
          <div className="text-xl font-semibold">{streakDays} days</div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 p-4">
          <div className="text-xs text-slate-500">Tasks this week</div>
          <div className="text-xl font-semibold">{tasksThisWeek}</div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 p-4">
          <div className="text-xs text-slate-500">On-time completion</div>
          <div className="text-xl font-semibold">{Math.round(taskCompletionRate * 100)}%</div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 p-4">
          <div className="text-xs text-slate-500">Active days (28d)</div>
          <div className="text-xl font-semibold">{daysActive}</div>
        </div>
      </div>

      {/* Welcome + insights */}
      <WelcomeCard
        greeting={`${greeting}, ${firstName}`}
        suggestion={smartGoal}
        profilePic={formatProfilePicture(profilePic)}
        streakDays={streakDays}
        tasksCompleted={tasksThisWeek}
        lastLogin={user?.lastLogin}
      />

      {/* Real data Activity chart */}
      <ActivityLineGraph data={activitySeries} title="Activity (last 28 days)" yLabel="Actions" />

      {/* Optional extras retained */}
      <HighlightsPanel user={user} xp={xp} onSyncUser={(updatedUser) => setUser(updatedUser)} />
      <MomentumForecast streakDays={streakDays} tasksThisWeek={tasksThisWeek} xp={xp} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MomentumRing streakDays={streakDays} xp={xp} tier={tier} onClick={() => setShowChart(true)} />
        <LeaderboardCard currentUserId={user?.id} />
        <SocialPanel />
      </div>

      <YourProjectsPanel projects={projects} />

      {showChart && (
        <ChartModal
          xpHistory={xpHistory}
          streakData={streakData}
          xpTierColor="#8B5CF6"
          onClose={() => setShowChart(false)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AssignedTasksPanel tasks={user?.assignedTasks || []} />
        <PinnedForumPanel posts={forumPosts} onPostSubmit={(post) => setForumPosts((prev) => [post, ...prev])} />
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-indigo-500 dark:text-indigo-300">Public Streak Feed</h2>
        <PublicStreakFeed />
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-indigo-500 dark:text-indigo-300">Your Team Activity</h2>
        <LiveActivityFeed feedItems={feedItems} />
      </div>

      <AISuggestionCard message={aiSuggestion || 'Stay consistent and finish strong 💪'} />

      {showProjectModal && (
        <ProjectsCreate onClose={() => setShowProjectModal(false)} onCreated={handleProjectCreated} />
      )}

      {showWeeklyReport && (
        <WeeklyReportModal isOpen={showWeeklyReport} onClose={() => setShowWeeklyReport(false)} data={weeklyData} />
      )}
    </div>
  );
}
