// src/components/ProjectDetail.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE D: Empty States That Inspire - Project Detail Page
// ═══════════════════════════════════════════════════════════════════════════════
//
// Project detail view showing:
// - Project header with stats
// - Task list (kanban or list view)
// - Activity feed
// - Team members
//
// ⭐ PHASE D: EmptyTasks when project has no tasks
// ⭐ PHASE D: AllTasksComplete celebration when all done
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Flame,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Users,
  TrendingUp,
  LayoutGrid,
  List,
  Filter,
  Zap,
} from 'lucide-react';

// ⭐ PHASE D: Import empty state components
import EmptyTasks, { 
  EmptyTasksCompact, 
  AllTasksComplete 
} from './empty-states/EmptyTasks';

// Import momentum context
import { useMomentumContext, useMomentumActivity } from '../contexts/MomentumContext';

/* ─────────────────────────────────────────────────────────────────────────
   MOCK DATA - Replace with real API
───────────────────────────────────────────────────────────────────────── */
const MOCK_PROJECT = {
  id: '1',
  name: 'ShareSync v2',
  description: 'Momentum-based project tracker with gamification',
  emoji: '🚀',
  streak: 7,
  velocity: 92,
  totalTasks: 24,
  completedTasks: 19,
  members: [
    { id: '1', name: 'Sarah Chen', role: 'Lead' },
    { id: '2', name: 'Alex Rivera', role: 'Developer' },
    { id: '3', name: 'Jordan Park', role: 'Designer' },
  ],
};

const MOCK_TASKS = [
  { id: '1', title: 'Fix login page CSS bug', status: 'in-progress', priority: 'high', assignee: 'Sarah Chen', dueDate: '2024-01-20' },
  { id: '2', title: 'Write API documentation', status: 'todo', priority: 'medium', assignee: 'Alex Rivera', dueDate: '2024-01-22' },
  { id: '3', title: 'Design empty states', status: 'done', priority: 'high', assignee: 'Jordan Park', dueDate: '2024-01-18' },
  { id: '4', title: 'Implement momentum engine', status: 'done', priority: 'high', assignee: 'Sarah Chen', dueDate: '2024-01-15' },
  { id: '5', title: 'Add confetti animations', status: 'in-progress', priority: 'low', assignee: 'Jordan Park', dueDate: '2024-01-21' },
];

/* ─────────────────────────────────────────────────────────────────────────
   TASK CARD COMPONENT
───────────────────────────────────────────────────────────────────────── */
const TaskCard = ({ task, onComplete, onSelect }) => {
  const priorityColors = {
    high: 'border-l-energy-500',
    medium: 'border-l-warning-500',
    low: 'border-l-cyan-500',
  };
  
  const statusIcons = {
    'todo': Circle,
    'in-progress': Clock,
    'done': CheckCircle2,
  };
  
  const StatusIcon = statusIcons[task.status] || Circle;
  const isDone = task.status === 'done';
  
  return (
    <div
      onClick={() => onSelect(task)}
      className={`
        group p-4 rounded-xl cursor-pointer
        bg-surface-1 border border-white/[0.06] border-l-2
        ${priorityColors[task.priority] || 'border-l-brand-500'}
        hover:bg-surface-2 hover:border-white/[0.1]
        transition-all duration-200
        ${isDone ? 'opacity-60' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete(task.id);
          }}
          className={`
            mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2
            flex items-center justify-center
            transition-all duration-200
            ${isDone 
              ? 'bg-success border-success text-white' 
              : 'border-text-tertiary hover:border-brand-500 hover:bg-brand-500/10'
            }
          `}
        >
          {isDone && <CheckCircle2 className="w-3 h-3" />}
        </button>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium ${isDone ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>
            {task.title}
          </h4>
          
          <div className="flex items-center gap-3 mt-2 text-xs text-text-tertiary">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <span>{task.assignee}</span>
          </div>
        </div>
        
        {/* Status */}
        <StatusIcon className={`w-4 h-4 ${isDone ? 'text-success' : 'text-text-tertiary'}`} />
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   PROJECT STATS
───────────────────────────────────────────────────────────────────────── */
const ProjectStats = ({ project }) => {
  const progress = project.totalTasks > 0 
    ? Math.round((project.completedTasks / project.totalTasks) * 100) 
    : 0;
    
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
        <div className="text-2xl font-bold text-text-primary">{progress}%</div>
        <div className="text-xs text-text-tertiary">Progress</div>
      </div>
      <div className="p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
        <div className="text-2xl font-bold text-brand-400">{project.velocity}%</div>
        <div className="text-xs text-text-tertiary">Velocity</div>
      </div>
      <div className="p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
        <div className="text-2xl font-bold text-warning-500 flex items-center gap-1">
          <Flame className="w-5 h-5" />
          {project.streak}
        </div>
        <div className="text-xs text-text-tertiary">Day Streak</div>
      </div>
      <div className="p-4 rounded-xl bg-surface-1 border border-white/[0.06]">
        <div className="text-2xl font-bold text-text-primary">
          {project.completedTasks}/{project.totalTasks}
        </div>
        <div className="text-xs text-text-tertiary">Tasks Done</div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   MAIN PROJECT DETAIL
───────────────────────────────────────────────────────────────────────── */
export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  // State
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'
  const [filter, setFilter] = useState('all'); // 'all' | 'todo' | 'in-progress' | 'done'
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Momentum context
  let momentumContext = { glowLevel: 2, isFireMode: false, recordActivity: () => {} };
  try {
    momentumContext = useMomentumContext();
  } catch (e) {
    // Context not available
  }
  
  const { glowLevel, isFireMode, recordActivity } = momentumContext;

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      setLoading(true);
      // TODO: Replace with real API call
      setTimeout(() => {
        setProject(MOCK_PROJECT);
        setTasks(MOCK_TASKS);
        setLoading(false);
      }, 1000);
    };
    loadProject();
  }, [projectId]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks;
    return tasks.filter(t => t.status === filter);
  }, [tasks, filter]);

  // Task counts
  const taskCounts = useMemo(() => ({
    all: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    'in-progress': tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  }), [tasks]);

  // Check if all tasks complete
  const allTasksComplete = tasks.length > 0 && tasks.every(t => t.status === 'done');

  // Handle task completion
  const handleCompleteTask = (taskId) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, status: t.status === 'done' ? 'todo' : 'done' }
        : t
    ));
    
    // Record activity for momentum
    recordActivity('TASK_COMPLETE', { taskId, projectId });
  };

  // Handle add task
  const handleAddTask = (taskTitle) => {
    const newTask = {
      id: String(Date.now()),
      title: taskTitle,
      status: 'todo',
      priority: 'medium',
      assignee: 'You',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };
    setTasks(prev => [newTask, ...prev]);
  };

  // Handle add more tasks (from AllTasksComplete)
  const handleAddMoreTasks = () => {
    // Focus task input or open modal
    setSelectedTask(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 lg:p-10 max-w-[1200px] mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-surface-2 rounded w-1/4" />
          <div className="h-4 bg-surface-2 rounded w-1/2" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-surface-2 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen p-6 lg:p-10 flex items-center justify-center">
        <p className="text-text-secondary">Project not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-[1200px] mx-auto">
      
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <header className="mb-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-text-tertiary hover:text-text-secondary mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Projects</span>
        </button>
        
        {/* Project title */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-surface-1 border border-white/[0.06] flex items-center justify-center text-3xl">
              {project.emoji}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-text-primary">{project.name}</h1>
              <p className="text-sm text-text-secondary">{project.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-surface-2 text-text-tertiary transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-8">
        <ProjectStats project={{ ...project, totalTasks: tasks.length, completedTasks: taskCounts.done }} />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          TASKS SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section>
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${isFireMode ? 'text-energy-500' : 'text-brand-400'}`} />
            <h2 className="text-sm font-medium text-text-secondary">Tasks</h2>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Filters */}
            <div className="flex gap-1">
              {['all', 'todo', 'in-progress', 'done'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium capitalize
                    transition-all duration-200
                    ${filter === f 
                      ? 'bg-surface-2 text-text-primary' 
                      : 'text-text-tertiary hover:text-text-secondary'
                    }
                  `}
                >
                  {f === 'in-progress' ? 'In Progress' : f}
                  {taskCounts[f] > 0 && (
                    <span className="ml-1 text-[10px] opacity-60">({taskCounts[f]})</span>
                  )}
                </button>
              ))}
            </div>
            
            {/* View toggle */}
            <div className="flex items-center gap-1 p-1 bg-surface-1 rounded-lg border border-white/[0.06]">
              <button 
                onClick={() => setViewMode('list')} 
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-surface-2 text-text-primary' : 'text-text-tertiary'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('kanban')} 
                className={`p-1.5 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-surface-2 text-text-primary' : 'text-text-tertiary'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            
            {/* Add task button */}
            <button
              onClick={() => handleAddTask('New task')}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg
                bg-brand-500 text-white text-sm font-medium
                hover:bg-brand-600 transition-colors
                ${glowLevel >= 4 ? 'shadow-glow-brand' : ''}
              `}
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
        </div>
        
        {/* Tasks content */}
        <div className="p-6 rounded-xl bg-surface-1 border border-white/[0.06]">
          {tasks.length === 0 ? (
            /* ⭐ PHASE D: Empty Tasks State */
            <EmptyTasks
              projectName={project.name}
              onAddTask={handleAddTask}
              onSelectSuggestion={handleAddTask}
              showSuggestions={true}
              showQuickAdd={true}
              variant="illustrated"
            />
          ) : allTasksComplete ? (
            /* ⭐ PHASE D: All Tasks Complete Celebration */
            <AllTasksComplete
              projectName={project.name}
              onAddMore={handleAddMoreTasks}
            />
          ) : filteredTasks.length === 0 ? (
            /* No tasks for current filter */
            <div className="text-center py-8">
              <p className="text-sm text-text-secondary">
                No {filter === 'in-progress' ? 'in progress' : filter} tasks
              </p>
              <button
                onClick={() => setFilter('all')}
                className="mt-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
              >
                View all tasks
              </button>
            </div>
          ) : (
            /* Task list */
            <div className="space-y-3">
              {filteredTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={handleCompleteTask}
                  onSelect={setSelectedTask}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          TEAM MEMBERS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-text-tertiary" />
          <h2 className="text-sm font-medium text-text-secondary">Team</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {project.members.map((member, i) => (
            <div
              key={member.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-1 border border-white/[0.06]"
            >
              <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center">
                <span className="text-sm font-medium text-brand-400">
                  {member.name.charAt(0)}
                </span>
              </div>
              <div>
                <div className="text-sm text-text-primary">{member.name}</div>
                <div className="text-[10px] text-text-tertiary">{member.role}</div>
              </div>
            </div>
          ))}
          
          <button className="w-10 h-10 rounded-full border border-dashed border-white/[0.1] flex items-center justify-center text-text-tertiary hover:border-brand-500/30 hover:text-brand-400 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </section>
      
      {/* Inline styles */}
      <style>{`
        .shadow-glow-brand {
          box-shadow: 0 0 20px rgb(139 92 246 / 0.3);
        }
      `}</style>
    </div>
  );
}
