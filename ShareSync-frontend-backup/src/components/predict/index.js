// src/components/predict/index.js
// ═══════════════════════════════════════════════════════════════════════════════
// PREDICT ENGINE: Barrel Export
// ═══════════════════════════════════════════════════════════════════════════════

// Main hook
export {
  usePredictEngine,
  RISK_LEVELS,
  RISK_TYPES,
} from '../../hooks/usePredictEngine';

// Completion Forecast
export {
  CompletionForecast,
  MiniForecastWidget,
} from './CompletionForecast';

// Risk Detection
export {
  RiskDetectionPanel,
  RiskSummaryBadge,
  RiskAlertToast,
} from './RiskDetection';

// Smart Suggestions
export {
  SmartSuggestionsPanel,
  InlineSuggestion,
  SuggestionBadge,
} from './SmartSuggestions';

// Capacity Planning
export {
  CapacityPlanningPanel,
  MiniCapacityWidget,
} from './CapacityPlanning';

// What-If Simulator
export {
  WhatIfSimulator,
  QuickScenarioButton,
  SCENARIO_TYPES,
} from './WhatIfSimulator';
