import React, { useState, useEffect } from 'react'
import client from '../api/client'
import { io } from 'socket.io-client'
import StoryCarousel from '../components/StoryCarousel'
import ProjectsCreate from './ProjectsCreate.jsx'
import ProfilePicChanger from '../components/ProfilePicChanger'
import WelcomeCard from '../components/WelcomeCard'
import AISuggestionCard from '../components/AISuggestionCard'
import formatProfilePicture from '../utils/formatProfilePicture'
import LeaderboardCard from '../components/LeaderboardCard'
import LiveActivityFeed from '../components/LiveActivityFeed'
import PinnedForumPanel from '../components/PinnedForumPanel'
import MomentumRing from '../components/MomentumRing.jsx'
import HighlightsPanel from '../components/analytics/HighlightsPanel.jsx'
import AssignedTasksPanel from '../components/AssignedTasksPanel'
import ChartModal from '../components/analytics/ChartModal.jsx'
import WeeklyReportModal from '../components/analytics/WeeklyReportModal.jsx'
import { getRandomTip } from '../utils/productivityTips.js'
import SocialPanel from '../components/social/SocialPanel'
import ProjectUnifiedFeed from "../components/project/ProjectUnifiedFeed";
import YourProjectsPanel from '../components/project/YourProjectsPanel'
import MomentumForecast from '../components/analytics/MomentumForecast'




const DEFAULT_PROFILE_PIC = '/default-profile.png'

export default function Home() {
  const [user, setUser] = useState(null)
  const [projects, setProjects] = useState([])
  const [feedItems, setFeedItems] = useState([])
  const [forumPosts, setForumPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showProjectModal, setShowProjectModal] = useState(false)

  // ✅ Chart Modal state
  const [showChart, setShowChart] = useState(false)
  const [xpHistory, setXpHistory] = useState([])
  const [streakData, setStreakData] = useState([])
  const [streakDays, setStreakDays] = useState(0);
  const [tier, setTier] = useState('Newcomer');
  const [xp, setXp] = useState(0)

  // ✅ Weekly Report Modal state
  const [showWeeklyReport, setShowWeeklyReport] = useState(false)
  const [weeklyData, setWeeklyData] = useState({
    tasksCompleted: 0,
    xpEarned: 0,
    streakChange: 0,
    tip: getRandomTip()
  })

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      setUser(JSON.parse(stored))
    } else {
      setUser({ firstName: 'User', profilePicture: DEFAULT_PROFILE_PIC })
    }
  }, [])

  useEffect(() => {
    Promise.all([
      client.get('/projects'),
      client.get('/feed'),
      client.get('/user/me')
    ])
      .then(([projRes, feedRes, userRes]) => {
        setProjects(projRes.data)
        setFeedItems(feedRes.data)
        setUser(userRes.data)

        // Weekly Report Modal check
        const today = new Date()
        const isMonday = today.getDay() === 1
        const lastLoginDate = new Date(userRes.data.lastLogin)
        const isTodayLogin = lastLoginDate.toDateString() === today.toDateString()

        if (isMonday && isTodayLogin) {
          client.get('/user/activity-summary?range=7d')
            .then(res => {
              setWeeklyData({
                tasksCompleted: res.data.tasksCompleted,
                xpEarned: res.data.xpEarned,
                streakChange: res.data.streakChange,
                tip: getRandomTip()
              })
              setShowWeeklyReport(true)
            })
            .catch(err => console.error('Error fetching weekly summary:', err))
        }
      })
      .catch(err => console.error('[Home] fetch error', err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    client.get('/user/activity-summary')
      .then(res => {
        setXpHistory(res.data.xpHistory)
        setStreakData(res.data.streakData)
        setXp(res.data.totalXP)
        setStreakDays(res.data.streakDays)
        setTier(res.data.tier || getTier(res.data.streakDays))
      })
      .catch(err => console.error('Error loading XP/streak data', err))
  }, [])

  useEffect(() => {
    const socket = io()
    socket.on('newActivity', activity => {
      setFeedItems(prev => [activity, ...prev])
    })
    return () => socket.disconnect()
  }, [])

  const handleStartProject = () => setShowProjectModal(true)
  const handleProjectCreated = newProj => {
    setShowProjectModal(false)
    setProjects(prev => [newProj, ...prev])
    window.location.href = `/projects/${newProj._id}`
  }

  const firstName = user?.firstName || 'User'
  const profilePic = user?.profilePicture || DEFAULT_PROFILE_PIC
  const greeting = getGreeting()

  function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
  <div className="ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-6 bg-gray-100 dark:bg-gray-800 min-h-screen max-w-6xl mx-auto space-y-10">

    {/* 🏁 Welcome & Highlights */}
    <WelcomeCard
      greeting={`${greeting}, ${firstName} 👋`}
      profilePic={formatProfilePicture(profilePic)}
      suggestion="Tip: Stay consistent. Momentum builds clarity."
      streakDays={user?.streakDays || 0}
      tasksCompleted={user?.tasksCompleted || 0}
      lastLogin={user?.lastLogin}
    />

<HighlightsPanel
  user={user}
  xp={xp}
  onSyncUser={(updatedUser) => setUser(updatedUser)}
/>

<MomentumForecast
  streakDays={user?.streakDays || 0}
  tasksThisWeek={weeklyData.tasksCompleted}
  xp={xp}
/>


    {/* 📈 Momentum Ring, Leaderboard, Social */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <MomentumRing
        streakDays={streakDays}
        xp={xp}
        tier={tier}
        onClick={() => setShowChart(true)}
      />
      <LeaderboardCard currentUserId={user?.id} />
      <SocialPanel />
    </div>

    {/* 🧠 Your Projects */}
    <YourProjectsPanel projects={projects} />

    {/* 🧩 Chart Modal */}
    {showChart && (
      <ChartModal
        xpHistory={xpHistory}
        streakData={streakData}
        xpTierColor="#8B5CF6"
        onClose={() => setShowChart(false)}
      />
    )}

    {/* 📌 Assigned Tasks & Pinned Posts */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <AssignedTasksPanel tasks={user?.assignedTasks || []} />
      <PinnedForumPanel
        posts={forumPosts}
        onPostSubmit={(post) => setForumPosts(prev => [post, ...prev])}
      />
    </div>

    {/* 📡 Real-Time Activity */}
    <LiveActivityFeed feedItems={feedItems} />

    {/* 🤖 AI Suggestion */}
    <AISuggestionCard message="Coming soon: AI-generated tips just for you." />

    {/* 🛠️ Create Project Modal */}
    {showProjectModal && (
      <ProjectsCreate
        onClose={() => setShowProjectModal(false)}
        onCreated={handleProjectCreated}
      />
    )}

    {/* 🗓️ Weekly Report Modal */}
    {showWeeklyReport && (
      <WeeklyReportModal
        isOpen={showWeeklyReport}
        onClose={() => setShowWeeklyReport(false)}
        data={weeklyData}
      />
    )}
  </div>
)
}