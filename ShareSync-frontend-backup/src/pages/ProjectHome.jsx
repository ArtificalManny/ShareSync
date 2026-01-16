// src/pages/ProjectHome.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - "Quiet Confidence"
// ═══════════════════════════════════════════════════════════════════════════════
// RULES APPLIED:
// 1. Surface hierarchy: surface-0/1/2 tokens
// 2. Text hierarchy: text-primary/secondary/tertiary
// 3. Calmer typography - no font-black everywhere
// 4. No pulsing/glowing at rest
// 5. Cards use consistent surface tokens, no glowColor
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProject, shipProject } from "../api/projects";
import useProjectTasks from "../hooks/useProjectTasks";
import { 
  Rocket, Plus, Settings, CheckCircle2, X, Users, 
  Activity, PieChart, Zap, Battery, BatteryLow, BatteryMedium,
  ArrowUpRight, Sparkles
} from "lucide-react";
import { toast } from "../components/ui/toast";

// Mobile & Utility
import { useIsMobile } from "../hooks/useMobile";
import QuickActionsManager from '../components/quick-actions/QuickActionsManager';
import KeyboardShortcuts from '../components/quick-actions/KeyboardShortcuts';

// Feature Components
import TeamSprintManager from '../components/sprints/TeamSprintManager';
import HandoffButton from '../components/handoff/HandoffButton';
import { MembersPanel } from '../components/members';
import Announcements from "../components/project/Announcements";

// Presence
import { useCursorContext } from "../context/CursorContext";
import { useCursorFlash } from "../hooks/useCursor";
import usePresence, { useTeamPresence } from "../hooks/usePresence";

/* ─────────────────────────────────────────────────────────────────────────
   ENERGY TRACKER
───────────────────────────────────────────────────────────────────────── */
const EnergyTracker = ({ currentEnergy, onEnergyChange, tasks = [] }) => {
  const getMatchedTasks = (energy) => {
    if (energy === 'high') return tasks.filter(t => t.effort === 'high' || !t.effort);
    if (energy === 'medium') return tasks.filter(t => t.effort === 'medium' || !t.effort);
    return tasks.filter(t => t.effort === 'low' || t.estimatedTime < 15);
  };
  const matchedTasks = getMatchedTasks(currentEnergy);

  const energyLevels = [
    { key: 'low', icon: BatteryLow, label: 'Low' },
    { key: 'medium', icon: BatteryMedium, label: 'Medium' },
    { key: 'high', icon: Battery, label: 'High' },
  ];

  return (
    <div className="p-6 rounded-xl bg-surface-1 border border-white/[0.06]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Energy Sync</h3>
          <p className="text-xs text-text-tertiary mt-0.5">Biometric Planning</p>
        </div>
        <div className="p-2.5 rounded-lg bg-brand/10">
          <Zap className="w-4 h-4 text-brand" />
        </div>
      </div>

      {/* Energy Selector */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {energyLevels.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => onEnergyChange(key)}
            className={`
              py-4 rounded-lg flex flex-col items-center gap-2
              transition-all duration-200 border
              ${currentEnergy === key 
                ? 'bg-text-primary text-surface-0 border-text-primary' 
                : 'bg-surface-2 text-text-tertiary border-transparent hover:bg-surface-3'
              }
            `}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
          </button>
        ))}
      </div>

      {/* Matched Tasks */}
      <div className="space-y-2">
        {matchedTasks.slice(0, 2).map((task, i) => (
          <div 
            key={i} 
            className="
              flex items-center gap-3 p-3 rounded-lg
              bg-surface-2 border border-white/[0.04]
              hover:border-brand/30 transition-colors cursor-pointer group
            "
          >
            <div className="w-1.5 h-1.5 rounded-full bg-brand" />
            <span className="flex-1 text-sm text-text-secondary truncate">{task.title}</span>
            <ArrowUpRight className="w-4 h-4 text-text-tertiary group-hover:text-text-primary transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   HEARTBEAT CARD
───────────────────────────────────────────────────────────────────────── */
const HeartbeatCard = () => (
  <div className="p-6 rounded-xl bg-surface-1 border border-white/[0.06]">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-text-primary">Heartbeat</h3>
      <div className="p-2.5 rounded-lg bg-danger/10">
        <Activity className="w-4 h-4 text-danger" />
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-6">
      <div>
        <p className="text-xs text-text-tertiary mb-1">Ships / Week</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-text-primary">12</span>
          <span className="text-xs font-medium text-success">+4</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs text-text-tertiary mb-1">Velocity</p>
        <span className="text-3xl font-semibold text-text-primary">94%</span>
      </div>
    </div>

    {/* Progress Bar */}
    <div className="mt-6 h-1.5 bg-surface-3 rounded-full overflow-hidden">
      <div className="h-full w-[70%] bg-gradient-to-r from-brand via-brand-400 to-danger rounded-full" />
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────
   TEAM CARD
───────────────────────────────────────────────────────────────────────── */
const TeamCard = ({ projectId }) => (
  <div className="p-6 rounded-xl bg-surface-1 border border-white/[0.06] flex flex-col">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-text-primary">Team Balance</h3>
      <div className="p-2.5 rounded-lg bg-success/10">
        <PieChart className="w-4 h-4 text-success" />
      </div>
    </div>
    
    {/* Avatar Stack */}
    <div className="flex -space-x-3 mb-6">
      {[1, 2, 3, 4].map(i => (
        <div 
          key={i} 
          className="w-10 h-10 rounded-full border-2 border-surface-1 bg-surface-2 overflow-hidden"
        >
          <img 
            src={`https://i.pravatar.cc/150?u=${i}`} 
            alt="user" 
            className="w-full h-full object-cover" 
          />
        </div>
      ))}
      <div className="w-10 h-10 rounded-full border-2 border-surface-1 bg-brand flex items-center justify-center text-xs font-medium text-white">
        +12
      </div>
    </div>
    
    <MembersPanel projectId={projectId} compact />
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────
   TASK ITEM
───────────────────────────────────────────────────────────────────────── */
const TaskItem = ({ task, onComplete }) => (
  <div className="
    group p-5 rounded-xl
    bg-surface-1 border border-white/[0.06]
    hover:bg-surface-2 hover:border-white/[0.1]
    transition-all duration-200
    flex items-center gap-4
  ">
    <button 
      onClick={() => onComplete(task._id)}
      className="
        w-8 h-8 rounded-lg border border-surface-3
        flex items-center justify-center
        hover:border-brand hover:bg-brand/10
        transition-colors
      "
    >
      <CheckCircle2 className="w-4 h-4 text-transparent group-hover:text-brand/50" />
    </button>
    
    <div className="flex-1 min-w-0">
      <h4 className="font-medium text-text-primary group-hover:text-brand transition-colors">
        {task.title}
      </h4>
      <p className="text-xs text-text-tertiary mt-0.5">
        {task.priority || 'Standard'} Priority
      </p>
    </div>
    
    <HandoffButton task={task} />
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────────── */
export default function ProjectHome() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // State
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShipModal, setShowShipModal] = useState(false);
  const [shipDescription, setShipDescription] = useState("");
  const [currentEnergy, setCurrentEnergy] = useState('medium');

  const { tasks, loading: tasksLoading, createTask, completeTask: completeTaskAPI } = useProjectTasks(id);
  const { joinProject, leaveProject } = useCursorContext();
  const { flashShip } = useCursorFlash();
  const { projectStats } = usePresence({ autoDetectIdle: true });

  useEffect(() => {
    if (id) joinProject(id);
    return () => leaveProject();
  }, [id, joinProject, leaveProject]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getProject(id);
        setProject(data);
      } catch (e) { 
        toast({ title: "Load Failed", variant: "error" }); 
      } finally { 
        setLoading(false); 
      }
    })();
  }, [id]);

  const handleShip = async () => {
    try {
      await shipProject(id, { description: shipDescription });
      flashShip();
      setShowShipModal(false);
      setShipDescription("");
      toast({ title: "Project Shipped!", variant: "success" });
    } catch (e) { 
      toast({ title: "Ship Failed", variant: "error" }); 
    }
  };

  const openTasks = tasks.filter(t => !t.completed);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="w-12 h-1 bg-surface-2 rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-brand rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-0 text-text-primary">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-10">
        
        {/* ═══════════════════════════════════════════════════════════════════
            HEADER
        ═══════════════════════════════════════════════════════════════════ */}
        <header className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            {/* Status */}
            <div className="flex items-center gap-4 mb-4">
              <span className="px-3 py-1 text-xs font-medium bg-brand/10 text-brand rounded-full">
                Live Project
              </span>
              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                {projectStats.online} Active Now
              </div>
            </div>
            
            {/* Title */}
            <h1 className="text-4xl lg:text-5xl font-semibold mb-3">
              {project?.title || "Project"}
            </h1>
            
            {/* Description */}
            <p className="text-text-secondary text-lg max-w-2xl">
              Design and engineering cycles for the 2026 OpenShare core ecosystem. 
              Currently tackling <span className="text-text-primary font-medium">{openTasks.length} open objectives</span>.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowShipModal(true)}
              className="
                h-12 px-6 rounded-xl
                bg-brand text-white
                font-medium text-sm
                hover:bg-brand-600 hover:shadow-glow-brand
                transition-all duration-200
                flex items-center gap-2
              "
            >
              <Rocket className="w-4 h-4" />
              Ship Update
            </button>
            <button className="
              h-12 w-12 rounded-xl
              bg-surface-1 border border-white/[0.06]
              flex items-center justify-center
              hover:bg-surface-2 hover:border-white/[0.1]
              transition-colors
            ">
              <Settings className="w-5 h-5 text-text-tertiary" />
            </button>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════════════
            BENTO GRID
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <HeartbeatCard />
          <EnergyTracker 
            currentEnergy={currentEnergy} 
            onEnergyChange={setCurrentEnergy} 
            tasks={tasks} 
          />
          <TeamCard projectId={id} />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            MAIN CONTENT
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Tasks Column */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Active Objectives</h2>
              <button className="
                p-2.5 rounded-lg
                bg-surface-1 border border-white/[0.06]
                text-text-tertiary hover:text-text-primary
                hover:bg-surface-2
                transition-colors
              ">
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {openTasks.map(task => (
                <TaskItem 
                  key={task._id} 
                  task={task} 
                  onComplete={completeTaskAPI} 
                />
              ))}
              
              {openTasks.length === 0 && (
                <div className="p-10 text-center rounded-xl bg-surface-1 border border-white/[0.06]">
                  <p className="text-text-tertiary">No active tasks</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Sprint Card */}
            <div className="p-6 rounded-xl bg-surface-1 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-4 h-4 text-brand" />
                <h3 className="text-sm font-medium text-text-secondary">Current Sprint</h3>
              </div>
              <TeamSprintManager projectId={id} />
            </div>

            {/* Activity */}
            <div>
              <h3 className="text-sm font-medium text-text-tertiary mb-4 px-1">
                Project Activity
              </h3>
              <Announcements projectId={id} />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SHIP MODAL
      ═══════════════════════════════════════════════════════════════════ */}
      {showShipModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="
            w-full max-w-xl p-8 rounded-2xl
            bg-surface-1 border border-white/[0.08]
            shadow-2xl
            animate-in fade-in zoom-in-95 duration-200
          ">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-semibold">Ship Update</h2>
              <button 
                onClick={() => setShowShipModal(false)} 
                className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
              >
                <X className="w-5 h-5 text-text-tertiary" />
              </button>
            </div>
            
            <textarea
              className="
                w-full p-4 rounded-xl
                bg-surface-2 border border-white/[0.06]
                text-text-primary text-base
                placeholder:text-text-tertiary
                focus:outline-none focus:border-brand/50
                resize-none h-40 mb-6
                transition-colors
              "
              placeholder="What did you build today?"
              value={shipDescription}
              onChange={(e) => setShipDescription(e.target.value)}
            />
            
            <button 
              onClick={handleShip}
              className="
                w-full py-4 rounded-xl
                bg-brand text-white font-medium
                hover:bg-brand-600
                transition-colors
              "
            >
              Broadcast Ship
            </button>
          </div>
        </div>
      )}

      {/* Invisible Logic */}
      <QuickActionsManager />
      <KeyboardShortcuts />
    </div>
  );
}
