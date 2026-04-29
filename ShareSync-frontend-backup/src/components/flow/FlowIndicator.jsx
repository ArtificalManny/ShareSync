// src/components/flow/FlowIndicator.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// FLOW INDICATOR DISABLED
// ═══════════════════════════════════════════════════════════════════════════════
//
// This component is intentionally kept as a safe no-op.
//
// Why:
// - The previous version displayed a floating "Building focus..." indicator.
// - That felt random and visually distracting in the app.
// - Keeping this file/export prevents import errors elsewhere in the app.
// - The feature can be restored later from the backup if needed.
//
// Backup created by script:
// src/components/flow/FlowIndicator.jsx.bak.before-disable-flow-indicator
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";

export default function FlowIndicator() {
  return null;
}

function BuildingIndicator() {
  return null;
}

function InFlowIndicator() {
  return null;
}

export { BuildingIndicator, InFlowIndicator };
