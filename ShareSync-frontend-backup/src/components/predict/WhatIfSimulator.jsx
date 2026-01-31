// src/components/predict/WhatIfSimulator.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PREDICT ENGINE: What-If Simulator
// Run scenarios to see impact on project timeline
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import { 
  Sparkles, Scissors, UserPlus, UserMinus, Calendar,
  TrendingUp, TrendingDown, ArrowRight, Play, X,
  RefreshCw, CheckCircle2, AlertTriangle, Zap
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export const SCENARIO_TYPES = {
  CUT_FEATURE: 'cut_feature',
  ADD_MEMBER: 'add_member',
  REMOVE_MEMBER: 'remove_member',
  EXTEND_DEADLINE: 'extend_deadline',
  ADD_SCOPE: 'add_scope',
  REDUCE_SCOPE: 'reduce_scope',
};

const SCENARIO_CONFIG = {
  [SCENARIO_TYPES.CUT_FEATURE]: {
    icon: Scissors,
    color: 'text-warning-400',
    bgColor: 'bg-warning-500/10',
    label: 'Cut Feature',
    description: 'Remove a feature to reduce scope',
  },
  [SCENARIO_TYPES.ADD_MEMBER]: {
    icon: UserPlus,
    color: 'text-success-400',
    bgColor: 'bg-success-500/10',
    label: 'Add Team Member',
    description: 'Add capacity to the project',
  },
  [SCENARIO_TYPES.REMOVE_MEMBER]: {
    icon: UserMinus,
    color: 'text-error-400',
    bgColor: 'bg-error-500/10',
    label: 'Remove Team Member',
    description: 'Simulate member leaving',
  },
  [SCENARIO_TYPES.EXTEND_DEADLINE]: {
    icon: Calendar,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    label: 'Extend Deadline',
    description: 'Move the deadline out',
  },
  [SCENARIO_TYPES.REDUCE_SCOPE]: {
    icon: Scissors,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    label: 'Reduce to Critical',
    description: 'Keep only critical/high priority',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO CARD
// ═══════════════════════════════════════════════════════════════════════════════

function ScenarioCard({
  type,
  isSelected,
  onClick,
}) {
  const config = SCENARIO_CONFIG[type];
  if (!config) return null;
  
  const Icon = config.icon;
  
  return (
    <button
      onClick={onClick}
      className={`
        p-4 rounded-xl border transition-all duration-200
        ${isSelected 
          ? `${config.bgColor} ${config.color} border-current` 
          : 'bg-surface-1 border-white/[0.06] hover:bg-surface-2'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${config.bgColor}
        `}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="text-left">
          <div className={`text-sm font-medium ${isSelected ? config.color : 'text-text-primary'}`}>
            {config.label}
          </div>
          <div className="text-xs text-text-tertiary">
            {config.description}
          </div>
        </div>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO PARAMETERS
// ═══════════════════════════════════════════════════════════════════════════════

function ScenarioParams({
  type,
  params,
  onChange,
  features = [],
  teamMembers = [],
}) {
  switch (type) {
    case SCENARIO_TYPES.CUT_FEATURE:
      return (
        <div className="space-y-3">
          <label className="text-sm text-text-secondary">Select feature to cut</label>
          <select
            value={params.featureTag || ''}
            onChange={(e) => onChange({ ...params, featureTag: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-white/[0.06] text-text-primary"
          >
            <option value="">Select a feature...</option>
            {features.map(f => (
              <option key={f.id || f.tag} value={f.tag || f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      );
      
    case SCENARIO_TYPES.ADD_MEMBER:
      return (
        <div className="space-y-3">
          <label className="text-sm text-text-secondary">New member details</label>
          <input
            type="text"
            placeholder="Name"
            value={params.newMember?.name || ''}
            onChange={(e) => onChange({ 
              ...params, 
              newMember: { ...params.newMember, name: e.target.value, id: `new-${Date.now()}` }
            })}
            className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-white/[0.06] text-text-primary placeholder:text-text-tertiary"
          />
        </div>
      );
      
    case SCENARIO_TYPES.REMOVE_MEMBER:
      return (
        <div className="space-y-3">
          <label className="text-sm text-text-secondary">Select member to remove</label>
          <select
            value={params.memberId || ''}
            onChange={(e) => onChange({ ...params, memberId: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-white/[0.06] text-text-primary"
          >
            <option value="">Select a member...</option>
            {teamMembers.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      );
      
    case SCENARIO_TYPES.EXTEND_DEADLINE:
      return (
        <div className="space-y-3">
          <label className="text-sm text-text-secondary">Extend by how many days?</label>
          <div className="flex gap-2">
            {[7, 14, 21, 30].map(days => (
              <button
                key={days}
                onClick={() => onChange({ ...params, days })}
                className={`
                  flex-1 py-2 rounded-lg text-sm font-medium
                  ${params.days === days 
                    ? 'bg-cyan-500 text-white' 
                    : 'bg-surface-2 text-text-secondary hover:bg-surface-3'
                  }
                `}
              >
                +{days}d
              </button>
            ))}
          </div>
        </div>
      );
      
    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIMULATION RESULT
// ═══════════════════════════════════════════════════════════════════════════════

function SimulationResult({ result, onApply, onReset }) {
  if (!result) return null;
  
  const { originalForecast, newForecast, impact } = result;
  const isImprovement = impact.completionChange > 0;
  
  return (
    <div className="space-y-4">
      {/* Impact summary */}
      <div className={`
        p-4 rounded-xl border
        ${isImprovement 
          ? 'bg-success-500/10 border-success-500/30' 
          : 'bg-warning-500/10 border-warning-500/30'
        }
      `}>
        <div className="flex items-center gap-2 mb-3">
          {isImprovement ? (
            <TrendingUp className="w-5 h-5 text-success-400" />
          ) : (
            <TrendingDown className="w-5 h-5 text-warning-400" />
          )}
          <span className={`font-medium ${isImprovement ? 'text-success-400' : 'text-warning-400'}`}>
            {isImprovement ? 'Improvement' : 'Trade-off'}
          </span>
        </div>
        
        <div className="text-2xl font-bold text-text-primary mb-1">
          {impact.completionChange > 0 ? '+' : ''}{impact.completionChange}% completion
        </div>
        <div className="text-sm text-text-tertiary">
          {originalForecast.projectedCompletion}% → {newForecast.projectedCompletion}%
        </div>
      </div>
      
      {/* Before/After comparison */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-surface-1 border border-white/[0.06]">
          <div className="text-xs text-text-tertiary mb-1">Before</div>
          <div className="text-lg font-bold text-text-primary">
            {originalForecast.projectedCompletion}%
          </div>
          <div className="text-xs text-text-tertiary">
            {originalForecast.daysRemaining} days
          </div>
        </div>
        <div className="p-3 rounded-lg bg-surface-1 border border-white/[0.06]">
          <div className="text-xs text-text-tertiary mb-1">After</div>
          <div className={`text-lg font-bold ${isImprovement ? 'text-success-400' : 'text-warning-400'}`}>
            {newForecast.projectedCompletion}%
          </div>
          <div className="text-xs text-text-tertiary">
            {newForecast.daysRemaining} days
          </div>
        </div>
      </div>
      
      {/* Impact details */}
      <div className="space-y-2">
        {impact.tasksChanged !== 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-text-tertiary">Tasks</span>
            <span className={impact.tasksChanged < 0 ? 'text-warning-400' : 'text-success-400'}>
              {impact.tasksChanged > 0 ? '+' : ''}{impact.tasksChanged}
            </span>
          </div>
        )}
        {impact.teamSizeChange !== 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-text-tertiary">Team Size</span>
            <span className={impact.teamSizeChange > 0 ? 'text-success-400' : 'text-warning-400'}>
              {impact.teamSizeChange > 0 ? '+' : ''}{impact.teamSizeChange}
            </span>
          </div>
        )}
        {impact.deadlineChange !== 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-text-tertiary">Deadline</span>
            <span className="text-cyan-400">
              +{impact.deadlineChange} days
            </span>
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onApply}
          className="flex-1 py-2.5 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-400 transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Apply Changes</span>
        </button>
        <button
          onClick={onReset}
          className="px-4 py-2.5 rounded-lg bg-surface-2 text-text-secondary hover:bg-surface-3 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN WHAT-IF SIMULATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * WhatIfSimulator - Scenario planning UI
 */
export function WhatIfSimulator({
  onSimulate,
  onApplyScenario,
  features = [],
  teamMembers = [],
  className = '',
}) {
  const [selectedType, setSelectedType] = useState(null);
  const [params, setParams] = useState({});
  const [result, setResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  
  const handleRunSimulation = useCallback(async () => {
    if (!selectedType) return;
    
    setIsSimulating(true);
    try {
      const simulationResult = await onSimulate?.({
        type: selectedType,
        params,
      });
      setResult(simulationResult);
    } finally {
      setIsSimulating(false);
    }
  }, [selectedType, params, onSimulate]);
  
  const handleApply = useCallback(() => {
    if (result) {
      onApplyScenario?.(result);
      handleReset();
    }
  }, [result, onApplyScenario]);
  
  const handleReset = useCallback(() => {
    setSelectedType(null);
    setParams({});
    setResult(null);
  }, []);
  
  return (
    <div className={`
      rounded-2xl overflow-hidden
      bg-surface-0 border border-white/[0.08]
      ${className}
    `}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] bg-gradient-to-r from-brand-500/10 to-purple-500/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <div className="text-lg font-semibold text-text-primary">
              What-If Simulator
            </div>
            <div className="text-sm text-text-tertiary">
              Explore different scenarios
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {!result ? (
          <>
            {/* Scenario selection */}
            <div className="space-y-3 mb-6">
              <div className="text-sm font-medium text-text-secondary">
                Choose a scenario
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Object.keys(SCENARIO_CONFIG).map(type => (
                  <ScenarioCard
                    key={type}
                    type={type}
                    isSelected={selectedType === type}
                    onClick={() => {
                      setSelectedType(type);
                      setParams({});
                    }}
                  />
                ))}
              </div>
            </div>
            
            {/* Parameters */}
            {selectedType && (
              <div className="mb-6">
                <ScenarioParams
                  type={selectedType}
                  params={params}
                  onChange={setParams}
                  features={features}
                  teamMembers={teamMembers}
                />
              </div>
            )}
            
            {/* Run button */}
            <button
              onClick={handleRunSimulation}
              disabled={!selectedType || isSimulating}
              className="
                w-full py-3 rounded-xl
                bg-gradient-to-r from-brand-500 to-purple-500
                text-white font-medium
                hover:from-brand-400 hover:to-purple-400
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200
                flex items-center justify-center gap-2
              "
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Simulating...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Run Simulation</span>
                </>
              )}
            </button>
          </>
        ) : (
          <SimulationResult
            result={result}
            onApply={handleApply}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK SCENARIO BUTTON
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * QuickScenarioButton - Inline button to run a specific scenario
 */
export function QuickScenarioButton({
  type,
  label,
  onClick,
  className = '',
}) {
  const config = SCENARIO_CONFIG[type];
  if (!config) return null;
  
  const Icon = config.icon;
  
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-lg
        ${config.bgColor} ${config.color}
        hover:opacity-80 transition-opacity
        flex items-center gap-1.5 text-sm
        ${className}
      `}
    >
      <Icon className="w-3 h-3" />
      <span>{label || config.label}</span>
    </button>
  );
}

export default WhatIfSimulator;
