// src/pages/Discover.jsx - WEEK 6 SOCIAL DISCOVERY
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Flame, TrendingUp, Users, Heart, Clock, Zap, Star,
  UserPlus, MessageCircle, Bell, ChevronRight, Rocket,
  Target, Coffee, Moon, Activity, Award, Sparkles
} from 'lucide-react';
import { useIsMobile } from '../hooks/useMobile';
import { toast } from '../components/ui/toast';

// =====================================
// JUNGLE VIEW COMPONENTS
// =====================================

// 1. HOT STREAKS SECTION
const HotStreaksSection = ({ isMobile }) => {
  const navigate = useNavigate();
  
  // Mock data - will be replaced with real API
  const [hotStreaks, setHotStreaks] = useState([
    {
      id: '1',
      projectName: 'AI Writing Tool',
      teamName: 'Indie Hackers',
      emoji: '✨',
      streak: 127,
      members: 3,
      lastShip: 'Launched premium tier',
      momentum: 'blazing',
      avatar: '👥'
    },
    {
      id: '2',
      projectName: 'Fitness Tracker Pro',
      teamName: 'Health Squad',
      emoji: '💪',
      streak: 45,
      members: 5,
      lastShip: 'Added social features',
      momentum: 'high',
      avatar: '🏃'
    },
    {
      id: '3',
      projectName: 'Code Reviewer',
      teamName: 'Dev Tools',
      emoji: '🔍',
      streak: 23,
      members: 2,
      lastShip: 'GitHub integration',
      momentum: 'steady',
      avatar: '💻'
    }
  ]);

  const getMomentumColor = (momentum) => {
    switch(momentum) {
      case 'blazing': return 'from-orange-600 to-red-600';
      case 'high': return 'from-purple-600 to-fuchsia-600';
      case 'steady': return 'from-blue-600 to-cyan-600';
      default: return 'from-slate-600 to-slate-700';
    }
  };

  const handleRequestJoin = (project) => {
    toast({ title: `Request sent to ${project.teamName}!`, variant: 'success' });
  };

  const handleStartCowork = (project) => {
    toast({ title: `Starting co-work session with ${project.teamName}`, variant: 'success' });
  };

  const handleFollowUpdates = (project) => {
    toast({ title: `Now following ${project.projectName}`, variant: 'success' });
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl flex items-center justify-center">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">🔥 Hot Streaks</h2>
          <p className="text-sm text-slate-400">Teams on 10+ day streaks crushing it</p>
        </div>
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
        {hotStreaks.map((project) => (
          <div
            key={project.id}
            className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-5 hover:border-purple-500/50 transition-all cursor-pointer group"
          >
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <span className="text-4xl">{project.emoji}</span>
              <div className="flex-1">
                <h3 className="font-bold text-white text-lg group-hover:text-purple-400 transition-colors">
                  {project.projectName}
                </h3>
                <p className="text-sm text-slate-400">{project.teamName}</p>
              </div>
            </div>

            {/* Streak Badge */}
            <div className={`bg-gradient-to-r ${getMomentumColor(project.momentum)} p-0.5 rounded-xl mb-4`}>
              <div className="bg-slate-900 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <span className="font-bold text-white text-lg">{project.streak} days</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Users className="w-3 h-3" />
                  <span>{project.members}</span>
                </div>
              </div>
            </div>

            {/* Last Ship */}
            <div className="bg-slate-900/50 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Rocket className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold text-slate-300">Latest:</span>
              </div>
              <p className="text-sm text-white">{project.lastShip}</p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleRequestJoin(project)}
                className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-xs font-semibold transition-all active:scale-95 flex flex-col items-center gap-1"
              >
                <UserPlus className="w-4 h-4" />
                <span>Join</span>
              </button>
              <button
                onClick={() => handleStartCowork(project)}
                className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-xs font-semibold transition-all active:scale-95 flex flex-col items-center gap-1"
              >
                <Users className="w-4 h-4" />
                <span>Co-work</span>
              </button>
              <button
                onClick={() => handleFollowUpdates(project)}
                className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-all active:scale-95 flex flex-col items-center gap-1"
              >
                <Bell className="w-4 h-4" />
                <span>Follow</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 2. QUIET BUT PROMISING SECTION
const QuietButPromisingSection = ({ isMobile }) => {
  const navigate = useNavigate();
  
  // Mock data - projects that stalled but have potential
  const [quietProjects, setQuietProjects] = useState([
    {
      id: '1',
      projectName: 'Recipe Sharing App',
      ownerName: 'Sarah Chen',
      emoji: '🍳',
      lastActivity: '14 days ago',
      reason: 'Strong start, needs momentum',
      completionRate: 65,
      totalShips: 23,
      avatar: '👩‍🍳'
    },
    {
      id: '2',
      projectName: 'Study Timer',
      ownerName: 'Alex Rivera',
      emoji: '⏰',
      lastActivity: '21 days ago',
      reason: 'Great concept, waiting for push',
      completionRate: 48,
      totalShips: 15,
      avatar: '📚'
    },
    {
      id: '3',
      projectName: 'Mood Tracker',
      ownerName: 'Jordan Lee',
      emoji: '😊',
      lastActivity: '9 days ago',
      reason: 'Almost there, needs finishing',
      completionRate: 82,
      totalShips: 31,
      avatar: '🧘'
    }
  ]);

  const handleOfferHelp = (project) => {
    toast({ title: `Offering help to ${project.ownerName}!`, variant: 'success' });
  };

  const handleSendEncouragement = (project) => {
    toast({ title: `Encouragement sent to ${project.projectName}!`, variant: 'success' });
  };

  const handleFollowProgress = (project) => {
    toast({ title: `Now following ${project.projectName}`, variant: 'success' });
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
          <Target className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">🌱 Quiet but Promising</h2>
          <p className="text-sm text-slate-400">Projects that need a push to finish strong</p>
        </div>
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
        {quietProjects.map((project) => (
          <div
            key={project.id}
            className="bg-slate-800/50 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-5 hover:border-blue-500/50 transition-all"
          >
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <span className="text-3xl">{project.emoji}</span>
              <div className="flex-1">
                <h3 className="font-bold text-white text-lg">{project.projectName}</h3>
                <p className="text-sm text-slate-400">by {project.ownerName}</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Last activity</div>
                <div className="text-sm font-semibold text-orange-400">{project.lastActivity}</div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-900/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-slate-400">Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                      style={{ width: `${project.completionRate}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-white">{project.completionRate}%</span>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Rocket className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-slate-400">Ships</span>
                </div>
                <div className="text-lg font-bold text-white">{project.totalShips}</div>
              </div>
            </div>

            {/* Reason */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-4">
              <p className="text-sm text-slate-300">💡 {project.reason}</p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleOfferHelp(project)}
                className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-xs font-semibold transition-all active:scale-95 flex flex-col items-center gap-1"
              >
                <UserPlus className="w-4 h-4" />
                <span>Help</span>
              </button>
              <button
                onClick={() => handleSendEncouragement(project)}
                className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-all active:scale-95 flex flex-col items-center gap-1"
              >
                <Heart className="w-4 h-4" />
                <span>Cheer</span>
              </button>
              <button
                onClick={() => handleFollowProgress(project)}
                className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-xs font-semibold transition-all active:scale-95 flex flex-col items-center gap-1"
              >
                <Bell className="w-4 h-4" />
                <span>Follow</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. PEOPLE WHO WORK LIKE YOU SECTION
const PeopleWorkLikeYouSection = ({ isMobile }) => {
  const navigate = useNavigate();
  
  // Mock data - people with similar work patterns
  const [similarPeople, setSimilarPeople] = useState([
    {
      id: '1',
      name: 'Maya Patel',
      avatar: '👩‍💻',
      workStyle: 'Night Owl',
      similarity: 92,
      peakTime: '9pm - 11pm',
      currentProject: 'SaaS Dashboard',
      streak: 12,
      reason: 'You both work best late at night'
    },
    {
      id: '2',
      name: 'Chris Wong',
      avatar: '👨‍🎨',
      workStyle: 'Early Bird',
      similarity: 87,
      peakTime: '6am - 9am',
      currentProject: 'Design System',
      streak: 8,
      reason: 'Similar task complexity preference'
    },
    {
      id: '3',
      name: 'Taylor Brooks',
      avatar: '🧑‍🔬',
      workStyle: 'Deep Focus',
      similarity: 85,
      peakTime: 'Tuesday/Thursday',
      currentProject: 'ML Model',
      streak: 45,
      reason: 'Long uninterrupted work sessions'
    }
  ]);

  const handleConnect = (person) => {
    toast({ title: `Connection request sent to ${person.name}!`, variant: 'success' });
  };

  const handleScheduleCowork = (person) => {
    toast({ title: `Co-work session scheduled with ${person.name}`, variant: 'success' });
  };

  const handleViewProfile = (person) => {
    toast({ title: `Viewing ${person.name}'s profile`, variant: 'success' });
  };

  const getWorkStyleIcon = (style) => {
    switch(style) {
      case 'Night Owl': return <Moon className="w-4 h-4 text-purple-400" />;
      case 'Early Bird': return <Coffee className="w-4 h-4 text-orange-400" />;
      case 'Deep Focus': return <Target className="w-4 h-4 text-blue-400" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">✨ People Who Work Like You</h2>
          <p className="text-sm text-slate-400">Based on your patterns and preferences</p>
        </div>
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'} gap-4`}>
        {similarPeople.map((person) => (
          <div
            key={person.id}
            className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-5 hover:border-purple-500/50 transition-all"
          >
            {/* Profile */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-full flex items-center justify-center text-2xl">
                {person.avatar}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white">{person.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {getWorkStyleIcon(person.workStyle)}
                  <span className="text-xs text-slate-400">{person.workStyle}</span>
                </div>
              </div>
            </div>

            {/* Similarity Badge */}
            <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 rounded-xl p-3 mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-emerald-300">Match Score</span>
                <span className="text-lg font-bold text-emerald-400">{person.similarity}%</span>
              </div>
              <p className="text-xs text-slate-400">{person.reason}</p>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-slate-300">Peak: {person.peakTime}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Rocket className="w-4 h-4 text-purple-400" />
                <span className="text-slate-300">{person.currentProject}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-slate-300">{person.streak} day streak</span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleConnect(person)}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-semibold transition-all active:scale-95"
              >
                Connect
              </button>
              <button
                onClick={() => handleScheduleCowork(person)}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold transition-all active:scale-95"
              >
                Co-work
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =====================================
// MAIN DISCOVER PAGE
// =====================================

export default function Discover() {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #020617, #0f172a, #020617)' }} className="flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #020617, #0f172a, #020617)' }} className="text-white pb-20">
      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4' : 'px-6'} py-8`}>
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                Discover
              </h1>
              <p className="text-slate-400">Find your tribe in the jungle 🌴</p>
            </div>
          </div>
        </div>

        {/* Jungle View Sections */}
        <HotStreaksSection isMobile={isMobile} />
        <QuietButPromisingSection isMobile={isMobile} />
        <PeopleWorkLikeYouSection isMobile={isMobile} />

      </div>
    </div>
  );
}
