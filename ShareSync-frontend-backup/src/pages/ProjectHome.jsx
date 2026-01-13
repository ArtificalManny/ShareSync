// src/pages/ProjectHome.jsx - FULLY INTEGRATED: MOBILE + QUICK ACTIONS + HEALTH + SPRINTS + HAND-OFFS + SETTINGS + MEMBERS + SUGGESTIONS
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProject, shipProject } from "../api/projects";
import useProjectTasks from "../hooks/useProjectTasks";
import { 
  Rocket, Plus, Calendar, Clock, Zap, Trophy, Flame, CheckCircle2, Target,
  ChevronLeft, ChevronRight, X, Upload, Mic, Eye, Users, TrendingUp,
  Battery, BatteryLow, BatteryMedium, Play, Pause, AlertCircle,
  Star, Sparkles, Award, MessageCircle, Timer, Coffee, Music,
  Activity, TrendingDown, BarChart3, PieChart, UserCheck, Settings
} from "lucide-react";
import { toast } from "../components/ui/toast";

// ⭐ MOBILE IMPORTS
import { useIsMobile } from "../hooks/useMobile";
import BottomSheet from "../components/mobile/BottomSheet";
import MobileAnnouncementCreate from "../components/mobile/MobileAnnouncementCreate";

// ⭐ QUICK ACTIONS IMPORTS
import QuickActionsManager from '../components/quick-actions/QuickActionsManager';
import KeyboardShortcuts from '../components/quick-actions/KeyboardShortcuts';

// ⭐ WEEK 8 DAY 3-4: TEAM SPRINTS IMPORT
import TeamSprintManager from '../components/sprints/TeamSprintManager';

// ⭐ WEEK 8 DAY 5-6: HAND-OFF IMPORTS
import HandoffRequest from '../components/handoff/HandoffRequest';
import HandoffManager from '../components/handoff/HandoffManager';
import HandoffButton from '../components/handoff/HandoffButton';

// ⭐ PROJECT ENHANCEMENTS: MEMBERS & SUGGESTIONS
import { MembersPanel } from '../components/members';
import { SuggestionsPanel } from '../components/suggestions';

// ⭐ CURSOR SYSTEM IMPORTS
import { useCursorContext } from "../context/CursorContext";
import useCursor, { useCursorFlash } from "../hooks/useCursor";
import usePresence, { useTeamPresence } from "../hooks/usePresence";

// ⭐ COMPONENT IMPORTS
import CollaborationPanel from "../components/project/CollaborationPanel";
import Announcements from "../components/project/Announcements";

// ⭐ WEEK 6: ECOSYSTEM API
import ecosystemApi from "../services/ecosystemApi";

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

// 2. ENERGY TRACKER
const EnergyTracker = ({ currentEnergy, onEnergyChange, tasks = [] }) => {
  const isMobile = useIsMobile();
  
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
    <div className={`bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-5 shadow-xl ${isMobile ? 'mobile-card' : ''}`}>
      <div className="flex items-center gap-2 mb-4">
        {getEnergyIcon(currentEnergy)}
        <h3 className="font-bold text-lg">Energy-Based Planning</h3>
      </div>

      <div className="mb-4">
        <p className="text-sm text-slate-400 mb-3">How's your energy right now?</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onEnergyChange('high')}
            className={`p-3 rounded-xl border-2 transition-all tap-target ${
              currentEnergy === 'high'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-emerald-500/50 active:scale-95'
            }`}
          >
            <Battery className="w-5 h-5 mx-auto mb-1" />
            <p className="text-xs font-semibold">High</p>
          </button>
          <button
            onClick={() => onEnergyChange('medium')}
            className={`p-3 rounded-xl border-2 transition-all tap-target ${
              currentEnergy === 'medium'
                ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-yellow-500/50 active:scale-95'
            }`}
          >
            <BatteryMedium className="w-5 h-5 mx-auto mb-1" />
            <p className="text-xs font-semibold">Medium</p>
          </button>
          <button
            onClick={() => onEnergyChange('low')}
            className={`p-3 rounded-xl border-2 transition-all tap-target ${
              currentEnergy === 'low'
                ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-orange-500/50 active:scale-95'
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

// ⭐ WEEK 6: PROJECT HEARTBEAT CARD
const ProjectHeartbeatCard = ({ projectId, isMobile }) => {
  const [heartbeat, setHeartbeat] = useState({
    shipsThisWeek: 4,
    shipsLastWeek: 7,
    activeMembers: 2,
    totalMembers: 5,
    mostActiveTime: 'Tuesday evenings',
    daysSinceLastShip: 2,
    trend: 'down',
    loading: true
  });

  useEffect(() => {
    // TODO: Fetch real heartbeat data from API
    setTimeout(() => {
      setHeartbeat(prev => ({ ...prev, loading: false }));
    }, 500);
  }, [projectId]);

  const getTrendIcon = () => {
    if (heartbeat.trend === 'up') return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (heartbeat.trend === 'down') return <TrendingDown className="w-4 h-4 text-orange-400" />;
    return <Activity className="w-4 h-4 text-blue-400" />;
  };

  const getTrendColor = () => {
    if (heartbeat.trend === 'up') return 'text-emerald-400';
    if (heartbeat.trend === 'down') return 'text-orange-400';
    return 'text-blue-400';
  };

  if (heartbeat.loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-5 animate-pulse">
        <div className="h-32 bg-slate-700/50 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-purple-400" />
        <h3 className="font-bold text-lg">Project Heartbeat</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900/50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Rocket className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-slate-400">Ships this week</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{heartbeat.shipsThisWeek}</span>
            <div className={`flex items-center gap-1 text-xs ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>from {heartbeat.shipsLastWeek}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-400">Active members</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {heartbeat.activeMembers}/{heartbeat.totalMembers}
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400">Most activity</span>
          </div>
          <div className="text-sm font-semibold text-white">{heartbeat.mostActiveTime}</div>
        </div>

        <div className="bg-slate-900/50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-slate-400">Last ship</span>
          </div>
          <div className="text-2xl font-bold text-white">{heartbeat.daysSinceLastShip}d</div>
        </div>
      </div>

      <div className={`mt-4 p-3 rounded-xl border ${
        heartbeat.trend === 'up' 
          ? 'bg-emerald-500/10 border-emerald-500/30' 
          : heartbeat.trend === 'down'
          ? 'bg-orange-500/10 border-orange-500/30'
          : 'bg-blue-500/10 border-blue-500/30'
      }`}>
        <p className="text-sm font-medium text-white">
          {heartbeat.trend === 'up' && '✨ Project momentum is strong!'}
          {heartbeat.trend === 'down' && '⚠️ Activity is slowing down'}
          {heartbeat.trend === 'stable' && '�� Steady progress'}
        </p>
      </div>
    </div>
  );
};

// ⭐ WEEK 6: TEAM BALANCE MONITOR
const TeamBalanceMonitor = ({ projectId, userId, isMobile }) => {
  const [balance, setBalance] = useState({
    userPercentage: 71,
    breakdown: [
      { userId: 'user1', name: 'You', percentage: 71, color: 'purple' },
      { userId: 'user2', name: 'Sarah', percentage: 18, color: 'blue' },
      { userId: 'user3', name: 'Mike', percentage: 11, color: 'emerald' }
    ],
    loading: true
  });

  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    // TODO: Fetch real balance data from API
    setTimeout(() => {
      setBalance(prev => ({ ...prev, loading: false }));
    }, 500);
  }, [projectId, userId]);

  const getBalanceColor = (percentage) => {
    if (percentage >= 70) return 'orange';
    if (percentage >= 50) return 'yellow';
    return 'emerald';
  };

  const getBalanceMessage = (percentage) => {
    if (percentage >= 70) return "You're carrying this project";
    if (percentage >= 50) return "You're doing most of the work";
    return "Work is well distributed";
  };

  const getColorClasses = (color) => {
    const colors = {
      purple: 'bg-purple-500',
      blue: 'bg-blue-500',
      emerald: 'bg-emerald-500',
      orange: 'bg-orange-500',
      yellow: 'bg-yellow-500'
    };
    return colors[color] || 'bg-slate-500';
  };

  if (balance.loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-5 animate-pulse">
        <div className="h-24 bg-slate-700/50 rounded"></div>
      </div>
    );
  }

  const balanceColor = getBalanceColor(balance.userPercentage);

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <PieChart className="w-5 h-5 text-purple-400" />
        <h3 className="font-bold text-lg">Team Balance</h3>
      </div>

      <div className={`bg-${balanceColor}-500/10 border border-${balanceColor}-500/30 rounded-xl p-4 mb-4`}>
        <div className="flex items-center gap-3 mb-2">
          <div className={`text-4xl font-bold text-${balanceColor}-400`}>
            {balance.userPercentage}%
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{getBalanceMessage(balance.userPercentage)}</p>
            <p className="text-xs text-slate-400">of total project work</p>
          </div>
        </div>

        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          {balance.breakdown.map((member, idx) => (
            <div
              key={idx}
              className={`h-full ${getColorClasses(member.color)} inline-block`}
              style={{ width: `${member.percentage}%` }}
            />
          ))}
        </div>
      </div>

      <button
        onClick={() => setShowBreakdown(!showBreakdown)}
        className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
      >
        <BarChart3 className="w-4 h-4" />
        {showBreakdown ? 'Hide Breakdown' : 'Review Allocation'}
      </button>

      {showBreakdown && (
        <div className="mt-4 space-y-2 pt-4 border-t border-slate-700/50">
          <p className="text-xs font-semibold text-slate-400 mb-2">Work Distribution:</p>
          {balance.breakdown.map((member, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className={`w-8 h-8 ${getColorClasses(member.color)} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                {member.name[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{member.name}</span>
                  <span className="text-sm font-bold text-white">{member.percentage}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getColorClasses(member.color)}`}
                    style={{ width: `${member.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// =====================================
// MAIN PROJECT HOME COMPONENT
// =====================================

export default function ProjectHome() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShipModal, setShowShipModal] = useState(false);
  const [showAddTaskSheet, setShowAddTaskSheet] = useState(false);
  const [showAnnouncementSheet, setShowAnnouncementSheet] = useState(false);
  const [shipDescription, setShipDescription] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // ⭐ PROJECT DISPLAY STATE
  const [projectBanner] = useState('https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=400&fit=crop');
  const [projectPicture] = useState('🚀');
  const [projectName] = useState('OpenShare Development');
  const [isPublicProject] = useState(true); // Set based on project settings from API
  const [isProjectMember] = useState(true); // Set based on user role from API

  // ⭐ WEEK 8 DAY 5-6: HAND-OFF STATE
  const [showHandoffRequest, setShowHandoffRequest] = useState(false);
  const [selectedTaskForHandoff, setSelectedTaskForHandoff] = useState(null);

  // ⭐ USE REAL TASKS HOOK
  const { 
    tasks, 
    loading: tasksLoading, 
    creating: creatingTask,
    createTask,
    completeTask: completeTaskAPI,
    deleteTask
  } = useProjectTasks(id);

  // ⭐ BEHAVIORAL SCIENCE STATE
  const [currentEnergy, setCurrentEnergy] = useState('medium');
  const [microWin, setMicroWin] = useState(null);

  // ⭐ CURSOR SYSTEM HOOKS
  const { joinProject, leaveProject } = useCursorContext();
  const { flashShip, flashTyping, flashClicking } = useCursorFlash();
  const { projectStats } = usePresence({
    autoDetectIdle: true,
    autoSendHeartbeat: true,
    idleTimeout: 5 * 60 * 1000,
  });
  const teamActivity = useTeamPresence();

  // ⭐ WEEK 8 DAY 5-6: MOCK PROJECT MEMBERS (Replace with real data from project)
  const projectMembers = [
    { id: 'user2', name: 'Sarah', avatar: '👩', online: true },
    { id: 'user3', name: 'Mike', avatar: '👨', online: true },
    { id: 'user4', name: 'Alex', avatar: '🧑', online: false }
  ];

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

  // ⭐ ENHANCED SHIP HANDLER
  const handleShip = async () => {
    if (!shipDescription.trim()) {
      toast({ title: "Add a description", variant: "error" });
      return;
    }

    try {
      await shipProject(id, { description: shipDescription });
      
      flashShip();
      
      await ecosystemApi.trackActivity('ship', id, {
        shipDescription: shipDescription,
        xp: 50
      });
      
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
    } catch (e) {
      toast({ title: "Ship failed", variant: "error" });
    }
  };

  // ⭐ HANDLE ADD TASK (WITH REAL API)
  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      await createTask({
        title: newTaskTitle.trim(),
      });
      
      flashTyping();
      toast({ title: "Task added", variant: "success" });
      setNewTaskTitle("");
      setShowAddTaskSheet(false);
    } catch (error) {
      toast({ title: "Failed to add task", variant: "error" });
    }
  };

  // ⭐ HANDLE TASK COMPLETION (WITH REAL API)
  const handleCompleteTask = async (task) => {
    if (task.completed) return;
    
    try {
      flashClicking();
      await completeTaskAPI(task._id);
      
      await ecosystemApi.trackActivity('task_complete', id, {
        taskTitle: task.title,
        xp: 25
      });
      
      setMicroWin({ type: 'task_started', message: '✅ Task complete!', xp: 25 });
      setTimeout(() => setMicroWin(null), 3000);
      
      toast({ title: "Task completed! 🎉", variant: "success" });
    } catch (error) {
      toast({ title: "Failed to complete task", variant: "error" });
    }
  };

  // ⭐ WEEK 8 DAY 3-4: SPRINT COMPLETE HANDLER
  const handleSprintComplete = (retroData) => {
    console.log('Sprint completed:', retroData);
    toast({ 
      title: '🎉 Sprint complete!', 
      description: `Great work team! ${retroData.ships.length} ships logged.`,
      variant: 'success' 
    });
  };

  // ⭐ WEEK 8 DAY 5-6: HAND-OFF HANDLERS
  const handleRequestHandoff = async (handoffData) => {
    try {
      console.log('Hand-off requested:', handoffData);
      setShowHandoffRequest(false);
      setSelectedTaskForHandoff(null);
    } catch (error) {
      console.error('Failed to request hand-off:', error);
      throw error;
    }
  };

  const handleAcceptHandoff = async (request) => {
    try {
      console.log('Hand-off accepted:', request);
    } catch (error) {
      console.error('Failed to accept hand-off:', error);
      throw error;
    }
  };

  const handleDeclineHandoff = async (request) => {
    try {
      console.log('Hand-off declined:', request);
    } catch (error) {
      console.error('Failed to decline hand-off:', error);
      throw error;
    }
  };

  if (loading || tasksLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #020617, #0f172a, #020617)' }} className="flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) return null;

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
      <div className={`max-w-[1600px] mx-auto ${isMobile ? 'px-0' : 'px-4'} py-6`}>
        
        {/* ⭐ MICRO-WIN TOAST */}
        {microWin && <MicroWinToast {...microWin} />}

        {/* ⭐ PROJECT BANNER */}
        {projectBanner && !isMobile && (
          <div className="relative h-48 rounded-2xl overflow-hidden mb-6">
            <img 
              src={projectBanner} 
              alt="Project banner" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
          </div>
        )}

        {/* ⭐ PROJECT HEADER WITH MEMBERS & SETTINGS */}
        <div className={`bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 ${isMobile ? 'rounded-none border-x-0' : 'rounded-2xl'} p-6 shadow-2xl ${isMobile ? 'mobile-card' : ''}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              {/* ⭐ PROJECT PICTURE */}
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg flex-shrink-0">
                {projectPicture}
              </div>
              
              {/* Project Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent`}>
                    {projectName}
                  </h1>
                  <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-sm">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="font-semibold">7d streak</span>
                  </div>
                </div>
                <p className="text-slate-400 mt-1 text-sm">
                  {teamActivity.isActive ? '🔥 ' : '😴 '} 
                  {teamActivity.message}
                </p>
              </div>
            </div>

            {/* ⭐ HEADER ACTIONS: MEMBERS + SETTINGS */}
            {!isMobile && (
              <div className="flex items-center gap-3">
                {/* Compact Members Display */}
                <MembersPanel 
                  projectId={id}
                  projectName={projectName}
                  currentUserId={user?.id}
                  compact
                />
                
                {/* Settings Button */}
                <button
                  onClick={() => navigate(`/projects/${id}/settings`)}
                  className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
                  title="Project settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Stats Row */}
          <div className={`${isMobile ? 'grid grid-cols-3 gap-3' : 'flex items-center justify-between'}`}>
            {!isMobile && (
              <div className="flex items-center gap-3">
                {/* Sprint Button */}
                <TeamSprintManager 
                  projectId={id}
                  onSprintComplete={handleSprintComplete}
                />
              </div>
            )}

            <div className={`${isMobile ? 'col-span-3 grid grid-cols-3 gap-3' : 'flex items-center gap-8'}`}>
              <div className="text-center">
                <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-emerald-400`}>{completedToday}/5</div>
                <div className="text-xs text-slate-400">Ships today</div>
              </div>
              <div className="text-center">
                <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-purple-400`}>{progressPct}%</div>
                <div className="text-xs text-slate-400">Complete</div>
              </div>
              <div className="text-center">
                <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-fuchsia-400`}>{projectStats.online}</div>
                <div className="text-xs text-slate-400">Online</div>
              </div>
            </div>
          </div>

          {/* Mobile Sprint Button */}
          {isMobile && (
            <div className="mt-4">
              <TeamSprintManager 
                projectId={id}
                onSprintComplete={handleSprintComplete}
              />
            </div>
          )}

          {/* Progress Bar */}
          <div className="mt-4 h-3 bg-slate-700/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* ⭐ WEEK 6: PROJECT HEALTH MONITORING */}
        <div className={`mt-6 ${isMobile ? 'mobile-stack px-4' : 'grid grid-cols-1 lg:grid-cols-2'} gap-6`}>
          <ProjectHeartbeatCard projectId={id} isMobile={isMobile} />
          <TeamBalanceMonitor projectId={id} userId={user?.id} isMobile={isMobile} />
        </div>

        {/* ⭐ ANNOUNCEMENTS SECTION */}
        <div className={`mt-6 ${isMobile ? 'px-4' : ''}`}>
          <Announcements projectId={id} currentUserId={user?.id} />
        </div>

        {/* MAIN GRID - TASKS & ENERGY */}
        <div className={`mt-6 ${isMobile ? 'mobile-stack px-4' : 'grid grid-cols-1 lg:grid-cols-12'} gap-6`}>
          
          {/* TASKS SECTION */}
          <div className={isMobile ? '' : 'lg:col-span-6'}>
            <div className={`bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 ${isMobile ? 'rounded-2xl' : 'rounded-2xl'} p-4 shadow-xl`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Tasks</h3>
                <button
                  onClick={() => isMobile ? setShowAddTaskSheet(true) : null}
                  className="p-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl hover:shadow-lg transition-all tap-target"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {!isMobile && (
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="text"
                    placeholder="Add a task... (press Enter)"
                    disabled={creatingTask}
                    className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-slate-500 disabled:opacity-50"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        createTask({ title: e.target.value.trim() });
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              )}

              <div className="space-y-3 mobile-scroll" style={{ maxHeight: isMobile ? '400px' : 'none', overflowY: isMobile ? 'auto' : 'visible' }}>
                {tasks.length === 0 ? (
                  <div className="bg-slate-800/30 border border-dashed border-slate-700 rounded-2xl p-12 text-center">
                    <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No tasks yet. Add one above to get started.</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div 
                      key={task._id}
                      className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 hover:border-purple-500/30 transition-all cursor-pointer group tap-target"
                    >
                      <div className="flex items-start gap-3">
                        <button 
                          onClick={() => handleCompleteTask(task)}
                          className={`mt-0.5 w-6 h-6 rounded border-2 flex items-center justify-center transition-all tap-target
                            ${task.completed 
                              ? 'bg-emerald-500 border-emerald-500' 
                              : 'border-slate-600 group-hover:border-purple-500 active:scale-90'
                            }`}
                        >
                          {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </button>
                        
                        <div className="flex-1">
                          <p className={`font-medium ${task.completed ? 'line-through text-slate-500' : ''}`}>
                            {task.title}
                          </p>
                          {task.dueDate && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                              <Clock className="w-3 h-3" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        {/* ⭐ WEEK 8 DAY 5-6: SHIP & HANDOFF BUTTONS */}
                        {!task.completed && (
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowShipModal(true);
                                setShipDescription(task.title);
                              }}
                              className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-lg text-xs font-semibold transition-all hover:bg-purple-600/30 tap-target"
                            >
                              Ship
                            </button>
                            
                            <HandoffButton
                              compact
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTaskForHandoff(task);
                                setShowHandoffRequest(true);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ENERGY TRACKER */}
          <div className={isMobile ? '' : 'lg:col-span-3'}>
            <EnergyTracker
              currentEnergy={currentEnergy}
              onEnergyChange={setCurrentEnergy}
              tasks={tasks}
            />
          </div>

          {/* COLLABORATION PANEL - Hide on mobile */}
          {!isMobile && (
            <div className="lg:col-span-3">
              <CollaborationPanel
                projectId={id}
                projectName={project.title}
                defaultTab="chat"
              />
            </div>
          )}
        </div>

        {/* ⭐ TEAM MEMBERS SECTION (Full View) */}
        <div className={`mt-6 ${isMobile ? 'px-4' : ''}`}>
          <MembersPanel 
            projectId={id}
            projectName={projectName}
            currentUserId={user?.id}
          />
        </div>

        {/* ⭐ SUGGESTIONS SECTION (Public Projects Only) */}
        {isPublicProject && (
          <div className={`mt-6 ${isMobile ? 'px-4' : ''}`}>
            <SuggestionsPanel 
              projectId={id}
              isProjectMember={isProjectMember}
              isPublicProject={isPublicProject}
            />
          </div>
        )}
      </div>

      {/* ⭐ QUICK ACTIONS */}
      <QuickActionsManager projectId={id} />
      
      {/* ⭐ KEYBOARD SHORTCUTS HELPER */}
      <KeyboardShortcuts />

      {/* ⭐ WEEK 8 DAY 5-6: HAND-OFF NOTIFICATIONS */}
      <HandoffManager
        userId={user?.id}
        onAcceptHandoff={handleAcceptHandoff}
        onDeclineHandoff={handleDeclineHandoff}
      />

      {/* ⭐ WEEK 8 DAY 5-6: HAND-OFF REQUEST MODAL */}
      {showHandoffRequest && selectedTaskForHandoff && (
        <HandoffRequest
          task={selectedTaskForHandoff}
          projectMembers={projectMembers}
          onRequest={handleRequestHandoff}
          onClose={() => {
            setShowHandoffRequest(false);
            setSelectedTaskForHandoff(null);
          }}
        />
      )}

      {/* SHIP MODAL - Desktop */}
      {showShipModal && !isMobile && (
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

            <button
              onClick={handleShip}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-all"
            >
              Ship (+50 XP) 🚢
            </button>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM SHEETS */}
      {isMobile && (
        <>
          <BottomSheet
            isOpen={showShipModal}
            onClose={() => setShowShipModal(false)}
            title="Ship This"
          >
            <div className="p-6 space-y-4">
              <input
                type="text"
                value={shipDescription}
                onChange={(e) => setShipDescription(e.target.value)}
                placeholder="What did you just ship?"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
              <button
                onClick={handleShip}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl font-bold text-lg active:scale-95 transition-all"
              >
                Ship (+50 XP) ��
              </button>
            </div>
          </BottomSheet>

          <BottomSheet
            isOpen={showAddTaskSheet}
            onClose={() => setShowAddTaskSheet(false)}
            title="Add Task"
          >
            <div className="p-6 space-y-4">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
              <button
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim() || creatingTask}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl font-bold text-lg active:scale-95 transition-all disabled:opacity-50"
              >
                {creatingTask ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </BottomSheet>

          <MobileAnnouncementCreate
            projectId={id}
            isOpen={showAnnouncementSheet}
            onClose={() => setShowAnnouncementSheet(false)}
            onCreated={() => {
              window.location.reload();
            }}
          />
        </>
      )}

      {/* CSS */}
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
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
