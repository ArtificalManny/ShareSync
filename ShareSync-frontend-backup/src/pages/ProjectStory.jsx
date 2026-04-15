// src/pages/ProjectStory.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE J: Project Story Time Machine - Main Page
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  History, Clock, GitBranch, Sparkles, ChevronLeft, 
  Calendar, Download, Share2
} from 'lucide-react';

// Story Components
import ProjectTimeline from '../components/story/ProjectTimeline';
import WeeklySummary from '../components/story/WeeklySummary';
import DecisionLog from '../components/story/DecisionLog';
import ReplaySlider from '../components/story/ReplaySlider';

// Hooks
import { 
  useProjectTimeline, 
  useWeeklySummary, 
  useDecisionLog, 
  useReplayMode,
  useProjectWeeks 
} from '../hooks/useProjectStory';

// API
import { getProject } from '../api/projects';
import useDocumentTitle from "../hooks/useDocumentTitle";

const TABS = [
  { id: 'timeline', label: 'Timeline', icon: History },
  { id: 'decisions', label: 'Decisions', icon: GitBranch },
  { id: 'replay', label: 'Time Machine', icon: Clock },
];

export default function ProjectStory() {
  useDocumentTitle("Project Story");
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState('timeline');
  const [project, setProject] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);

  // Fetch project info
  useEffect(() => {
    async function fetchProject() {
      try {
        const data = await getProject(projectId);
        setProject(data);
      } catch (err) {
        console.error('Failed to load project:', err);
      }
    }
    if (projectId) fetchProject();
  }, [projectId]);

  // Timeline data
  const {
    filteredEvents,
    groupedEvents,
    stats,
    filters,
    dateRange,
    loading: timelineLoading,
    updateFilters,
    clearFilters,
    refresh: refreshTimeline,
  } = useProjectTimeline(projectId);

  // Weekly summary
  const { 
    summary, 
    loading: summaryLoading, 
    refresh: refreshSummary 
  } = useWeeklySummary(projectId, selectedWeek);

  // Decision log
  const { 
    decisions, 
    loading: decisionsLoading, 
    refresh: refreshDecisions 
  } = useDecisionLog(projectId);

  // Replay mode
  const replayState = useReplayMode(projectId, dateRange);

  // Available weeks
  const { weeks } = useProjectWeeks(projectId);

  // Set default week on load
  useEffect(() => {
    if (weeks.length > 0 && !selectedWeek) {
      setSelectedWeek(weeks[0].start);
    }
  }, [weeks, selectedWeek]);

  const handleEventClick = (event) => {
    console.log('Event clicked:', event);
    // Could open a modal with event details
  };

  const handleAddDecision = () => {
    console.log('Add decision clicked');
    // Could open a decision creation modal
  };

  return (
    <div className="min-h-screen bg-surface-0">
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-surface-0/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Back + Title */}
            <div className="flex items-center gap-4">
              <Link 
                to={`/projects/${projectId}`}
                className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-text-tertiary" />
              </Link>
              
              <div>
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-brand" />
                  <h1 className="text-xl font-semibold text-text-primary">
                    Project Story
                  </h1>
                </div>
                <p className="text-sm text-text-tertiary mt-0.5">
                  {project?.name || 'Loading...'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button className="
                flex items-center gap-2 px-3 py-2 rounded-lg
                text-sm text-text-tertiary
                hover:text-text-secondary hover:bg-surface-2
                transition-colors
              ">
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button className="
                flex items-center gap-2 px-3 py-2 rounded-lg
                text-sm text-text-tertiary
                hover:text-text-secondary hover:bg-surface-2
                transition-colors
              ">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 mt-4">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    transition-colors
                    ${isActive 
                      ? 'bg-brand/10 text-brand' 
                      : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-2'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════════════════════════════ */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Weekly Summary - Always visible at top */}
        <div className="mb-8">
          {/* Week Selector */}
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-4 h-4 text-text-tertiary" />
            <select
              value={selectedWeek || ''}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="
                px-3 py-2 rounded-lg
                bg-surface-2 border border-white/[0.06]
                text-sm text-text-primary
                focus:outline-none focus:border-brand/30
              "
            >
              {weeks.map(week => (
                <option key={week.start} value={week.start}>
                  {week.label} ({week.stats.ships} ships, {week.stats.events} events)
                </option>
              ))}
            </select>
          </div>

          <WeeklySummary
            summary={summary}
            loading={summaryLoading}
            onRefresh={refreshSummary}
            onViewDetails={() => setActiveTab('timeline')}
          />
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-12 gap-8">
          
          {/* ─────────────────────────────────────────────────────────────────
              TIMELINE TAB
          ───────────────────────────────────────────────────────────────── */}
          {activeTab === 'timeline' && (
            <div className="col-span-12">
              <ProjectTimeline
                groupedEvents={groupedEvents}
                stats={stats}
                filters={filters}
                loading={timelineLoading}
                onFilterChange={updateFilters}
                onClearFilters={clearFilters}
                onEventClick={handleEventClick}
                onRefresh={refreshTimeline}
              />
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              DECISIONS TAB
          ───────────────────────────────────────────────────────────────── */}
          {activeTab === 'decisions' && (
            <div className="col-span-12 lg:col-span-8">
              <DecisionLog
                decisions={decisions}
                loading={decisionsLoading}
                onAddDecision={handleAddDecision}
              />
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              REPLAY TAB
          ───────────────────────────────────────────────────────────────── */}
          {activeTab === 'replay' && (
            <div className="col-span-12 space-y-6">
              {/* Replay Controls */}
              <ReplaySlider
                currentTime={replayState.currentTime}
                dateRange={dateRange}
                snapshot={replayState.snapshot}
                isPlaying={replayState.isPlaying}
                playbackSpeed={replayState.playbackSpeed}
                progress={replayState.progress}
                loading={replayState.loading}
                onPlay={replayState.play}
                onPause={replayState.pause}
                onStop={replayState.stop}
                onSeek={replayState.seekTo}
                onSpeedChange={replayState.setPlaybackSpeed}
                events={filteredEvents}
              />

              {/* Snapshot Details */}
              {replayState.snapshot && (
                <div className="p-6 rounded-xl bg-surface-1 border border-white/[0.06]">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-brand" />
                    <h3 className="font-medium text-text-primary">Project State at This Moment</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-surface-2/50">
                      <div className="text-2xl font-bold text-text-primary">
                        {replayState.snapshot.state?.progress || 0}%
                      </div>
                      <div className="text-xs text-text-tertiary mt-1">Overall Progress</div>
                    </div>
                    <div className="p-4 rounded-lg bg-surface-2/50">
                      <div className="text-2xl font-bold text-success">
                        {replayState.snapshot.state?.tasksCompleted || 0}
                      </div>
                      <div className="text-xs text-text-tertiary mt-1">Tasks Completed</div>
                    </div>
                    <div className="p-4 rounded-lg bg-surface-2/50">
                      <div className="text-2xl font-bold text-error-500">
                        {replayState.snapshot.state?.activeBlockers || 0}
                      </div>
                      <div className="text-xs text-text-tertiary mt-1">Active Blockers</div>
                    </div>
                    <div className="p-4 rounded-lg bg-surface-2/50">
                      <div className="text-2xl font-bold text-brand">
                        L{replayState.snapshot.state?.teamMomentum || 1}
                      </div>
                      <div className="text-xs text-text-tertiary mt-1">Team Momentum</div>
                    </div>
                  </div>

                  {/* Events at this time */}
                  <div className="mt-6 pt-6 border-t border-white/[0.06]">
                    <h4 className="text-sm font-medium text-text-secondary mb-3">
                      Events around this time
                    </h4>
                    <div className="space-y-2">
                      {filteredEvents
                        .filter(e => {
                          const eventTime = new Date(e.timestamp).getTime();
                          const currentTime = new Date(replayState.currentTime).getTime();
                          return Math.abs(eventTime - currentTime) < 24 * 60 * 60 * 1000; // Within 24 hours
                        })
                        .slice(0, 5)
                        .map(event => (
                          <div 
                            key={event.id}
                            className="flex items-center gap-3 p-2 rounded-lg bg-surface-2/30"
                          >
                            <div className={`
                              w-2 h-2 rounded-full
                              ${event.type === 'ship' ? 'bg-brand' :
                                event.type === 'blocker' ? 'bg-error-500' :
                                event.type === 'decision' ? 'bg-warning' : 'bg-success'}
                            `} />
                            <span className="text-sm text-text-secondary flex-1 truncate">
                              {event.title}
                            </span>
                            <span className="text-xs text-text-tertiary">
                              {event.type}
                            </span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
