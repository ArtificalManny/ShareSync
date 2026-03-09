// src/components/focus/YourMovesToday.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE H: Your 3 Moves Today - Cross-Project Focus View
// ⭐ UPGRADE: Item 11 - Wired to LIVE Data (GET /api/tasks/priorities)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Target, 
  Zap, 
  RefreshCw, 
  ChevronRight,
  Flame,
  AlertCircle,
} from 'lucide-react';
import MoveCard, { MoveCardSkeleton } from './MoveCard';
import { getPriorityTasks, patchTask } from '../../api/tasks';

export default function YourMovesToday({
  variant = 'default',
  maxMoves = 3,
  showHeader = true,
  showFooter = true,
  showRefresh = true,
  onMoveClick,
  onViewAll,
  className = '',
}) {
  const navigate = useNavigate();
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLiveMoves = useCallback(async () => {
    try {
      setError(null);
      const data = await getPriorityTasks(maxMoves);
      setMoves(data || []);
    } catch (err) {
      console.error("Failed to fetch top moves:", err);
      setError(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [maxMoves]);

  useEffect(() => {
    fetchLiveMoves();
  }, [fetchLiveMoves]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchLiveMoves();
  }, [fetchLiveMoves]);

  const handleComplete = useCallback(async (moveId) => {
    const move = moves.find(m => m.id === moveId || m._id === moveId);
    if (!move) return;
    const projectId = move.projectId || move.project?.id || move.project?._id;
    
    // Optimistic UI update
    setMoves(prev => prev.filter(m => (m.id || m._id) !== moveId));
    
    try {
      await patchTask(projectId, moveId, { status: 'done', completedAt: new Date().toISOString() });
    } catch (err) {
      console.error("Failed to complete task:", err);
      fetchLiveMoves(); // Revert on failure
    }
  }, [moves, fetchLiveMoves]);

  const handleMoveClick = useCallback((move) => {
    if (onMoveClick) {
      onMoveClick(move);
    } else {
      const projectId = move.projectId || move.project?.id || move.project?._id;
      if (projectId) navigate(`/projects/${projectId}`);
    }
  }, [onMoveClick, navigate]);

  const isCompact = variant === 'compact' || variant === 'sidebar';
  const hasUrgentMoves = moves.some(m => m.priority === 'critical' || m.priority === 'urgent');

  return (
    <div className={`
      card-action
      ${isCompact ? 'p-4' : 'p-6'} rounded-xl
      bg-white dark:bg-[#1f1f23] border border-slate-200 dark:border-white/10 shadow-sm
      ${hasUrgentMoves ? 'border-l-4 border-l-amber-500' : ''}
      ${className}
    `}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${hasUrgentMoves ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-violet-50 dark:bg-violet-500/10'}`}>
              {hasUrgentMoves ? (
                <AlertCircle className="w-4 h-4 text-amber-500" />
              ) : (
                <Target className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                Your 3 Moves Today
              </h3>
              {hasUrgentMoves && (
                <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400">Action needed</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isRefreshing && (
              <span className="text-[10px] font-medium text-slate-400">Updating...</span>
            )}
            
            {showRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || loading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                title="Refresh moves"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}

            {onViewAll && (
              <button
                onClick={onViewAll}
                className="text-xs font-medium text-slate-500 hover:text-violet-600 transition-colors flex items-center gap-1"
              >
                View all
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <MoveCardSkeleton count={maxMoves} />
      ) : error ? (
        <div className="py-8 text-center bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600 dark:text-zinc-400 mb-2">Failed to load live moves</p>
          <button onClick={handleRefresh} className="text-xs font-medium text-violet-600 hover:text-violet-700">
            Try again
          </button>
        </div>
      ) : moves.length > 0 ? (
        <div className="space-y-3">
          {moves.map((move, index) => (
            <MoveCard
              key={move.id || move._id}
              move={move}
              rank={index + 1}
              onClick={() => handleMoveClick(move)}
              onComplete={handleComplete}
              showProject={true}
              showActions={!isCompact}
              variant={isCompact ? 'compact' : 'default'}
            />
          ))}
        </div>
      ) : (
        <EmptyState onRefresh={handleRefresh} />
      )}

      {/* Footer - Impact Summary */}
      {showFooter && moves.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              Complete all {moves.length} to unlock maximum momentum
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400">
                <Zap className="w-3.5 h-3.5 fill-current" />
                +{moves.reduce((s, m) => s + (m.momentum || m.xp || 25), 0)} XP
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ onRefresh }) {
  return (
    <div className="py-8 text-center bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
      <div className="w-12 h-12 rounded-full bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 mx-auto mb-3 flex items-center justify-center shadow-sm">
        <Target className="w-5 h-5 text-slate-300 dark:text-zinc-500" />
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-4">
        No moves yet — add a task to start building momentum.
      </p>
      <button
        onClick={onRefresh}
        className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 transition-colors"
      >
        Refresh Feed
      </button>
    </div>
  );
}

export function YourMovesWidget({ onMoveClick, onViewAll }) {
  return (
    <YourMovesToday
      variant="sidebar"
      maxMoves={3}
      showHeader={true}
      showFooter={false}
      showRefresh={false}
      onMoveClick={onMoveClick}
      onViewAll={onViewAll}
    />
  );
}

export function FocusBanner({ className = '' }) {
  const [topMove, setTopMove] = useState(null);

  useEffect(() => {
    getPriorityTasks(1).then(data => {
      if (data && data.length > 0) setTopMove(data[0]);
    }).catch(console.error);
  }, []);
  
  if (!topMove) return null;
  const hasUrgentMoves = topMove.priority === 'critical' || topMove.priority === 'urgent';
  
  return (
    <div className={`
      px-4 py-3 rounded-xl shadow-sm
      ${hasUrgentMoves ? 'bg-amber-50 border border-amber-200' : 'bg-violet-50 border border-violet-200'}
      flex items-center justify-between
      ${className}
    `}>
      <div className="flex items-center gap-3">
        <Target className={`w-5 h-5 ${hasUrgentMoves ? 'text-amber-500' : 'text-violet-600'}`} />
        <div>
          <p className={`text-xs font-medium ${hasUrgentMoves ? 'text-amber-600' : 'text-violet-500'}`}>Top priority</p>
          <p className="text-sm font-bold text-slate-800">{topMove.title}</p>
        </div>
      </div>
    </div>
  );
}
