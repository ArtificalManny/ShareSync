// src/components/projects/SmartStartPreview.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 3.1: Editable preview of AI-generated tasks, timeline, milestones
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  CheckCircle2, X, ChevronUp, ChevronDown, Edit3, Clock, Flag,
  Target, Calendar, Sparkles
} from 'lucide-react';

const PRIORITY_CONFIG = {
  high:   { color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    label: 'High' },
  medium: { color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  label: 'Med' },
  low:    { color: 'text-slate-400',  bg: 'bg-slate-500/10',  border: 'border-slate-500/20',  label: 'Low' },
};

const CATEGORY_EMOJI = {
  planning: '📋', design: '🎨', code: '⚡', testing: '🧪',
  devops: '🚀', docs: '📝', research: '🔍', setup: '🔧'
};

function TaskCard({ task, index, onEdit, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description || '');
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const emoji = CATEGORY_EMOJI[task.category] || '⚡';

  const saveEdit = () => {
    onEdit(index, { title: editTitle.trim(), description: editDesc.trim() });
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setEditing(false);
  };

  return (
    <div className="group p-4 rounded-xl border border-purple-500/20 bg-slate-800/30 hover:bg-slate-800/50 transition-all">
      <div className="flex items-start gap-3">
        {/* Number badge */}
        <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px] font-bold text-purple-300 mt-0.5 shrink-0">
          {index + 1}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-slate-700/50 border border-purple-500/30 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={2}
                className="w-full bg-slate-700/50 border border-purple-500/30 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
              <div className="flex gap-2">
                <button onClick={saveEdit} className="text-xs text-emerald-400 hover:text-emerald-300">Save</button>
                <button onClick={cancelEdit} className="text-xs text-slate-400 hover:text-slate-300">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-base">{emoji}</span>
                <span className="text-sm font-medium text-white">{task.title}</span>
              </div>
              {task.description && (
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>
              )}
            </>
          )}
        </div>

        {/* Meta badges */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${priority.bg} ${priority.color} ${priority.border} border`}>
            {priority.label}
          </span>
          {task.estimatedHours && (
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <Clock className="w-3 h-3" />
              {task.estimatedHours}h
            </span>
          )}
        </div>

        {/* Actions (visible on hover) */}
        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {!isFirst && (
            <button onClick={() => onMoveUp(index)} className="p-0.5 hover:bg-slate-700 rounded" title="Move up">
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
          {!isLast && (
            <button onClick={() => onMoveDown(index)} className="p-0.5 hover:bg-slate-700 rounded" title="Move down">
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
          <button onClick={() => setEditing(true)} className="p-0.5 hover:bg-slate-700 rounded" title="Edit">
            <Edit3 className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button onClick={() => onRemove(index)} className="p-0.5 hover:bg-red-500/20 rounded" title="Remove">
            <X className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SmartStartPreview({
  results,
  onEditTask,
  onRemoveTask,
  onMoveTask,
  onAccept,
  onRegenerate,
  loading
}) {
  if (!results || !results.tasks) return null;

  const totalHours = results.tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">
          <Sparkles className="w-3.5 h-3.5" />
          {results.tasks.length} tasks generated
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-700/50 text-slate-300">
          <Clock className="w-3.5 h-3.5" />
          ~{totalHours}h total
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-700/50 text-slate-300">
          <Calendar className="w-3.5 h-3.5" />
          {results.timeline}
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-700/50 text-slate-300">
          <Target className="w-3.5 h-3.5" />
          {results.suggestedView} view
        </span>
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {results.tasks.map((task, i) => (
          <TaskCard
            key={`${task.title}-${i}`}
            task={task}
            index={i}
            onEdit={onEditTask}
            onRemove={onRemoveTask}
            onMoveUp={(idx) => onMoveTask(idx, idx - 1)}
            onMoveDown={(idx) => onMoveTask(idx, idx + 1)}
            isFirst={i === 0}
            isLast={i === results.tasks.length - 1}
          />
        ))}
      </div>

      {/* Milestones */}
      {results.milestones && results.milestones.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-3">
            <Flag className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold text-white uppercase tracking-wider">Milestones</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {results.milestones.map((m, i) => (
              <div key={i} className="px-3 py-2 rounded-lg border border-purple-500/20 bg-slate-800/30">
                <div className="text-xs font-medium text-white">{m.title}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Week {m.weekNumber}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-purple-500/10">
        <button
          type="button"
          onClick={onRegenerate}
          disabled={loading}
          className="text-xs text-slate-400 hover:text-purple-300 transition-colors disabled:opacity-50"
        >
          ↻ Regenerate
        </button>

        <button
          type="button"
          onClick={onAccept}
          disabled={loading || results.tasks.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
        >
          <CheckCircle2 className="w-4 h-4" />
          Use These Tasks ({results.tasks.length})
        </button>
      </div>
    </div>
  );
}
