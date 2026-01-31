// src/components/project/quest-deck/QuestDeck.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE G: Quest Deck - Objectives + Sprint Container
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Plus, Target } from 'lucide-react';
import ObjectiveCard from './ObjectiveCard';
import SprintPanel from './SprintPanel';

export default function QuestDeck({
  objectives = [],
  sprint,
  onObjectiveClick,
  onAddObjective,
  onSprintAction,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
      {/* Active Objectives - 8 cols */}
      <div className="lg:col-span-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-brand" />
            <h2 className="text-lg font-semibold text-text-primary">Active Objectives</h2>
          </div>
          
          <button 
            onClick={onAddObjective}
            className="
              p-2 rounded-lg
              bg-surface-1 border border-white/[0.06]
              text-text-tertiary hover:text-text-primary
              hover:bg-surface-2 hover:border-white/[0.1]
              transition-all
            "
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {objectives.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {objectives.map((objective) => (
              <ObjectiveCard
                key={objective.id}
                objective={objective}
                onClick={() => onObjectiveClick?.(objective)}
              />
            ))}
          </div>
        ) : (
          <div className="
            p-10 text-center rounded-xl
            bg-surface-1 border border-dashed border-white/[0.1]
          ">
            <Target className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
            <p className="text-text-secondary font-medium mb-1">No active objectives</p>
            <p className="text-sm text-text-tertiary">Create your first objective to get started</p>
          </div>
        )}
      </div>

      {/* Current Sprint - 4 cols */}
      <div className="lg:col-span-4">
        <SprintPanel
          sprint={sprint}
          onAction={onSprintAction}
        />
      </div>
    </div>
  );
}
