// src/pages/ProjectHome.jsx - WORLD-CLASS BEHAVIORAL SCIENCE IMPLEMENTATION
import React, { useEffect, useState, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getProject, shipProject } from "../api/projects";
import { 
  Rocket, Plus, Calendar, Clock, Zap, Trophy, Flame, CheckCircle2, Target,
  ChevronLeft, ChevronRight, X, Upload, Mic, Eye, Users, TrendingUp,
  Battery, BatteryLow, BatteryMedium, Play, Pause, AlertCircle,
  Star, Sparkles, Award, MessageCircle, Timer, Coffee, Music
} from "lucide-react";
import { toast } from "../components/ui/toast";

// ⭐ CURSOR SYSTEM IMPORTS
import { useCursorContext } from "../context/CursorContext";
import useCursor, { useCursorFlash } from "../hooks/useCursor";
import usePresence, { useTeamPresence } from "../hooks/usePresence";

// =====================================
// BEHAVIORAL SCIENCE COMPONENTS
// =====================================

// 1. MICRO-WIN CELEBRATION
const MicroWinToast = ({ type, message, xp }) => {
  const getEmoji = () => {
    switch(type) {
      case 'task_started': return '🎯';
      case '5min_worked': return '🔥';
      case 'stuck_resolved': return '💡';
      case 'comeback': return '💪';
      case 'flow_state': return '⚡';
      default: return '✨';
    }
  };

  return (
    <div className="fixed top-20 right-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-3 rounded-xl shadow-2xl animate-slide-in-right z-50">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{getEmoji()}</span>
        <div>
          <p className="text-white font-bold text-sm">{message}</p>
          <p className="text-purple-100 text-xs">+{xp} XP</p>
        </div>
      </div>
    </div>
  );
};

// 2. LIVE WORK FEED (Social Proof)
const LiveWorkFeed = ({ teammates = [] }) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-fuchsia-500" />
        <h3 className="font-bold text-lg">Live Team Activity</h3>
      </div>

      <div className="space-y-3 max-h-60 overflow-y-auto">
        {teammates.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No teammates online right now</p>
            <p className="text-xs mt-1">You're blazing the trail! 🔥</p>
          </div>
        ) : (
          teammates.map((user, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl hover:bg-slate-900/70 transition-all cursor-pointer">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white font-bold">
                  {user.name[0]}
                </div>
                {user.isWorking && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-800 rounded-full animate-pulse" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">{user.name}</p>
                <p className="text-slate-400 text-xs truncate">{user.currentTask || 'Taking a break'}</p>
                {user.flowDuration > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Flame className="w-3 h-3 text-orange-400" />
                    <span className="text-xs text-orange-400">{user.flowDuration}min flow</span>
                  </div>
                )}
              </div>
              {user.isWorking && (
                <button className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-lg text-xs font-semibold hover:bg-purple-600/30 transition-all">
                  Join
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Motivation message */}
      {teammates.filter(u => u.isWorking).length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <p className="text-sm text-slate-300 flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-400" />
            {teammates.filter(u => u.isWorking).length} teammate{teammates.filter(u => u.isWorking).length > 1 ? 's' : ''} working now
          </p>
        </div>
      )}
    </div>
  );
};

// 3. ENERGY TRACKER
const EnergyTracker = ({ currentEnergy, onEnergyChange, tasks = [] }) => {
  const getEnergyIcon = (level) => {
    switch(level) {
      case 'high': return <Battery className="w-5 h-5 text-emerald-400" />;
      case 'medium': return <BatteryMedium className="w-5 h-5 text-yellow-400" />;
      case 'low': return <BatteryLow className="w-5 h-5 text-orange-400" />;
      default: return <Battery className="w-5 h-5" />;
    }
  };

  const getMatchedTasks = (energy) => {
    if (energy === 'high') return tasks.filter(t => t.effort === 'high' || !t.effort);
    if (energy === 'medium') return tasks.filter(t => t.effort === 'medium' || !t.effort);
    return tasks.filter(t => t.effort === 'low' || t.estimatedTime < 15);
  };

  const matchedTasks = getMatchedTasks(currentEnergy);

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        {getEnergyIcon(currentEnergy)}
        <h3 className="font-bold text-lg">Energy-Based Planning</h3>
      </div>

      <div className="mb-4">
        <p className="text-sm text-slate-400 mb-3">How's your energy right now?</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onEnergyChange('high')}
            className={`p-3 rounded-xl border-2 transition-all ${
              currentEnergy === 'high'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-emerald-500/50'
            }`}
          >
            <Battery className="w-5 h-5 mx-auto mb-1" />
            <p className="text-xs font-semibold">High</p>
          </button>
          <button
            onClick={() => onEnergyChange('medium')}
            className={`p-3 rounded-xl border-2 transition-all ${
              currentEnergy === 'medium'
                ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-yellow-500/50'
            }`}
          >
            <BatteryMedium className="w-5 h-5 mx-auto mb-1" />
            <p className="text-xs font-semibold">Medium</p>
          </button>
          <button
            onClick={() => onEnergyChange('low')}
            className={`p-3 rounded-xl border-2 transition-all ${
              currentEnergy === 'low'
                ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-orange-500/50'
            }`}
          >
            <BatteryLow className="w-5 h-5 mx-auto mb-1" />
            <p className="text-xs font-semibold">Low</p>
          </button>
        </div>
      </div>

      {/* Recommended tasks based on energy */}
      <div className="pt-4 border-t border-slate-700/50">
        <p className="text-sm font-semibold text-white mb-2">
          {currentEnergy === 'high' && '🔥 Tackle your hardest tasks now:'}
          {currentEnergy === 'medium' && '⚡ Good time for medium-effort work:'}
          {currentEnergy === 'low' && '🧘 Easy wins for low energy:'}
        </p>
        <div className="space-y-2">
          {matchedTasks.slice(0, 3).map((task, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-300 p-2 bg-slate-900/30 rounded-lg">
              <CheckCircle2 className="w-3 h-3 text-purple-400" />
              <span className="flex-1 truncate">{task.title}</span>
              <span className="text-slate-500">{task.estimatedTime || 15}m</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 4. STREAK PROTECTION WARNING
const StreakGuard = ({ streak, hoursSinceLastShip, onQuickWin }) => {
  const isEndangered = hoursSinceLastShip > 20;
  
  if (!isEndangered) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 max-w-md w-full bg-gradient-to-r from-orange-600 to-red-600 border-2 border-orange-400 rounded-2xl p-5 shadow-2xl animate-bounce-gentle z-50">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-white/20 rounded-xl">
          <Flame className="w-6 h-6 text-white animate-pulse" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg mb-1">🔥 Streak Alert!</h3>
          <p className="text-orange-100 text-sm mb-3">
            Your {streak}-day streak expires in {24 - Math.floor(hoursSinceLastShip)} hours!
          </p>
          <p className="text-white text-xs mb-4">Quick wins to keep the fire alive:</p>
          <div className="space-y-2">
            <button
              onClick={() => onQuickWin('Update README')}
              className="w-full bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all text-left"
            >
              ✅ Update README (2 min)
            </button>
            <button
              onClick={() => onQuickWin('Review PR')}
              className="w-full bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all text-left"
            >
              ✅ Review PR (5 min)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 5. AI ACCOUNTABILITY PARTNER
const AIAccountabilityPartner = ({ onSetGoal, morningGoal, eveningReview }) => {
  const [showMorningCheckin, setShowMorningCheckin] = useState(false);
  const [showEveningReview, setShowEveningReview] = useState(false);
  const [todayGoal, setTodayGoal] = useState('');

  const hour = new Date().getHours();
  const isMorning = hour >= 6 && hour < 12;
  const isEvening = hour >= 17 && hour < 22;

  useEffect(() => {
    // Show morning check-in once per day
    if (isMorning && !morningGoal) {
      setTimeout(() => setShowMorningCheckin(true), 2000);
    }
    // Show evening review
    if (isEvening && !eveningReview) {
      setTimeout(() => setShowEveningReview(true), 2000);
    }
  }, [isMorning, isEvening, morningGoal, eveningReview]);

  if (showMorningCheckin) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-purple-900 to-fuchsia-900 border border-purple-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-3xl mb-2">☀️</h2>
            <h3 className="text-2xl font-bold text-white mb-2">Good morning!</h3>
            <p className="text-purple-100 text-sm">What's your #1 priority today?</p>
          </div>

          <input
            type="text"
            value={todayGoal}
            onChange={(e) => setTodayGoal(e.target.value)}
            placeholder="Today I will..."
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 mb-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
            autoFocus
          />

          <div className="flex gap-3">
            <button
              onClick={() => {
                onSetGoal(todayGoal);
                setShowMorningCheckin(false);
              }}
              className="flex-1 bg-white text-purple-900 px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
            >
              Lock it in 🔒
            </button>
            <button
              onClick={() => setShowMorningCheckin(false)}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
            >
              Skip
            </button>
          </div>

          <p className="text-xs text-purple-200 mt-4 text-center">
            People who set morning goals complete 85% of their tasks
          </p>
        </div>
      </div>
    );
  }

  if (showEveningReview && morningGoal) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-indigo-900 to-purple-900 border border-indigo-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-3xl mb-2">🌙</h2>
            <h3 className="text-2xl font-bold text-white mb-2">How'd it go?</h3>
            <p className="text-indigo-100 text-sm mb-4">This morning you said:</p>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-white font-medium">"{morningGoal}"</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                toast({ title: "🎉 Amazing work!", variant: "success" });
                setShowEveningReview(false);
              }}
              className="w-full bg-emerald-500 hover:bg-emerald-600 px-6 py-3 rounded-xl text-white font-bold transition-all"
            >
              ✅ Crushed it!
            </button>
            <button
              onClick={() => {
                toast({ title: "Good effort! Tomorrow's a new day.", variant: "default" });
                setShowEveningReview(false);
              }}
              className="w-full bg-yellow-500 hover:bg-yellow-600 px-6 py-3 rounded-xl text-white font-bold transition-all"
            >
              ⚠️ Partially done
            </button>
            <button
              onClick={() => {
                toast({ title: "That's okay! We'll try again tomorrow.", variant: "default" });
                setShowEveningReview(false);
              }}
              className="w-full bg-slate-600 hover:bg-slate-700 px-6 py-3 rounded-xl text-white font-bold transition-all"
            >
              ❌ Didn't get to it
            </button>
          </div>

          <button
            onClick={() => setShowEveningReview(false)}
            className="w-full mt-3 px-6 py-2 text-white/70 hover:text-white text-sm transition-all"
          >
            Skip review
          </button>
        </div>
      </div>
    );
  }

  return null;
};

// 6. TASK MOMENTUM PROTECTION
const TaskGuardModal = ({ activeTask, taskDuration, onKeepWorking, onSwitch }) => {
  if (taskDuration < 2 || taskDuration > 10) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-orange-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-orange-500/20 rounded-xl">
            <AlertCircle className="w-6 h-6 text-orange-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg mb-2">⚠️ Task Switch Detected</h3>
            <p className="text-slate-300 text-sm mb-1">
              You've been working on "{activeTask}" for {taskDuration} minutes.
            </p>
            <p className="text-slate-400 text-xs mb-4">
              Research shows you're 40% less productive when switching early.
            </p>

            <div className="space-y-2">
              <button
                onClick={onKeepWorking}
                className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 px-6 py-3 rounded-xl text-white font-bold hover:shadow-xl transition-all"
              >
                Keep working (+25 XP) 🔥
              </button>
              <button
                onClick={onSwitch}
                className="w-full bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-xl text-white transition-all"
              >
                Switch anyway (no penalty)
              </button>
              <button
                onClick={() => {
                  toast({ title: "Take a good break! Come back strong.", variant: "default" });
                  onSwitch();
                }}
                className="w-full text-slate-400 hover:text-white text-sm transition-all"
              >
                Take a break instead
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 7. CO-WORKING SESSION
const CoWorkingSession = ({ teammates = [], onJoinSession }) => {
  const activeWorkers = teammates.filter(t => t.isWorking);
  
  if (activeWorkers.length === 0) return null;

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-purple-400" />
        <h3 className="font-bold text-lg">🎥 Live Co-Working</h3>
      </div>

      <div className="space-y-3">
        {activeWorkers.map((user, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                {user.name[0]}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">{user.name}</p>
              <p className="text-slate-400 text-xs">{user.currentTask}</p>
              <div className="flex items-center gap-1 mt-1">
                <Timer className="w-3 h-3 text-purple-400" />
                <span className="text-xs text-purple-400">{user.flowDuration}min in flow</span>
              </div>
            </div>
            <button
              onClick={() => onJoinSession(user)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm font-semibold transition-all"
            >
              Join
            </button>
          </div>
        ))}
      </div>

      {/* Pomodoro sync */}
      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-white">Team Pomodoro</span>
          </div>
          <span className="text-xs text-slate-400">Next break in 12 min</span>
        </div>
        <button className="w-full bg-gradient-to-r from-red-500 to-orange-500 px-4 py-2 rounded-lg text-white text-sm font-semibold hover:shadow-lg transition-all">
          🍅 Sync your timer
        </button>
      </div>
    </div>
  );
};

// 8. TEMPTATION BUNDLING (Reward System)
const RewardBundleModal = ({ task, onComplete, onSkip }) => {
  const [selectedReward, setSelectedReward] = useState('podcast');

  const rewards = [
    { id: 'podcast', label: '10min podcast break', icon: '🎧' },
    { id: 'music', label: '5min music break', icon: '🎵' },
    { id: 'coffee', label: 'Coffee break', icon: '☕' },
    { id: 'game', label: '5min game break', icon: '🎮' },
    { id: 'walk', label: 'Quick walk outside', icon: '🚶' },
  ];

  return (
    <div className="mb-4 p-4 bg-gradient-to-r from-purple-900/30 to-fuchsia-900/30 border border-purple-500/30 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-yellow-400" />
        <h4 className="font-semibold text-white">🎁 Unlock a reward!</h4>
      </div>
      
      <p className="text-sm text-slate-300 mb-3">
        Complete this task and unlock your chosen reward:
      </p>

      <select
        value={selectedReward}
        onChange={(e) => setSelectedReward(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        {rewards.map(r => (
          <option key={r.id} value={r.id}>
            {r.icon} {r.label}
          </option>
        ))}
      </select>

      <button
        onClick={() => onComplete(selectedReward)}
        className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-2 rounded-lg text-white font-semibold hover:shadow-lg transition-all"
      >
        Complete task & claim reward
      </button>
    </div>
  );
};

// =====================================
// MAIN PROJECT HOME COMPONENT
// =====================================

export default function ProjectHome() {
  const { id } = useParams();
  const { user } = useContext(AuthContext) || {};
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShipModal, setShowShipModal] = useState(false);
  const [shipDescription, setShipDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());

  // ⭐ BEHAVIORAL SCIENCE STATE
  const [currentEnergy, setCurrentEnergy] = useState('medium');
  const [morningGoal, setMorningGoal] = useState('');
  const [eveningReview, setEveningReview] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [taskStartTime, setTaskStartTime] = useState(null);
  const [showTaskGuard, setShowTaskGuard] = useState(false);
  const [microWin, setMicroWin] = useState(null);
  const [hoursSinceLastShip, setHoursSinceLastShip] = useState(0);
  const [workSessionDuration, setWorkSessionDuration] = useState(0);

  // Mock team data (replace with real data from cursor system)
  const [teammates] = useState([
    { name: 'Sarah', isWorking: true, currentTask: 'Design review', flowDuration: 47, avatar: 'S' },
    { name: 'Jordan', isWorking: true, currentTask: 'Beta testing', flowDuration: 23, avatar: 'J' },
    { name: 'Alex', isWorking: false, currentTask: 'Taking a break', flowDuration: 0, avatar: 'A' },
  ]);

  // ⭐ CURSOR SYSTEM HOOKS
  const { joinProject, leaveProject, isConnected } = useCursorContext();
  
  const { position, activity, isTracking } = useCursor({
    enabled: true,
    detectActivity: true,
    detectProximity: true,
    proximityThreshold: 50,
  });

  const { 
    status, 
    isOnline, 
    projectStats 
  } = usePresence({
    autoDetectIdle: true,
    autoSendHeartbeat: true,
    idleTimeout: 5 * 60 * 1000,
  });

  const teamActivity = useTeamPresence();
  const { flashShip, flashTyping, flashClicking } = useCursorFlash();

  // ⭐ JOIN/LEAVE PROJECT
  useEffect(() => {
    if (id) {
      joinProject(id);
    }
    return () => {
      leaveProject();
    };
  }, [id, joinProject, leaveProject]);

  // ⭐ LOAD PROJECT
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await getProject(id);
        if (!ignore) {
          setProject(data);
          setShipDescription(`Update: ${data?.title || ""}`);
        }
      } catch (e) {
        if (!ignore) toast({ title: "Failed to load project", variant: "error" });
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [id]);

  // ⭐ WORK SESSION TIMER (for micro-wins)
  useEffect(() => {
    if (activeTask) {
      const interval = setInterval(() => {
        setWorkSessionDuration(prev => {
          const newDuration = prev + 1;
          
          // Trigger micro-wins at milestones
          if (newDuration === 5) {
            setMicroWin({ type: '5min_worked', message: '5 min flow state!', xp: 10 });
            setTimeout(() => setMicroWin(null), 3000);
          }
          if (newDuration === 15) {
            setMicroWin({ type: 'flow_state', message: '15 min deep work!', xp: 25 });
            setTimeout(() => setMicroWin(null), 3000);
          }
          
          return newDuration;
        });
      }, 60000); // Every minute

      return () => clearInterval(interval);
    }
  }, [activeTask]);

  // ⭐ ENHANCED SHIP HANDLER
  const handleShip = async () => {
    if (!shipDescription.trim()) {
      toast({ title: "Add a description", variant: "error" });
      return;
    }

    try {
      await shipProject(id, { description: shipDescription });
      
      flashShip();
      
      // Show epic celebration
      setMicroWin({ type: 'task_started', message: '🎉 Shipped! Amazing work!', xp: 50 });
      setTimeout(() => setMicroWin(null), 4000);
      
      toast({
        title: "🎉 Shipped!",
        description: `${shipDescription} - +50 XP`,
        variant: "success"
      });
      
      setShowShipModal(false);
      setShipDescription(`Update: ${project?.title || ""}`);
      const updated = await getProject(id);
      setProject(updated);
      
      // Reset last ship time
      setHoursSinceLastShip(0);
    } catch (e) {
      toast({ title: "Ship failed", variant: "error" });
    }
  };

  // ⭐ START TASK WITH MOMENTUM TRACKING
  const handleStartTask = (task) => {
    setActiveTask(task.title);
    setTaskStartTime(Date.now());
    setWorkSessionDuration(0);
    
    setMicroWin({ type: 'task_started', message: 'Lock in!', xp: 5 });
    setTimeout(() => setMicroWin(null), 2000);
  };

  // ⭐ HANDLE TASK SWITCHING
  const handleTaskSwitch = (newTask) => {
    if (activeTask && taskStartTime) {
      const duration = Math.floor((Date.now() - taskStartTime) / (1000 * 60));
      if (duration > 2 && duration < 10) {
        setShowTaskGuard(true);
        return;
      }
    }
    handleStartTask(newTask);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { 
      daysInMonth: lastDay.getDate(), 
      startingDayOfWeek: firstDay.getDay(), 
      year, 
      month 
    };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(selectedDate);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const deadlines = [
    { date: 15, title: "Beta launch", urgent: true },
    { date: 22, title: "Design review", urgent: false },
    { date: 28, title: "Team sync", urgent: false }
  ];

  const getDeadlinesForDay = (day) => deadlines.filter(d => d.date === day);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #020617, #0f172a, #020617)' }} className="flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) return null;

  const tasks = project?.tasks || [];
  const completedToday = tasks.filter(t => {
    if (!t.completedAt) return false;
    const completed = new Date(t.completedAt);
    const today = new Date();
    return completed.toDateString() === today.toDateString();
  }).length;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #020617, #0f172a, #020617)' }} className="text-white pb-20">
      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* ⭐ MICRO-WIN TOAST */}
        {microWin && <MicroWinToast {...microWin} />}
        
        {/* ⭐ STREAK GUARD */}
        <StreakGuard
          streak={7}
          hoursSinceLastShip={hoursSinceLastShip}
          onQuickWin={(taskName) => {
            setShipDescription(taskName);
            setShowShipModal(true);
          }}
        />
        
        {/* ⭐ TASK MOMENTUM GUARD */}
        {showTaskGuard && (
          <TaskGuardModal
            activeTask={activeTask}
            taskDuration={Math.floor((Date.now() - taskStartTime) / (1000 * 60))}
            onKeepWorking={() => {
              setShowTaskGuard(false);
              setMicroWin({ type: 'flow_state', message: 'Focus protected!', xp: 25 });
              setTimeout(() => setMicroWin(null), 2000);
            }}
            onSwitch={() => setShowTaskGuard(false)}
          />
        )}
        
        {/* ⭐ AI ACCOUNTABILITY PARTNER */}
        <AIAccountabilityPartner
          onSetGoal={(goal) => {
            setMorningGoal(goal);
            toast({ title: "Goal locked in! Let's crush it 🔥", variant: "success" });
          }}
          morningGoal={morningGoal}
          eveningReview={eveningReview}
        />

        {/* HEADER */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                  {project.title}
                </h1>
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-sm">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="font-semibold">7d streak</span>
                </div>
              </div>
              <p className="text-slate-400 mt-1">
                {teamActivity.isActive ? '🔥 ' : '😴 '} 
                {teamActivity.message}
              </p>
              
              {/* Today's goal display */}
              {morningGoal && (
                <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <p className="text-xs text-purple-300 mb-1">Today's goal:</p>
                  <p className="text-white font-medium text-sm">"{morningGoal}"</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-400">{completedToday}/5</div>
                <div className="text-xs text-slate-400">Ships today</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-400">{progressPct}%</div>
                <div className="text-xs text-slate-400">Complete</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-fuchsia-400">
                  {projectStats.online}
                </div>
                <div className="text-xs text-slate-400">Online</div>
              </div>
            </div>
          </div>

          <div className="mt-4 h-3 bg-slate-700/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* MAIN GRID: CALENDAR + TASKS + BEHAVIORAL FEATURES */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: CALENDAR + ENERGY TRACKER */}
          <div className="space-y-6">
            {/* CALENDAR */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  {monthNames[month]} {year}
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedDate(new Date(year, month - 1, 1))}
                    className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedDate(new Date(year, month + 1, 1))}
                    className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="font-semibold text-slate-500 py-2">{day}</div>
                ))}
                
                {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayDeadlines = getDeadlinesForDay(day);
                  const isToday = new Date().getDate() === day && 
                                 new Date().getMonth() === month && 
                                 new Date().getFullYear() === year;
                  const hasDeadline = dayDeadlines.length > 0;
                  const isUrgent = dayDeadlines.some(d => d.urgent);

                  return (
                    <div 
                      key={day}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all relative group
                        ${isToday ? 'bg-purple-500 text-white font-bold' : 'hover:bg-slate-700/50'}
                        ${hasDeadline && !isToday ? 'border border-fuchsia-500/50' : ''}
                      `}
                    >
                      <span className="text-xs">{day}</span>
                      {hasDeadline && (
                        <>
                          <div className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isUrgent ? 'bg-red-500' : 'bg-fuchsia-400'}`} />
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-slate-900 border border-purple-500/30 rounded-lg px-2 py-1 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
                            {dayDeadlines[0].title}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <h4 className="text-xs font-semibold text-slate-400 mb-2">Upcoming</h4>
                {deadlines.slice(0, 3).map((d, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-700/30 cursor-pointer transition-colors">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${d.urgent ? 'bg-red-500' : 'bg-fuchsia-400'}`} />
                      <span className="text-sm">{d.title}</span>
                    </div>
                    <span className="text-xs text-slate-400">{monthNames[month]} {d.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ⭐ ENERGY TRACKER */}
            <EnergyTracker
              currentEnergy={currentEnergy}
              onEnergyChange={setCurrentEnergy}
              tasks={tasks}
            />
          </div>

          {/* MIDDLE COLUMN: TASKS */}
          <div className="space-y-4">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Add a task... (press Enter)"
                  className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-slate-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      flashTyping();
                      toast({ title: "Task added", variant: "success" });
                      e.target.value = '';
                    }
                  }}
                />
                <button 
                  onClick={flashClicking}
                  className="p-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl hover:shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {tasks.length === 0 ? (
                <div className="bg-slate-800/30 border border-dashed border-slate-700 rounded-2xl p-12 text-center">
                  <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No tasks yet. Add one above to get started.</p>
                </div>
              ) : (
                tasks.map((task, i) => (
                  <div 
                    key={task._id || i}
                    onClick={() => !task.completed && handleTaskSwitch(task)}
                    className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 hover:border-purple-500/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          flashClicking();
                        }}
                        className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                          ${task.completed 
                            ? 'bg-emerald-500 border-emerald-500' 
                            : 'border-slate-600 group-hover:border-purple-500'
                          }`}
                      >
                        {task.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </button>
                      
                      <div className="flex-1">
                        <p className={`font-medium ${task.completed ? 'line-through text-slate-500' : ''}`}>
                          {task.title || "Untitled task"}
                        </p>
                        {task.dueDate && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                        {activeTask === task.title && (
                          <div className="flex items-center gap-1 mt-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-xs text-emerald-400">Working on this ({workSessionDuration} min)</span>
                          </div>
                        )}
                      </div>

                      {!task.completed && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowShipModal(true);
                            setShipDescription(task.title);
                          }}
                          className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-lg text-xs font-semibold transition-all hover:bg-purple-600/30"
                        >
                          Ship
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: SOCIAL FEATURES */}
          <div className="space-y-6">
            {/* ⭐ LIVE WORK FEED */}
            <LiveWorkFeed teammates={teammates} />
            
            {/* ⭐ CO-WORKING SESSION */}
            <CoWorkingSession
              teammates={teammates}
              onJoinSession={(user) => {
                toast({ 
                  title: `Joined ${user.name}'s session!`, 
                  description: "Your timers are now synced 🤝",
                  variant: "success" 
                });
              }}
            />
          </div>
        </div>

        {/* AI COACH */}
        <div className="mt-6 bg-gradient-to-r from-purple-900/30 to-fuchsia-900/30 border border-purple-500/30 rounded-2xl p-5 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">AI Coach says:</h3>
              <p className="text-slate-300">
                {currentEnergy === 'high' && projectStats.online > 2 
                  ? `You're at peak energy AND ${projectStats.online} teammates are online! Perfect time to tackle that ${morningGoal || 'design review'}.`
                  : currentEnergy === 'low'
                  ? "Low energy detected. Try these quick wins to build momentum: Update docs, review code, or take a 5-min walk."
                  : "You're working solo right now. Stack two 25-min sprints to hit your 5-ship goal today."
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING SHIP BUTTON */}
      <button
        onClick={() => setShowShipModal(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center group z-50"
        style={{ animation: completedToday < 5 ? 'pulse 2s infinite' : 'none' }}
      >
        <Rocket className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
      </button>

      {/* SHIP MODAL */}
      {showShipModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                Ship This
              </h2>
              <button onClick={() => setShowShipModal(false)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              value={shipDescription}
              onChange={(e) => setShipDescription(e.target.value)}
              placeholder="What did you just ship?"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 mb-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
              onKeyDown={(e) => { 
                if (e.key === 'Enter') {
                  handleShip();
                }
              }}
            />

            <div className="flex items-center gap-2 mb-6">
              <button 
                onClick={flashClicking}
                className="flex-1 p-3 bg-slate-800 border border-slate-700 rounded-xl hover:border-purple-500/50 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Upload className="w-4 h-4" />
                Attach file
              </button>
              <button 
                onClick={flashClicking}
                className="flex-1 p-3 bg-slate-800 border border-slate-700 rounded-xl hover:border-purple-500/50 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Mic className="w-4 h-4" />
                Voice note
              </button>
            </div>

            <button
              onClick={handleShip}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-all"
            >
              Ship (+50 XP) 🚢
            </button>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}