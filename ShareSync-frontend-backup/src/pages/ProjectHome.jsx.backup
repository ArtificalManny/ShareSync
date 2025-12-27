// src/pages/ProjectHome.jsx - WITH REAL TASKS & SHIPS
import React, { useEffect, useState, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getProject, shipProject, completeTask } from "../api/projects";
import useProjectTasks from "../hooks/useProjectTasks";
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

// ⭐ COLLABORATION PANEL
import CollaborationPanel from "../components/project/CollaborationPanel";

// =====================================
// BEHAVIORAL SCIENCE COMPONENTS
// (Keep all the existing components: MicroWinToast, EnergyTracker, StreakGuard, AIAccountabilityPartner, TaskGuardModal)
// =====================================

// ... [Keep all your existing behavioral science components unchanged] ...

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
  const [morningGoal, setMorningGoal] = useState('');
  const [eveningReview, setEveningReview] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [taskStartTime, setTaskStartTime] = useState(null);
  const [showTaskGuard, setShowTaskGuard] = useState(false);
  const [microWin, setMicroWin] = useState(null);
  const [hoursSinceLastShip, setHoursSinceLastShip] = useState(0);
  const [workSessionDuration, setWorkSessionDuration] = useState(0);

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

  // ⭐ WORK SESSION TIMER
  useEffect(() => {
    if (activeTask) {
      const interval = setInterval(() => {
        setWorkSessionDuration(prev => {
          const newDuration = prev + 1;
          
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
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [activeTask]);

  // ⭐ ENHANCED SHIP HANDLER (WITH REAL API)
  const handleShip = async () => {
    if (!shipDescription.trim()) {
      toast({ title: "Add a description", variant: "error" });
      return;
    }

    try {
      const result = await shipProject(id, { 
        description: shipDescription 
      });
      
      flashShip();
      
      // Show celebration with XP and streak
      setMicroWin({ 
        type: 'task_started', 
        message: `🎉 Shipped! +${result.xpAwarded} XP`, 
        xp: result.xpAwarded 
      });
      setTimeout(() => setMicroWin(null), 4000);
      
      toast({
        title: "🎉 Shipped!",
        description: `${shipDescription} - +${result.xpAwarded} XP | ${result.streak} day streak 🔥`,
        variant: "success"
      });
      
      setShowShipModal(false);
      setShipDescription(`Update: ${project?.title || ""}`);
      
      // Reload project to get updated ships
      const updated = await getProject(id);
      setProject(updated);
      
      setHoursSinceLastShip(0);
    } catch (e) {
      toast({ title: "Ship failed", variant: "error" });
    }
  };

  // ⭐ HANDLE TASK COMPLETION (WITH REAL API)
  const handleCompleteTask = async (task) => {
    try {
      flashClicking();
      
      const result = await completeTaskAPI(task._id);
      
      setMicroWin({ 
        type: 'task_started', 
        message: `✅ Task complete! +${result.xpAwarded} XP`, 
        xp: result.xpAwarded 
      });
      setTimeout(() => setMicroWin(null), 3000);
      
      toast({ 
        title: "Task completed! 🎉", 
        description: `+${result.xpAwarded} XP earned`,
        variant: "success" 
      });
    } catch (error) {
      toast({ title: "Failed to complete task", variant: "error" });
    }
  };

  // ⭐ HANDLE ADD TASK (WITH REAL API)
  const handleAddTask = async (title) => {
    if (!title.trim()) return;

    try {
      await createTask({
        title: title.trim(),
        createdBy: user?.id
      });
      
      flashTyping();
      toast({ title: "Task added", variant: "success" });
    } catch (error) {
      toast({ title: "Failed to add task", variant: "error" });
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
  const handleTaskSwitch = (task) => {
    if (activeTask && taskStartTime) {
      const duration = Math.floor((Date.now() - taskStartTime) / (1000 * 60));
      if (duration > 2 && duration < 10) {
        setShowTaskGuard(true);
        return;
      }
    }
    handleStartTask(task);
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

  const deadlines = project?.deadlines || [];

  const getDeadlinesForDay = (day) => deadlines.filter(d => 
    new Date(d.date).getDate() === day
  );

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
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        
        {/* Keep all behavioral science components */}
        {microWin && <MicroWinToast {...microWin} />}
        
        {/* ... rest of your JSX remains the same ... */}

        {/* TASKS SECTION - NOW WITH REAL DATA */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Add a task... (press Enter)"
                className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-slate-500"
                disabled={creatingTask}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    handleAddTask(e.target.value);
                    e.target.value = '';
                  }
                }}
              />
              <button 
                onClick={flashClicking}
                disabled={creatingTask}
                className="p-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
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
              tasks.map((task) => (
                <div 
                  key={task._id}
                  onClick={() => !task.completed && handleTaskSwitch(task)}
                  className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 hover:border-purple-500/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!task.completed) {
                          handleCompleteTask(task);
                        }
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
                        {task.title}
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

        {/* Rest of your layout remains the same */}
        
      </div>
    </div>
  );
}

// Keep all your behavioral science components at the end
// (MicroWinToast, EnergyTracker, StreakGuard, AIAccountabilityPartner, TaskGuardModal)

