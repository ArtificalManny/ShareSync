// src/pages/ProjectHome.jsx - METAlab ADAPTATION
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

// ⭐ MOBILE & UTILITY IMPORTS
import { useIsMobile } from "../hooks/useMobile";
import BottomSheet from "../components/mobile/BottomSheet";
import MobileAnnouncementCreate from "../components/mobile/MobileAnnouncementCreate";
import QuickActionsManager from '../components/quick-actions/QuickActionsManager';
import KeyboardShortcuts from '../components/quick-actions/KeyboardShortcuts';

// ⭐ FEATURE IMPORTS (LEAVING BACKEND ATTACHED)
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
   METAlab STYLE: ELEVATED COMPONENTS
───────────────────────────────────────────────────────────────────────── */

// 1. REFINED ENERGY TRACKER (Bento Style)
const EnergyTracker = ({ currentEnergy, onEnergyChange, tasks = [] }) => {
  const isMobile = useIsMobile();
  const getMatchedTasks = (energy) => {
    if (energy === 'high') return tasks.filter(t => t.effort === 'high' || !t.effort);
    if (energy === 'medium') return tasks.filter(t => t.effort === 'medium' || !t.effort);
    return tasks.filter(t => t.effort === 'low' || t.estimatedTime < 15);
  };
  const matchedTasks = getMatchedTasks(currentEnergy);

  return (
    <div className="bg-[#16181D] rounded-[2rem] p-8 shadow-sm border border-white/[0.03]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Energy Sync</h3>
          <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest font-bold">Biometric Planning</p>
        </div>
        <Zap className="w-5 h-5 text-violet-500" />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {['low', 'medium', 'high'].map((level) => (
          <button
            key={level}
            onClick={() => onEnergyChange(level)}
            className={`py-4 rounded-2xl flex flex-col items-center gap-2 transition-all duration-300 ${
              currentEnergy === level 
              ? 'bg-white text-black shadow-xl shadow-white/5 scale-[1.02]' 
              : 'bg-white/[0.02] text-slate-500 hover:bg-white/[0.05]'
            }`}
          >
            {level === 'low' && <BatteryLow size={20} />}
            {level === 'medium' && <BatteryMedium size={20} />}
            {level === 'high' && <Battery size={20} />}
            <span className="text-[10px] font-black uppercase tracking-tighter">{level}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {matchedTasks.slice(0, 2).map((task, i) => (
          <div key={i} className="flex items-center gap-3 p-4 bg-white/[0.02] rounded-2xl border border-white/[0.02] group hover:border-violet-500/30 transition-colors">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
            <span className="flex-1 text-sm font-medium text-slate-300 truncate">{task.title}</span>
            <ArrowUpRight size={14} className="text-slate-600 group-hover:text-white transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
};

// 2. PROJECT HEARTBEAT (The Data Visualization)
const ProjectHeartbeatCard = ({ projectId }) => {
  return (
    <div className="bg-[#16181D] rounded-[2rem] p-8 border border-white/[0.03]">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-white tracking-tight">Heartbeat</h3>
        <Activity className="w-5 h-5 text-rose-500 animate-pulse" />
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ships / Wk</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tighter">12</span>
            <span className="text-xs font-bold text-emerald-500">+4</span>
          </div>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Velocity</p>
          <span className="text-3xl font-bold text-white tracking-tighter">94%</span>
        </div>
      </div>

      <div className="mt-8 h-[2px] bg-white/[0.03] relative overflow-hidden rounded-full">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 w-[70%] rounded-full" />
      </div>
    </div>
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
  
  // States & Refs (Kept exactly as requested)
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

  if (loading) return (
    <div className="min-h-screen bg-[#0B0C0E] flex items-center justify-center">
      <div className="w-12 h-[2px] bg-white/10 overflow-hidden relative">
        <div className="absolute inset-0 bg-violet-500 animate-loading-bar" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-white selection:bg-violet-500/30">
      <div className="max-w-[1400px] mx-auto px-8 py-12">
        
        {/* ⭐ THE HERO HEADER */}
        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-violet-500/10 text-violet-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-violet-500/20">
                Live Project
              </span>
              <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                <Users size={12} />
                {projectStats.online} Active Now
              </div>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold tracking-tighter leading-[0.9]">
              {project?.title || "ShareSync"}
            </h1>
            
            <p className="text-slate-400 text-lg max-w-xl font-medium leading-relaxed">
              Design and engineering cycles for the 2026 OpenShare core ecosystem. 
              Currently tackling {tasks.filter(t => !t.completed).length} open objectives.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
               onClick={() => setShowShipModal(true)}
               className="h-14 px-8 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-transform active:scale-95 flex items-center gap-3"
            >
              <Rocket size={18} />
              Ship Update
            </button>
            <button className="h-14 w-14 bg-[#16181D] border border-white/5 rounded-2xl flex items-center justify-center hover:bg-white/5 transition-colors">
              <Settings size={20} className="text-slate-400" />
            </button>
          </div>
        </header>

        {/* ⭐ BENTO GRID: INSIGHTS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <ProjectHeartbeatCard />
          <EnergyTracker currentEnergy={currentEnergy} onEnergyChange={setCurrentEnergy} tasks={tasks} />
          
          {/* TEAM PRESENCE CARD */}
          <div className="bg-[#16181D] rounded-[2rem] p-8 border border-white/[0.03] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-white tracking-tight">Team Balance</h3>
              <PieChart className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex -space-x-3 mb-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-12 h-12 rounded-full border-4 border-[#16181D] bg-slate-800 overflow-hidden">
                  <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" />
                </div>
              ))}
              <div className="w-12 h-12 rounded-full border-4 border-[#16181D] bg-violet-600 flex items-center justify-center text-[10px] font-black">
                +12
              </div>
            </div>
            <MembersPanel projectId={id} compact />
          </div>
        </div>

        {/* ⭐ TASK EXECUTION ZONE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Tasks */}
          <div className="lg:col-span-8 space-y-12">
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold tracking-tight">Active Tasks</h2>
                <div className="h-[1px] flex-1 bg-white/5 mx-6" />
                <button className="text-slate-500 hover:text-white transition-colors">
                  <Plus size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {tasks.filter(t => !t.completed).map(task => (
                  <div key={task._id} className="group bg-[#16181D]/50 hover:bg-[#16181D] p-6 rounded-3xl border border-white/[0.02] transition-all flex items-center gap-6">
                    <button 
                      onClick={() => completeTaskAPI(task._id)}
                      className="w-8 h-8 rounded-full border-2 border-slate-700 group-hover:border-violet-500 flex items-center justify-center transition-colors"
                    >
                      <CheckCircle2 size={16} className="text-transparent group-hover:text-slate-700" />
                    </button>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-slate-200">{task.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Assigned to You • 2h ago</p>
                    </div>
                    <HandoffButton task={task} />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Meta Info */}
          <div className="lg:col-span-4 space-y-12">
             <section className="bg-gradient-to-br from-violet-600/10 to-transparent p-8 rounded-[2rem] border border-violet-500/10">
                <div className="flex items-center gap-3 mb-6">
                  <Zap className="text-violet-500 fill-violet-500" size={20} />
                  <h3 className="font-black uppercase tracking-widest text-xs">Current Sprint</h3>
                </div>
                <TeamSprintManager projectId={id} />
             </section>

             <section>
                <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-500 mb-6 px-2">Project Activity</h3>
                <Announcements projectId={id} />
             </section>
          </div>
        </div>

      </div>

      {/* ⭐ SHIP MODAL (Refined) */}
      {showShipModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60 animate-in fade-in duration-300">
          <div className="bg-[#16181D] w-full max-w-xl rounded-[2.5rem] border border-white/10 p-10 shadow-2xl overflow-hidden relative">
            <div className="flex justify-between items-start mb-8">
              <h2 className="text-3xl font-bold tracking-tighter">Prepare Ship</h2>
              <button onClick={() => setShowShipModal(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                <X />
              </button>
            </div>
            <textarea
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-6 text-white text-lg focus:outline-none focus:border-violet-500/40 transition-all resize-none h-48 mb-8"
              placeholder="What did you build?"
              value={shipDescription}
              onChange={(e) => setShipDescription(e.target.value)}
            />
            <button 
              onClick={handleShip}
              className="w-full py-6 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] hover:scale-[1.01] active:scale-[0.98] transition-all"
            >
              Broadcast Ship
            </button>
          </div>
        </div>
      )}

      {/* Invisible Logic Mounts */}
      <QuickActionsManager />
      <KeyboardShortcuts />
    </div>
  );
}
