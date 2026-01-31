// src/pages/ProjectHome.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE G: The Cockpit - Mission Control for Projects
// ═══════════════════════════════════════════════════════════════════════════════
//
// LAYOUT: 60/25/15 Attention Split
// - Hero (60%): Momentum tachometer + Critical moves + Ship CTA
// - Quest Deck (25%): Active objectives + Current sprint
// - Bio-Feed (15%): Announcements + Activity feed
//
// This is the command center. Everything answers:
// "Is this project healthy, and what are the next 1-3 moves?"
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/ui/toast";

// Hooks
import { useProjectOverview } from '../hooks/useProjectOverview';
import { useIsMobile } from "../hooks/useMobile";
import usePresence from "../hooks/usePresence";

// Context
import { useCursorContext } from "../context/CursorContext";
import { useCursorFlash } from "../hooks/useCursor";

// Hero Components
import ProjectHero from '../components/project/hero/ProjectHero';

// KPI Components
import KPIRow from '../components/project/kpis/KPIRow';

// Quest Deck Components
import QuestDeck from '../components/project/quest-deck/QuestDeck';

// Bio-Feed Components
import BioFeed from '../components/project/bio-feed/BioFeed';

// Global
import GlobalPulseBar, { useGlobalPulse } from '../components/ui/GlobalPulseBar';

// Utilities
import QuickActionsManager from '../components/quick-actions/QuickActionsManager';
import KeyboardShortcuts from '../components/quick-actions/KeyboardShortcuts';

/* ─────────────────────────────────────────────────────────────────────────
   LOADING STATE
───────────────────────────────────────────────────────────────────────── */
function LoadingState() {
  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full border-2 border-brand/20 border-t-brand animate-spin mx-auto mb-4" />
        <p className="text-text-tertiary text-sm">Loading project...</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ERROR STATE
───────────────────────────────────────────────────────────────────────── */
function ErrorState({ error, onRetry }) {
  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-error-500/10 mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">Failed to load project</h2>
        <p className="text-text-tertiary mb-6">{error}</p>
        <button 
          onClick={onRetry}
          className="px-6 py-3 rounded-xl bg-brand text-white font-medium hover:bg-brand-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   MAIN PAGE COMPONENT
───────────────────────────────────────────────────────────────────────── */
export default function ProjectHome() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Presence
  const { joinProject, leaveProject } = useCursorContext();
  const { flashShip } = useCursorFlash();
  const { projectStats } = usePresence({ autoDetectIdle: true });
  const { triggerPulse } = useGlobalPulse();

  // Project data
  const {
    project,
    metrics,
    criticalMoves,
    objectives,
    sprint,
    announcements,
    activity,
    pinnedAnnouncement,
    loading,
    error,
    refresh,
    shipUpdate,
    isHealthy,
    hasWarnings,
  } = useProjectOverview(id);

  // Join/leave project presence
  useEffect(() => {
    if (id) joinProject(id);
    return () => leaveProject();
  }, [id, joinProject, leaveProject]);

  // Handle ship update
  const handleShipUpdate = useCallback(async (description) => {
    try {
      await shipUpdate({ description });
      flashShip();
      triggerPulse();
      toast({ title: "🚀 Update Shipped!", variant: "success" });
    } catch (e) {
      toast({ title: "Ship Failed", description: e.message, variant: "error" });
      throw e;
    }
  }, [shipUpdate, flashShip, triggerPulse]);

  // Navigation handlers
  const handleViewActivity = useCallback(() => {
    // Could open a modal or navigate to activity page
    console.log('View activity');
  }, []);

  const handleSettings = useCallback(() => {
    navigate(`/projects/${id}/settings`);
  }, [navigate, id]);

  const handleObjectiveClick = useCallback((objective) => {
    navigate(`/projects/${id}/objectives/${objective.id}`);
  }, [navigate, id]);

  const handleAddObjective = useCallback(() => {
    // Open objective creation modal
    console.log('Add objective');
  }, []);

  const handleSprintAction = useCallback((action) => {
    if (action === 'start') {
      // Open sprint creation
      console.log('Start sprint');
    } else if (action === 'continue') {
      navigate(`/projects/${id}/sprint`);
    } else if (action === 'review') {
      // Open sprint review
      console.log('Review sprint');
    }
  }, [navigate, id]);

  const handleAnnouncementClick = useCallback((announcement) => {
    console.log('Announcement clicked:', announcement);
  }, []);

  const handleNewAnnouncement = useCallback(() => {
    console.log('New announcement');
  }, []);

  const handleActivityClick = useCallback((item) => {
    console.log('Activity clicked:', item);
  }, []);

  // KPI click handlers
  const handleHeartbeatClick = useCallback(() => {
    console.log('Heartbeat details');
  }, []);

  const handleEnergyClick = useCallback(() => {
    console.log('Energy rebalance');
  }, []);

  const handleBalanceClick = useCallback(() => {
    console.log('Team balance details');
  }, []);

  // Loading state
  if (loading) {
    return <LoadingState />;
  }

  // Error state
  if (error) {
    return <ErrorState error={error} onRetry={refresh} />;
  }

  return (
    <div className="min-h-screen bg-surface-0 text-text-primary">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-6 lg:py-10">
        
        {/* ═══════════════════════════════════════════════════════════════════
            HERO SECTION (60% attention)
            Momentum Tachometer + Critical Moves + Ship CTA
        ═══════════════════════════════════════════════════════════════════ */}
        <ProjectHero
          project={project}
          metrics={metrics}
          criticalMoves={criticalMoves}
          onShipUpdate={handleShipUpdate}
          onViewActivity={handleViewActivity}
          onSettings={handleSettings}
          activeUsers={projectStats?.online || 0}
        />

        {/* ═══════════════════════════════════════════════════════════════════
            KPI ROW
            Heartbeat + Energy Sync + Team Balance
        ═══════════════════════════════════════════════════════════════════ */}
        <KPIRow
          metrics={metrics}
          onHeartbeatClick={handleHeartbeatClick}
          onEnergyClick={handleEnergyClick}
          onBalanceClick={handleBalanceClick}
        />

        {/* ═══════════════════════════════════════════════════════════════════
            MAIN CONTENT GRID
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ─────────────────────────────────────────────────────────────────
              QUEST DECK (25% attention)
              Active Objectives + Current Sprint
          ───────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-8">
            <QuestDeck
              objectives={objectives}
              sprint={sprint}
              onObjectiveClick={handleObjectiveClick}
              onAddObjective={handleAddObjective}
              onSprintAction={handleSprintAction}
            />
          </div>

          {/* ─────────────────────────────────────────────────────────────────
              BIO-FEED (15% attention)
              Announcements + Activity Feed
          ───────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-4">
            <BioFeed
              announcements={announcements}
              activity={activity}
              onAnnouncementClick={handleAnnouncementClick}
              onActivityClick={handleActivityClick}
              onNewAnnouncement={handleNewAnnouncement}
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          GLOBAL PULSE BAR
          Subtle 1px bar that blinks when anyone ships
      ═══════════════════════════════════════════════════════════════════ */}
      <GlobalPulseBar position="bottom" color="brand" />

      {/* ═══════════════════════════════════════════════════════════════════
          INVISIBLE UTILITIES
      ═══════════════════════════════════════════════════════════════════ */}
      <QuickActionsManager />
      <KeyboardShortcuts />
    </div>
  );
}
