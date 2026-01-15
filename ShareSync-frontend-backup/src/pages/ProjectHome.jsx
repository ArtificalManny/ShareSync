// src/pages/ProjectHome.jsx - MISSION CONTROL (METAlab ADAPTATION)
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
  Activity, TrendingDown, BarChart3, PieChart, UserCheck, Settings,
  ArrowUpRight, Share2, MoreHorizontal
} from "lucide-react";
import { toast } from "../components/ui/toast";

// ⭐ METAlab UI BRIDGE
import { useRenovation } from "../context/RenovationContext";
import Card from "../components/ui/Card";

// ⭐ MOBILE & UTILITY IMPORTS
import { useIsMobile } from "../hooks/useMobile";
import BottomSheet from "../components/mobile/BottomSheet";
import MobileAnnouncementCreate from "../components/mobile/MobileAnnouncementCreate";
import QuickActionsManager from '../components/quick-actions/QuickActionsManager';
import KeyboardShortcuts from '../components/quick-actions/KeyboardShortcuts';

// ⭐ FEATURE IMPORTS (BACKEND INTACT)
import TeamSprintManager from '../components/sprints/TeamSprintManager';
import HandoffRequest from '../components/handoff/HandoffRequest';
import HandoffManager from '../components/handoff/HandoffManager';
import HandoffButton from '../components/handoff/HandoffButton';
import { MembersPanel } from '../components/members';
import { SuggestionsPanel } from '../components/suggestions';

// ⭐ PRESENCE & ECOSYSTEM
import { useCursorContext } from "../context/CursorContext";
import useCursor, { useCursorFlash } from "../hooks/useCursor";
import usePresence, { useTeamPresence } from "../hooks/usePresence";
import CollaborationPanel from "../components/project/CollaborationPanel";
import Announcements from "../components/project/Announcements";
import ecosystemApi from "../services/ecosystemApi";

/* ─────────────────────────────────────────────────────────────────────────
   REFINED COMPONENTS (METAlab EDITION)
───────────────────────────────────────────────────────────────────────── */

const EnergyTracker = ({ currentEnergy, onEnergyChange, tasks = [] }) => {
  const { styles } = useRenovation();
  const getMatchedTasks = (energy) => {
    if (energy === 'high') return tasks.filter(t => t.effort === 'high' || !t.effort);
    if (energy === 'medium') return tasks.filter(t => t.effort === 'medium' || !t.effort);
    return tasks.filter(t => t.effort === 'low' || t.estimatedTime < 15);
  };
  const matchedTasks = getMatchedTasks(currentEnergy);

  return (
    <Card className="p-10" glowColor="rgba(139, 92, 246, 0.15)">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h3 className="text-2xl font-black text-white tracking-tighter">Energy Sync</h3>
          <p className={styles.label || "text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1"}>Biometric Planning</p>
        </div>
        <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20">
          <Zap className="w-5 h-5 text-violet-500" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10">
        {['low', 'medium', 'high'].map((level) => (
          <button
            key={level}
            onClick={() => onEnergyChange(level)}
            className={`py-6 rounded-2xl flex flex-col items-center gap-3 transition-all duration-300 border ${
              currentEnergy === level 
              ? 'bg-white text-black border-white shadow-2xl shadow-white/10 scale-[1.05]' 
              : 'bg-white/[0.02] text-slate-500 border-white/[0.05] hover:bg-white/[0.05]'
            }`}
          >
            {level === 'low' && <BatteryLow size={20} />}
            {level === 'medium' && <BatteryMedium size={20} />}
            {level === 'high' && <Battery size={20} />}
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{level}</span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {matchedTasks.slice(0, 2).map((task, i) => (
          <div key={i} className="flex items-center gap-4 p-5 bg-white/[0.02] rounded-2xl border border-white/[0.03] group hover:border-violet-500/30 transition-all cursor-pointer">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
            <span className="flex-1 text-sm font-bold text-slate-300 truncate tracking-tight">{task.title}</span>
            <ArrowUpRight size={16} className="text-slate-600 group-hover:text-white transition-colors" />
          </div>
        ))}
      </div>
    </Card>
  );
};

const ProjectHeartbeatCard = () => {
  const { styles } = useRenovation();
  return (
    <Card className="p-10" glowColor="rgba(244, 63, 94, 0.1)">
      <div className="flex items-center justify-between mb-10">
        <h3 className="text-2xl font-black text-white tracking-tighter">Heartbeat</h3>
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
          <Activity className="w-5 h-5 text-rose-500 animate-pulse" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-2">
          <p className={styles.label || "text-[10px] font-bold text-slate-500 uppercase tracking-widest"}>Ships / Week</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-white tracking-tighter italic">12</span>
            <span className="text-xs font-black text-emerald-500">+4</span>
          </div>
        </div>
        <div className="space-y-2 text-right">
          <p className={styles.label || "text-[10px] font-bold text-slate-500 uppercase tracking-widest"}>Velocity</p>
          <span className="text-5xl font-black text-white tracking-tighter italic">94%</span>
        </div>
      </div>

      <div className="mt-10 h-[3px] bg-white/5 relative overflow-hidden rounded-full">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500 w-[70%] rounded-full shadow-[0_0_12px_rgba(139,92,246,0.3)]" />
      </div>
    </Card>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   MAIN PAGE: PROJECT HOME
───────────────────────────────────────────────────────────────────────── */
export default function ProjectHome() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { styles } = useRenovation();
  
  // --- PRESERVED BACKEND STATES ---
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShipModal, setShowShipModal] = useState(false);
  const [shipDescription, setShipDescription] = useState("");
  const [currentEnergy, setCurrentEnergy] = useState('medium');

  const { tasks, loading: tasksLoading, createTask, completeTask: completeTaskAPI } = useProjectTasks(id);
  const { joinProject, leaveProject } = useCursorContext();
  const { flashShip } = useCursorFlash();
  const { projectStats } = usePresence({ autoDetectIdle: true });
  const teamActivity = useTeamPresence();

  useEffect(() => {
    if (id) joinProject(id);
    return () => leaveProject();
  }, [id, joinProject, leaveProject]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getProject(id);
        setProject(data);
      } catch (e) { toast({ title: "Load Failed", variant: "error" }); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const handleShip = async () => {
    try {
      await shipProject(id, { description: shipDescription });
      flashShip();
      setShowShipModal(false);
      setShipDescription("");
      toast({ title: "Project Shipped!", variant: "success" });
    } catch (e) { toast({ title: "Ship Failed", variant: "error" }); }
  };
  // --- END PRESERVED LOGIC ---

  if (loading) return (
    <div className="min-h-screen bg-[#0B0C0E] flex items-center justify-center">
      <div className="w-16 h-[1px] bg-white/5 overflow-hidden relative">
        <div className="absolute inset-0 bg-violet-500 animate-loading-bar" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-white selection:bg-violet-500/30">
      <div className="max-w-[1600px] mx-auto px-8 lg:px-20 py-20">
        
        {/* ⭐ THE HERO HEADER: Spatial Hierarchy */}
        <header className="mb-24 flex flex-col lg:flex-row lg:items-end justify-between gap-12">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <span className="px-4 py-1.5 bg-violet-500/10 text-violet-400 text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                Live Project
              </span>
              <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {projectStats.online} Active Now
              </div>
            </div>
            
            <h1 className="text-7xl md:text-8xl font-black tracking-tighter leading-[0.85]">
              {project?.title || "ShareSync"}
            </h1>
            
            <p className="text-slate-500 text-xl max-w-2xl font-medium leading-relaxed">
              Design and engineering cycles for the 2026 OpenShare core ecosystem. 
              Currently tackling <span className="text-white font-bold italic">{tasks.filter(t => !t.completed).length} open objectives</span>.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button 
               onClick={() => setShowShipModal(true)}
               className="h-16 px-10 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.05] transition-all duration-300 shadow-2xl shadow-white/10 flex items-center gap-3 active:scale-95"
            >
              <Rocket size={20} />
              Ship Update
            </button>
            <button className="h-16 w-16 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 hover:border-white/10 transition-all group">
              <Settings size={22} className="text-slate-500 group-hover:text-white transition-colors" />
            </button>
          </div>
        </header>

        {/* ⭐ BENTO GRID: Spacing Increased */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20">
          <ProjectHeartbeatCard />
          <EnergyTracker currentEnergy={currentEnergy} onEnergyChange={setCurrentEnergy} tasks={tasks} />
          
          <Card className="p-10 flex flex-col justify-between" glowColor="rgba(16, 185, 129, 0.1)">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-black text-white tracking-tighter">Team Balance</h3>
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <PieChart className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <div className="flex -space-x-4 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-14 h-14 rounded-2xl border-[6px] border-[#0F1115] bg-slate-800 overflow-hidden shadow-xl">
                  <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" className="w-full h-full object-cover grayscale-[0.3] hover:grayscale-0 transition-all" />
                </div>
              ))}
              <div className="w-14 h-14 rounded-2xl border-[6px] border-[#0F1115] bg-violet-600 flex items-center justify-center text-[10px] font-black text-white shadow-xl">
                +12
              </div>
            </div>
            <MembersPanel projectId={id} compact />
          </Card>
        </div>

        {/* ⭐ TASK EXECUTION ZONE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Left Column: Tasks */}
          <div className="lg:col-span-8 space-y-16">
            <section>
              <div className="flex items-center justify-between mb-12 px-2">
                <h2 className="text-3xl font-black tracking-tighter">Active Objectives</h2>
                <div className="h-[1px] flex-1 bg-white/5 mx-10" />
                <button className="p-3 bg-white/[0.03] border border-white/5 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                  <Plus size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {tasks.filter(t => !t.completed).map(task => (
                  <div key={task._id} className="group bg-white/[0.02] hover:bg-white/[0.04] p-8 rounded-[2rem] border border-white/[0.03] transition-all duration-300 flex items-center gap-8 hover:translate-x-2">
                    <button 
                      onClick={() => completeTaskAPI(task._id)}
                      className="w-10 h-10 rounded-2xl border-2 border-slate-800 group-hover:border-violet-500 flex items-center justify-center transition-all bg-[#0B0C0E]"
                    >
                      <CheckCircle2 size={18} className="text-transparent group-hover:text-violet-500/50" />
                    </button>
                    <div className="flex-1">
                      <h4 className="font-black text-xl text-white tracking-tight group-hover:text-violet-400 transition-colors">{task.title}</h4>
                      <p className={styles.label || "text-[9px] font-bold text-slate-600 mt-2 uppercase tracking-[0.2em]"}>
                        Assigned Node • {task.priority || 'Standard'} Priority
                      </p>
                    </div>
                    <HandoffButton task={task} />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Meta Info */}
          <div className="lg:col-span-4 space-y-16">
             <Card className="p-10" glowColor="rgba(139, 92, 246, 0.2)">
                <div className="flex items-center gap-3 mb-10">
                  <Sparkles className="text-violet-500" size={20} />
                  <h3 className={styles.label || "text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em]"}>Current Sprint</h3>
                </div>
                <TeamSprintManager projectId={id} />
             </Card>

             <section>
                <h3 className={styles.label || "text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] mb-10 px-4"}>Project Activity</h3>
                <Announcements projectId={id} />
             </section>
          </div>
        </div>

      </div>

      {/* ⭐ SHIP MODAL: Glassmorphism Applied */}
      {showShipModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/80 animate-in fade-in zoom-in-95 duration-500">
          <Card className="w-full max-w-2xl p-12 relative overflow-hidden" glowColor="rgba(139, 92, 246, 0.3)">
            <div className="flex justify-between items-start mb-10">
              <h2 className="text-4xl font-black tracking-tighter">Prepare Broadcast</h2>
              <button onClick={() => setShowShipModal(false)} className="p-3 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>
            <textarea
              className="w-full bg-white/[0.03] border border-white/[0.05] rounded-3xl p-8 text-white text-xl focus:outline-none focus:border-violet-500/30 transition-all resize-none h-60 mb-10 font-medium placeholder:text-slate-700 shadow-inner"
              placeholder="What did you build today?"
              value={shipDescription}
              onChange={(e) => setShipDescription(e.target.value)}
            />
            <button 
              onClick={handleShip}
              className="w-full py-8 bg-white text-black rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs hover:scale-[1.02] active:scale-[0.95] transition-all shadow-2xl shadow-white/5"
            >
              Broadcast Ship
            </button>
          </Card>
        </div>
      )}

      {/* Invisible Logic Mounts */}
      <QuickActionsManager />
      <KeyboardShortcuts />
    </div>
  );
}
