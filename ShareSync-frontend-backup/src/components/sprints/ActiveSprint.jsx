// src/components/sprints/ActiveSprint.jsx - Week 8 Day 3-4
import React, { useState, useEffect } from 'react';
import { Clock, Users, Target, Zap, Pause, Play, X } from 'lucide-react';
import LiveActivityFeed from '../presence/LiveActivityFeed';
import OnlineIndicator from '../presence/OnlineIndicator';

/**
 * ActiveSprint - Running sprint view with timer and real-time activity
 */
const ActiveSprint = ({ sprint, onEnd, onPause, onResume }) => {
  const [timeRemaining, setTimeRemaining] = useState(sprint.duration * 60); // seconds
  const [isPaused, setIsPaused] = useState(false);
  const [participants] = useState([
    { id: 1, name: 'Sarah', avatar: '👩', status: 'online', shipsCount: 2 },
    { id: 2, name: 'Mike', avatar: '👨', status: 'online', shipsCount: 1 },
    { id: 3, name: 'You', avatar: '👤', status: 'online', shipsCount: 3 }
  ]);

  // Countdown timer
  useEffect(() => {
    if (isPaused || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onEnd?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, timeRemaining, onEnd]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return ((sprint.duration * 60 - timeRemaining) / (sprint.duration * 60)) * 100;
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    if (isPaused) {
      onResume?.();
    } else {
      onPause?.();
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 z-40 overflow-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Team Sprint Active</h1>
                  <p className="text-sm text-slate-400">Stay focused, ship together</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-sm w-fit">
                <Target className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-white">{sprint.goal}</span>
              </div>
            </div>

            <button
              onClick={onEnd}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              title="End sprint"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Timer */}
          <div className="text-center mb-6">
            <div className={`text-6xl font-bold mb-2 ${
              timeRemaining < 60 ? 'text-red-400 animate-pulse' : 
              timeRemaining < 300 ? 'text-orange-400' : 
              'text-purple-400'
            }`}>
              {formatTime(timeRemaining)}
            </div>
            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-1000"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={handlePauseResume}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition-all flex items-center gap-2"
              >
                {isPaused ? (
                  <>
                    <Play className="w-5 h-5" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-5 h-5" />
                    Pause
                  </>
                )}
              </button>
              <button
                onClick={onEnd}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-semibold transition-all"
              >
                End Sprint
              </button>
            </div>
          </div>

          {/* Participants */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Users className="w-4 h-4" />
              <span>Team ({participants.length})</span>
            </div>
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 rounded-xl border border-slate-700/50"
              >
                <div className="relative">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                    {participant.avatar}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <OnlineIndicator size="xs" isOnline={participant.status === 'online'} />
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-xs font-medium text-white">{participant.name}</div>
                  <div className="text-xs text-emerald-400">{participant.shipsCount} ships</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-Time Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Live Activity
            </h3>
            <LiveActivityFeed projectId={sprint.projectId} />
          </div>

          {/* Sprint Stats */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Sprint Progress
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                <div className="text-3xl font-bold text-purple-400 mb-1">
                  {participants.reduce((sum, p) => sum + p.shipsCount, 0)}
                </div>
                <div className="text-sm text-slate-400">Total Ships</div>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <div className="text-3xl font-bold text-emerald-400 mb-1">
                  {participants.length}
                </div>
                <div className="text-sm text-slate-400">Active Team</div>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                <div className="text-3xl font-bold text-orange-400 mb-1">
                  {Math.round(getProgressPercentage())}%
                </div>
                <div className="text-sm text-slate-400">Time Elapsed</div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="text-3xl font-bold text-blue-400 mb-1">
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-sm text-slate-400">Remaining</div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
              <h4 className="text-sm font-semibold text-white mb-2">💡 Sprint Tips:</h4>
              <ul className="space-y-1 text-xs text-slate-400">
                <li>• Stay focused on the goal</li>
                <li>• Ship small, ship often</li>
                <li>• Help teammates when stuck</li>
                <li>• Keep chat for quick questions only</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ActiveSprint;
