// src/pages/ProjectHome.jsx - THE ULTIMATE PROJECT HOME
import React, { useEffect, useState, useContext, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getProject, shipProject } from "../api/projects";
import { createTask, patchTask } from "../api/tasks";
import { 
  Rocket, Plus, Calendar, Clock, Zap, Trophy, Users, 
  TrendingUp, Target, Flame, CheckCircle2, AlertCircle,
  ChevronLeft, ChevronRight, X, Upload, Mic, Image as ImageIcon
} from "lucide-react";
import { toast } from "../components/ui/toast";

export default function ProjectHome() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext) || {};
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShipModal, setShowShipModal] = useState(false);
  const [shipDescription, setShipDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(true);

  // Load project
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

  // Handle ship
  const handleShip = async () => {
    if (!shipDescription.trim()) {
      toast({ title: "Add a description", variant: "error" });
      return;
    }

    try {
      await shipProject(id, { description: shipDescription });
      
      // Show celebration
      toast({
        title: "🎉 Shipped!",
        description: `${shipDescription} - +50 XP`,
        variant: "success"
      });
      
      setShowShipModal(false);
      setShipDescription(`Update: ${project?.title || ""}`);
      
      // Reload project
      const updated = await getProject(id);
      setProject(updated);
    } catch (e) {
      toast({ title: "Ship failed", variant: "error" });
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(selectedDate);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Mock deadline data (replace with real API)
  const deadlines = [
    { date: 15, title: "Beta launch", urgent: true },
    { date: 22, title: "Design review", urgent: false },
    { date: 28, title: "Team sync", urgent: false }
  ];

  const getDeadlinesForDay = (day) => {
    return deadlines.filter(d => d.date === day);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white pb-32">
      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* COMPACT HEADER - NO DEAD SPACE */}
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
              <p className="text-slate-400 mt-1">Team momentum: Strong</p>
            </div>

            {/* LIVE STATS - ALWAYS VISIBLE */}
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
                <div className="text-2xl font-bold text-fuchsia-400">{project.members?.length || 1}</div>
                <div className="text-xs text-slate-400">Online</div>
              </div>
            </div>
          </div>

          {/* PROGRESS BAR - INSTANT VISUAL FEEDBACK */}
          <div className="mt-4 h-3 bg-slate-700/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* GRID LAYOUT - CALENDAR + TASKS SIDE BY SIDE */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: COMPACT CALENDAR (1/3 width) */}
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

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="font-semibold text-slate-500 py-2">{day}</div>
              ))}
              
              {/* Empty cells for offset */}
              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              
              {/* Days */}
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
                      <div className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isUrgent ? 'bg-red-500' : 'bg-fuchsia-400'}`} />
                    )}
                    
                    {/* Tooltip on hover */}
                    {hasDeadline && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-slate-900 border border-purple-500/30 rounded-lg px-2 py-1 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
                        {dayDeadlines[0].title}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Upcoming Deadlines List */}
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

          {/* RIGHT: TASK LIST (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Quick Add Task */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Add a task... (press Enter)"
                  className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-slate-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      toast({ title: "Task added", variant: "success" });
                      e.target.value = '';
                    }
                  }}
                />
                <button className="p-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl hover:shadow-lg transition-all">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tasks */}
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
                    className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 hover:border-purple-500/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <button 
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
                      </div>

                      {!task.completed && (
                        <button className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-lg text-xs font-semibold transition-all hover:bg-purple-600/30">
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

        {/* AI COACH - CONTEXTUAL TIPS */}
        <div className="mt-6 bg-gradient-to-r from-purple-900/30 to-fuchsia-900/30 border border-purple-500/30 rounded-2xl p-5 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">AI Coach says:</h3>
              <p className="text-slate-300">
                You're in your productive window (2-4pm). Stack two 25-min sprints now to hit your 5-ship goal today. 
                Your team is online — great time to ship that design review.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING SHIP BUTTON - ALWAYS VISIBLE */}
      <button
        onClick={() => setShowShipModal(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center group"
        style={{
          animation: completedToday < 5 ? 'pulse 2s infinite' : 'none'
        }}
      >
        <Rocket className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
      </button>

      {/* SHIP MODAL - 8 SECOND MAX */}
      {showShipModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                Ship This
              </h2>
              <button
                onClick={() => setShowShipModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              value={shipDescription}
              onChange={(e) => setShipDescription(e.target.value)}
              placeholder="What did you just ship?"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleShip();
              }}
            />

            <div className="flex items-center gap-2 mb-6">
              <button className="flex-1 p-3 bg-slate-800 border border-slate-700 rounded-xl hover:border-purple-500/50 transition-colors flex items-center justify-center gap-2 text-sm">
                <Upload className="w-4 h-4" />
                Attach file
              </button>
              <button className="flex-1 p-3 bg-slate-800 border border-slate-700 rounded-xl hover:border-purple-500/50 transition-colors flex items-center justify-center gap-2 text-sm">
                <Mic className="w-4 h-4" />
                Voice note
              </button>
            </div>

            <button
              onClick={handleShip}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-all"
            >
              Ship (+50 XP)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}