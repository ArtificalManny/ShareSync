// src/components/project/kpis/KPIRow.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE G: KPI Row Container
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import HeartbeatCard from './HeartbeatCard';
import EnergySyncCard from './EnergySyncCard';
import TeamBalanceCard from './TeamBalanceCard';

export default function KPIRow({ 
  metrics,
  onHeartbeatClick,
  onEnergyClick,
  onBalanceClick,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <HeartbeatCard 
        data={metrics?.heartbeat}
        onClick={onHeartbeatClick}
      />
      <EnergySyncCard 
        data={metrics?.energy}
        onClick={onEnergyClick}
      />
      <TeamBalanceCard 
        data={metrics?.teamBalance}
        onClick={onBalanceClick}
      />
    </div>
  );
}
