// src/pages/Home.jsx
import React, { useState, useEffect, useContext } from 'react'
import client from '../api/client'
import { io } from 'socket.io-client'
import { Link } from 'react-router-dom'

import WelcomeCard from '../components/WelcomeCard'
import MomentumRing from '../components/MomentumRing.jsx'
import HighlightsPanel from '../components/analytics/HighlightsPanel.jsx'
import StatsPanel from '../components/analytics/StatsPanel'
import ActivityLineGraph from '../components/analytics/ActivityLineGraph'
import MomentumForecast from '../components/analytics/MomentumForecast'
import ChartModal from '../components/analytics/ChartModal.jsx'
import WeeklyReportModal from '../components/analytics/WeeklyReportModal.jsx'
import ProjectsCreate from './ProjectsCreate.jsx'

import formatProfilePicture from '../utils/formatProfilePicture'
import { getRandomTip } from '../utils/productivityTips'
import { generateDailyGoal } from '../utils/generateDailyGoal'

import LeaderboardCard from '../components/LeaderboardCard'
import SocialPanel from '../components/social/SocialPanel'
import PublicStreakFeed from '../components/feed/PublicStreakFeed'
import LiveActivityFeed from '../components/LiveActivityFeed'
import AssignedTasksPanel from '../components/AssignedTasksPanel'
import PinnedForumPanel from '../components/PinnedForumPanel'
import YourProjectsPanel from '../components/project/YourProjectsPanel'
import AISuggestionCard from '../components/AISuggestionCard'
import InviteModal from '../components/invite/InviteModal'

import { fetchAISuggestion } from '../api/ai'
import { AuthContext } from '../AuthContext' // ✅ use existing context used elsewhere

const DEFAULT_PROFILE_PIC = '/default-profile.png'

const getTierFromXP = (xp) => {
  if (xp >= 2000) return 'Legend'
  if (xp >= 1000) return 'Elite'
  if (xp >= 500) return 'Rising Star'
  return 'Novice'
}

const XPProgressRing = ({ xp }) => {
  const radius = 40
  const stroke = 8
  const normalizedRadius = radius - stroke * 0.5
  const circumference = normalizedRadius * 2 * Math.PI
  const maxXP = 2000
  const progress = Math.min(xp / maxXP, 1)
  const strokeDashoffset = circumference - progress * circumference

  return (
    <svg height={radius * 2} width={radius * 2} className="mx-auto block">
      <circle
        stroke="#ccc"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        stroke="#FFD700"
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={circumference + ' ' + circumference}
        style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease' }}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-xs font-bold text-gray-800"
      >
        {xp} XP
      </text>
    </svg>
  )
}

export default function Home() {
  const { user: authUser } = useContext(AuthContext) || {} // ✅ safe read
  const [user, setUser] = useState(null)
  const [projects, setProjects] = useState([])
  const [feedItems, setFeedItems] = useState([])
  const [forumPosts, setForumPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [taskCompletionRate, setTaskCompletionRate] = useState(0)
  const [daysActive, setDaysActive] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [activityData, setActivityData] = useState([])
  const [showChart, setShowChart] = useState(false)
  const [xpHistory, setXpHistory] = useState([])
  const [streakData, setStreakData] = useState([])
  const [streakDays, setStreakDays] = useState(0)
  const [tier, setTier] = useState('Newcomer')
  const [xp, setXp] = useState(0)
  const [showWeeklyReport, setShowWeeklyReport] = useState(false)
  const [weeklyData, setWeeklyData] = useState({
    tasksCompleted: 0,
    xpEarned: 0,
    streakChange: 0,
    tip: getRandomTip()
  })
  const [inviteOpen, setInviteOpen] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState('')

  const smartGoal = generateDailyGoal(xp, streakDays)

  useEffect(() => {
    Promise.all([client.get('/projects'), client.get('/feed'), client.get('/user/me')])
      .then(([projRes, feedRes, userRes]) => {
        setProjects(projRes.data)
        setFeedItems(feedRes.data)
        setUser(userRes.data)

        const today = new Date()
        const isMonday = today.getDay() === 1
        const lastLoginDate = new Date(userRes.data.lastLogin)
        const isTodayLogin = lastLoginDate.toDateString() === today.toDateString()

        if (isMonday && isTodayLogin) {
          client
            .get('/user/activity-summary?range=7d')
            .then((res) => {
              setWeeklyData({
                tasksCompleted: res.data.tasksCompleted,
                xpEarned: res.data.xpEarned,
                streakChange: res.data.streakChange,
                tip: getRandomTip()
              })
              setShowWeeklyReport(true)
            })
            .catch((err) => console.error('Error fetching weekly summary:', err))
        }
      })
      .catch((err) => console.error('[Home] fetch error', err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    client
      .get('/user/activity-summary')
      .then((res) => {
        setXpHistory(res.data.xpHistory)
        setStreakData(res.data.streakData)
        setXp(res.data.totalXP)
        setStreakDays(res.data.streakDays)
        setTier(res.data.tier || getTierFromXP(res.data.totalXP))
        setTaskCompletionRate(res.data.taskCompletionRate || 0)
        setDaysActive(res.data.daysActive || 0)
        setLongestStreak(res.data.longestStreak || 0)
        setActivityData(res.data.activityCalendar || [])

        // 🔮 AI suggestion from backend
        fetchAISuggestion({
          streakDays: res.data.streakDays,
          totalXP: res.data.totalXP,
          tasksCompletedToday: res.data.tasksToday ?? 0,
          tasksThisWeek:
            res.data.tasksThisWeek ??
            (res.data.activityCalendar?.slice?.(-7)?.reduce?.((acc, d) => acc + (d.count || 0), 0) || 0),
          longestStreak: res.data.longestStreak ?? 0,
          taskCompletionRate: res.data.taskCompletionRate ?? 0
        })
          .then(({ suggestion }) => setAiSuggestion(suggestion))
          .catch((err) => {
            console.error('[AI] suggestion fetch failed', err)
            setAiSuggestion('Stay consistent and finish strong 💪')
          })
      })
      .catch((err) => console.error('Error loading activity summary', err))
  }, [])

  useEffect(() => {
    const socket = io()
    socket.on('newActivity', (activity) => {
      setFeedItems((prev) => [activity, ...prev])
    })
    return () => socket.disconnect()
  }, [])

  const handleProjectCreated = (newProj) => {
    setShowProjectModal(false)
    setProjects((prev) => [newProj, ...prev])
    window.location.href = `/projects/${newProj._id}`
  }

  const greeting = getGreeting()
  const firstName = user?.firstName || 'User'
  const username = user?.username
  const profilePic = user?.profilePicture || DEFAULT_PROFILE_PIC

  function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-6 bg-gray-100 dark:bg-gray-800 min-h-screen max-w-6xl mx-auto space-y-10">

      {/* Invite Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setInviteOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-xl shadow"
        >
          📩 Invite Teammate
        </button>
      </div>

      {/* Invite Modal (guarded) */}
      {inviteOpen && (
        <InviteModal
          isOpen={inviteOpen}
          onClose={() => setInviteOpen(false)}
          inviterId={authUser?._id || user?._id || null}
          projectId={null}
        />
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
        <Link to={`/profile/${username}`} className="text-center hover:opacity-90 transition">
          <img
            src={formatProfilePicture(profilePic)}
            alt="Profile"
            className="w-20 h-20 rounded-full border-4 border-indigo-500 shadow-lg"
          />
          <div className="mt-2 text-indigo-700 font-orbitron text-sm underline">View Profile</div>
        </Link>
        <XPProgressRing xp={xp} />
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 font-orbitron">Tier</p>
          <p className="text-xl font-bold text-indigo-600 dark:text-indigo-300">{tier}</p>
        </div>
      </div>

      <WelcomeCard
        greeting={`${greeting}, ${firstName}`}
        suggestion={smartGoal}
        profilePic={formatProfilePicture(profilePic)}
        streakDays={streakDays}
        tasksCompleted={weeklyData.tasksCompleted}
        lastLogin={user?.lastLogin}
      />

      <HighlightsPanel user={user} xp={xp} onSyncUser={(updatedUser) => setUser(updatedUser)} />
      <StatsPanel taskCompletionRate={taskCompletionRate} daysActive={daysActive} longestStreak={longestStreak} />
      <ActivityLineGraph />
      <MomentumForecast streakDays={streakDays} tasksThisWeek={weeklyData.tasksCompleted} xp={xp} />

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

      {/* AI suggestion from backend */}
      <AISuggestionCard message={aiSuggestion || 'Stay consistent and finish strong 💪'} />

      {showProjectModal && (
        <ProjectsCreate onClose={() => setShowProjectModal(false)} onCreated={handleProjectCreated} />
      )}

      {showWeeklyReport && (
        <WeeklyReportModal isOpen={showWeeklyReport} onClose={() => setShowWeeklyReport(false)} data={weeklyData} />
      )}
    </div>
  )
}
