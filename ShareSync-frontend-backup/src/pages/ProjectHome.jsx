// src/pages/ProjectHome.jsx - MOBILE OPTIMIZED
import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProject, shipProject } from "../api/projects";
import useProjectTasks from "../hooks/useProjectTasks";
import { 
  Rocket, Plus, Calendar, Clock, Zap, Trophy, Flame, CheckCircle2, Target,
  ChevronLeft, ChevronRight, X, Upload, Mic, Eye, Users, TrendingUp,
  Battery, BatteryLow, BatteryMedium, Play, Pause, AlertCircle,
  Star, Sparkles, Award, MessageCircle, Timer, Coffee, Music
} from "lucide-react";
import { toast } from "../components/ui/toast";

// ⭐ MOBILE IMPORTS
import { useIsMobile } from "../hooks/useMobile";
import BottomSheet from "../components/mobile/BottomSheet";
import MobileAnnouncementCreate from "../components/mobile/MobileAnnouncementCreate";

// ⭐ CURSOR SYSTEM IMPORTS
import { useCursorContext } from "../context/CursorContext";
import useCursor, { useCursorFlash } from "../hooks/useCursor";
import usePresence, { useTeamPresence } from "../hooks/usePresence";

// ⭐ COMPONENT IMPORTS
import CollaborationPanel from "../components/project/CollaborationPanel";
import Announcements from "../components/project/Announcements";

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

// =====================================
// MAIN PROJECT HOME COMPONENT
// =====================================

export default function ProjectHome() {
  const { id } = useParams();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShipModal, setShowShipModal] = useState(false);
  const [showAddTaskSheet, setShowAddTaskSheet] = useState(false);
  const [showAnnouncementSheet, setShowAnnouncementSheet] = useState(false);
  const [shipDescription, setShipDescription] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
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
      
      setMicroWin({ type: 'task_started', message: '✅ Task complete!', xp: 25 });
      setTimeout(() => setMicroWin(null), 3000);
      
      toast({ title: "Task completed! 🎉", variant: "success" });
    } catch (error) {
      toast({ title: "Failed to complete task", variant: "error" });
    }
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

        {/* HEADER */}
        <div className={`bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 ${isMobile ? 'rounded-none border-x-0' : 'rounded-2xl'} p-6 shadow-2xl ${isMobile ? 'mobile-card' : ''}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent`}>
                  {project.title}
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

            {!isMobile && (
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
            )}
          </div>

          {/* Mobile stats row */}
          {isMobile && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="text-center">
                <div className="text-xl font-bold text-emerald-400">{completedToday}/5</div>
                <div className="text-xs text-slate-400">Ships</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-400">{progressPct}%</div>
                <div className="text-xs text-slate-400">Complete</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-fuchsia-400">{projectStats.online}</div>
                <div className="text-xs text-slate-400">Online</div>
              </div>
            </div>
          )}

          <div className="mt-4 h-3 bg-slate-700/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* ⭐ ANNOUNCEMENTS SECTION */}
        <div className={`mt-6 ${isMobile ? 'px-4' : ''}`}>
          <Announcements projectId={id} currentUserId={user?.id} />
        </div>

        {/* MAIN GRID - RESPONSIVE */}
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

                        {!task.completed && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowShipModal(true);
                              setShipDescription(task.title);
                            }}
                            className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-lg text-xs font-semibold transition-all hover:bg-purple-600/30 tap-target"
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
          </div>

          {/* ENERGY TRACKER */}
          <div className={isMobile ? '' : 'lg:col-span-3'}>
            <EnergyTracker
              currentEnergy={currentEnergy}
              onEnergyChange={setCurrentEnergy}
              tasks={tasks}
            />
          </div>

          {/* COLLABORATION PANEL - Hide on mobile by default */}
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
      </div>

      {/* FLOATING SHIP BUTTON - Mobile optimized */}
      <button
        onClick={() => setShowShipModal(true)}
        className={`fixed ${isMobile ? 'bottom-6 right-6' : 'bottom-8 right-8'} ${isMobile ? 'w-14 h-14' : 'w-16 h-16'} bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-transform flex items-center justify-center group z-50 tap-target`}
        aria-label="Ship this"
      >
        <Rocket className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-white group-hover:rotate-12 transition-transform`} />
      </button>

      {/* SHIP MODAL - Desktop & Mobile */}
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
          {/* Ship Bottom Sheet */}
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

          {/* Add Task Bottom Sheet */}
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

          {/* Mobile Announcement Create */}
          <MobileAnnouncementCreate
            projectId={id}
            isOpen={showAnnouncementSheet}
            onClose={() => setShowAnnouncementSheet(false)}
            onCreated={() => {
              // Refresh announcements
              window.location.reload();
            }}
          />
        </>
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
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
