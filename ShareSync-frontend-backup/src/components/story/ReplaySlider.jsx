// src/components/story/ReplaySlider.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE J: Replay Mode Slider
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useCallback, useMemo } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Clock, 
  Rewind, FastForward, Activity, Users, CheckCircle2
} from 'lucide-react';

function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ReplaySlider({
  currentTime,
  dateRange,
  snapshot,
  isPlaying,
  playbackSpeed,
  progress,
  loading,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onSpeedChange,
  events = [],
  className = '',
}) {
  // Get event markers for the slider
  const eventMarkers = useMemo(() => {
    if (!dateRange || !events.length) return [];

    const start = new Date(dateRange.start).getTime();
    const end = new Date(dateRange.end).getTime();
    const range = end - start;

    return events.map(event => ({
      ...event,
      position: ((new Date(event.timestamp).getTime() - start) / range) * 100,
    }));
  }, [events, dateRange]);

  const handleSliderChange = useCallback((e) => {
    if (!dateRange) return;

    const percent = Number(e.target.value);
    const start = new Date(dateRange.start).getTime();
    const end = new Date(dateRange.end).getTime();
    const newTime = start + ((end - start) * percent / 100);

    onSeek(new Date(newTime).toISOString());
  }, [dateRange, onSeek]);

  const speeds = [0.5, 1, 2, 4];

  return (
    <div className={`p-4 rounded-xl bg-surface-1 border border-white/[0.06] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand" />
          <span className="text-sm font-medium text-text-secondary">Time Machine</span>
        </div>

        {/* Speed Control */}
        <div className="flex items-center gap-1">
          {speeds.map(speed => (
            <button
              key={speed}
              onClick={() => onSpeedChange(speed)}
              className={`
                px-2 py-1 rounded text-xs
                ${playbackSpeed === speed
                  ? 'bg-brand/10 text-brand'
                  : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-2'
                }
                transition-colors
              `}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Slider */}
      <div className="relative mb-4">
        {/* Track */}
        <div className="h-2 rounded-full bg-surface-3 relative">
          {/* Progress */}
          <div 
            className="absolute inset-y-0 left-0 rounded-full bg-brand transition-all duration-200"
            style={{ width: `${progress}%` }}
          />

          {/* Event Markers */}
          {eventMarkers.map((marker, i) => (
            <div
              key={i}
              className={`
                absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full
                ${marker.type === 'ship' ? 'bg-brand' :
                  marker.type === 'blocker' ? 'bg-error-500' :
                  marker.type === 'decision' ? 'bg-warning' : 'bg-success'}
                cursor-pointer hover:scale-150 transition-transform
              `}
              style={{ left: `${marker.position}%` }}
              title={`${marker.title} - ${formatTimestamp(marker.timestamp)}`}
              onClick={() => onSeek(marker.timestamp)}
            />
          ))}
        </div>

        {/* Range Input (invisible, overlays for interaction) */}
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSliderChange}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
      </div>

      {/* Time Labels */}
      <div className="flex justify-between text-xs text-text-tertiary mb-4">
        <span>{dateRange?.start ? formatTimestamp(dateRange.start) : '--'}</span>
        <span className="font-medium text-text-primary">
          {currentTime ? formatTimestamp(currentTime) : '--'}
        </span>
        <span>{dateRange?.end ? formatTimestamp(dateRange.end) : '--'}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={onStop}
          className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
          title="Stop"
        >
          <SkipBack className="w-5 h-5 text-text-tertiary" />
        </button>

        <button
          onClick={() => {
            const current = new Date(currentTime);
            const newTime = new Date(current.getTime() - 24 * 60 * 60 * 1000);
            onSeek(newTime.toISOString());
          }}
          className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
          title="Back 1 day"
        >
          <Rewind className="w-5 h-5 text-text-tertiary" />
        </button>

        <button
          onClick={isPlaying ? onPause : onPlay}
          className="
            p-3 rounded-xl bg-brand text-white
            hover:bg-brand-600 transition-colors
          "
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </button>

        <button
          onClick={() => {
            const current = new Date(currentTime);
            const newTime = new Date(current.getTime() + 24 * 60 * 60 * 1000);
            onSeek(newTime.toISOString());
          }}
          className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
          title="Forward 1 day"
        >
          <FastForward className="w-5 h-5 text-text-tertiary" />
        </button>

        <button
          onClick={() => onSeek(dateRange?.end)}
          className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
          title="Jump to end"
        >
          <SkipForward className="w-5 h-5 text-text-tertiary" />
        </button>
      </div>

      {/* Snapshot Preview */}
      {snapshot && (
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-text-primary">{snapshot.state?.progress || 0}%</div>
              <div className="text-[10px] text-text-tertiary">Progress</div>
            </div>
            <div>
              <div className="text-lg font-bold text-success">{snapshot.state?.tasksCompleted || 0}</div>
              <div className="text-[10px] text-text-tertiary">Completed</div>
            </div>
            <div>
              <div className="text-lg font-bold text-error-500">{snapshot.state?.activeBlockers || 0}</div>
              <div className="text-[10px] text-text-tertiary">Blockers</div>
            </div>
            <div>
              <div className="text-lg font-bold text-brand">L{snapshot.state?.teamMomentum || 1}</div>
              <div className="text-[10px] text-text-tertiary">Momentum</div>
            </div>
          </div>

          {/* Active Members at Time */}
          {snapshot.activeMembers?.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-text-tertiary" />
              <div className="flex -space-x-2">
                {snapshot.activeMembers.slice(0, 5).map((member, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full bg-surface-2 border-2 border-surface-1 flex items-center justify-center text-[10px] text-text-tertiary"
                    title={member.name}
                  >
                    {member.name?.charAt(0)}
                  </div>
                ))}
              </div>
              <span className="text-xs text-text-tertiary">
                {snapshot.activeMembers.length} active at this time
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
