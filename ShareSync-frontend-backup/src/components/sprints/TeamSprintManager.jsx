// src/components/sprints/TeamSprintManager.jsx - Week 8 Day 3-4
import React, { useState } from 'react';
import SprintScheduler from './SprintScheduler';
import ActiveSprint from './ActiveSprint';
import SprintRetro from './SprintRetro';
import { Zap } from 'lucide-react';

/**
 * TeamSprintManager - Manages sprint lifecycle
 * Scheduler → Active Sprint → Retro
 */
const TeamSprintManager = ({ projectId, onSprintComplete }) => {
  const [showScheduler, setShowScheduler] = useState(false);
  const [activeSprint, setActiveSprint] = useState(null);
  const [showRetro, setShowRetro] = useState(false);

  const handleScheduleSprint = (sprint) => {
    setActiveSprint(sprint);
    setShowScheduler(false);
  };

  const handleEndSprint = () => {
    setShowRetro(true);
  };

  const handleRetroComplete = (retroData) => {
    onSprintComplete?.(retroData);
    setShowRetro(false);
    setActiveSprint(null);
  };

  const handleRetroSkip = () => {
    setShowRetro(false);
    setActiveSprint(null);
  };

  return (
    <>
      {/* Sprint Button */}
      {!activeSprint && (
        <button
          onClick={() => setShowScheduler(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 rounded-xl font-semibold transition-all shadow-lg"
        >
          <Zap className="w-5 h-5" />
          Start Team Sprint
        </button>
      )}

      {/* Sprint Scheduler Modal */}
      {showScheduler && (
        <SprintScheduler
          projectId={projectId}
          onSchedule={handleScheduleSprint}
          onClose={() => setShowScheduler(false)}
        />
      )}

      {/* Active Sprint View */}
      {activeSprint && !showRetro && (
        <ActiveSprint
          sprint={activeSprint}
          onEnd={handleEndSprint}
          onPause={() => console.log('Sprint paused')}
          onResume={() => console.log('Sprint resumed')}
        />
      )}

      {/* Sprint Retro Modal */}
      {showRetro && activeSprint && (
        <SprintRetro
          sprint={activeSprint}
          participants={[
            { id: 1, name: 'Sarah', avatar: '👩', shipsCount: 2 },
            { id: 2, name: 'Mike', avatar: '👨', shipsCount: 1 },
            { id: 3, name: 'You', avatar: '👤', shipsCount: 3 }
          ]}
          onClose={handleRetroSkip}
          onComplete={handleRetroComplete}
        />
      )}
    </>
  );
};

export default TeamSprintManager;
