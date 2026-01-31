// src/components/behavioral/CommitmentCard.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Behavioral: "You promised: X" Commitment Display
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { 
  Target, Clock, CheckCircle2, AlertTriangle, Plus, X, Sparkles
} from 'lucide-react';
import { useCommitments } from '../../hooks/useCommitments';

function formatTimeRemaining(deadline) {
  const now = new Date();
  const end = new Date(deadline);
  const diffMs = end - now;

  if (diffMs < 0) return 'Overdue';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d left`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }
  return `${minutes}m left`;
}

function CommitmentItem({ commitment, onComplete, onBreak }) {
  const isAtRisk = commitment.deadline && 
    new Date(commitment.deadline) - new Date() < 24 * 60 * 60 * 1000 &&
    new Date(commitment.deadline) > new Date();

  const isOverdue = commitment.deadline && new Date(commitment.deadline) < new Date();

  return (
    <div className={`
      p-4 rounded-xl border transition-all
      ${isOverdue 
        ? 'bg-error-500/5 border-error-500/20' 
        : isAtRisk 
          ? 'bg-warning/5 border-warning/20' 
          : 'bg-surface-2/50 border-white/[0.06]'
      }
    `}>
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <div className={`
          p-2 rounded-lg shrink-0
          ${isOverdue 
            ? 'bg-error-500/10' 
            : isAtRisk 
              ? 'bg-warning/10' 
              : 'bg-brand/10'
          }
        `}>
          {isOverdue ? (
            <AlertTriangle className="w-4 h-4 text-error-500" />
          ) : isAtRisk ? (
            <Clock className="w-4 h-4 text-warning" />
          ) : (
            <Target className="w-4 h-4 text-brand" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-primary font-medium">
            You promised: <span className="text-text-secondary italic">"{commitment.text}"</span>
          </p>
          
          {commitment.deadline && (
            <p className={`
              text-xs mt-1
              ${isOverdue 
                ? 'text-error-500' 
                : isAtRisk 
                  ? 'text-warning' 
                  : 'text-text-tertiary'
              }
            `}>
              {formatTimeRemaining(commitment.deadline)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onComplete(commitment.id)}
            className="
              p-1.5 rounded-lg
              text-success hover:bg-success/10
              transition-colors
            "
            title="Mark as done"
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onBreak(commitment.id)}
            className="
              p-1.5 rounded-lg
              text-text-tertiary hover:text-error-500 hover:bg-error-500/10
              transition-colors
            "
            title="Can't complete"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CommitmentCard({ userId, className = '' }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newText, setNewText] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  const {
    activeCommitments,
    atRisk,
    loading,
    addCommitment,
    completeCommitment,
    breakCommitment,
  } = useCommitments(userId);

  const handleAdd = async () => {
    if (!newText.trim()) return;
    
    await addCommitment({
      text: newText.trim(),
      deadline: newDeadline || null,
    });
    
    setNewText('');
    setNewDeadline('');
    setShowAdd(false);
  };

  if (loading) {
    return (
      <div className={`p-5 rounded-xl bg-surface-1 border border-white/[0.06] animate-pulse ${className}`}>
        <div className="h-5 w-32 bg-surface-2 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-surface-2 rounded-xl" />
          <div className="h-16 bg-surface-2 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className={`p-5 rounded-xl bg-surface-1 border border-white/[0.06] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-brand" />
          <h3 className="text-sm font-medium text-text-secondary">Your Commitments</h3>
          {atRisk.length > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning/10 text-warning">
              {atRisk.length} at risk
            </span>
          )}
        </div>
        
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="p-1.5 rounded-lg bg-brand/10 text-brand hover:bg-brand/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="mb-4 p-4 rounded-xl bg-surface-2/50 border border-white/[0.06]">
          <input
            type="text"
            placeholder="I commit to..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="
              w-full px-3 py-2 rounded-lg mb-3
              bg-surface-2 border border-white/[0.06]
              text-sm text-text-primary placeholder-text-tertiary
              focus:outline-none focus:border-brand/30
            "
          />
          <div className="flex items-center gap-2">
            <input
              type="datetime-local"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              className="
                flex-1 px-3 py-2 rounded-lg
                bg-surface-2 border border-white/[0.06]
                text-sm text-text-primary
                focus:outline-none focus:border-brand/30
              "
            />
            <button
              onClick={handleAdd}
              disabled={!newText.trim()}
              className="
                px-4 py-2 rounded-lg
                bg-brand text-white text-sm font-medium
                hover:bg-brand-600 disabled:opacity-50
                transition-colors
              "
            >
              Commit
            </button>
          </div>
        </div>
      )}

      {/* Commitments List */}
      {activeCommitments.length > 0 ? (
        <div className="space-y-3">
          {activeCommitments.map(commitment => (
            <CommitmentItem
              key={commitment.id}
              commitment={commitment}
              onComplete={completeCommitment}
              onBreak={breakCommitment}
            />
          ))}
        </div>
      ) : (
        <div className="py-6 text-center">
          <Sparkles className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
          <p className="text-sm text-text-tertiary">No active commitments</p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-2 text-sm text-brand hover:text-brand-400"
          >
            Make a promise
          </button>
        </div>
      )}
    </div>
  );
}
