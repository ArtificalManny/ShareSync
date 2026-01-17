// src/components/ui/EmptyState.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 7: Visual Cohesion - Empty State System
// ═══════════════════════════════════════════════════════════════════════════════
//
// PHILOSOPHY:
// Empty states are OPPORTUNITIES, not dead ends.
// They should feel encouraging, actionable, and on-brand.
//
// VARIANTS:
// - default: Neutral, informational
// - welcome: First-time user, celebratory
// - search: No results found
// - error: Something went wrong
// - success: Task completed, nothing left
//
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { Plus, Search, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";

/**
 * EmptyState - Encouraging, actionable empty state component
 * 
 * @param {string} variant - 'default' | 'welcome' | 'search' | 'error' | 'success'
 * @param {string} icon - Emoji or 'none' to hide
 * @param {string} title - Main heading
 * @param {string} description - Supporting text
 * @param {object} primaryAction - { label: string, onClick: fn, icon?: Component }
 * @param {object} secondaryAction - { label: string, onClick: fn }
 * @param {string} className - Additional classes
 */
export default function EmptyState({
  variant = "default",
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className = "",
  children,
}) {
  // Variant-based defaults
  const variantConfig = {
    default: {
      icon: "📋",
      title: "Nothing here yet",
      description: "Get started by creating your first item.",
      bgClass: "bg-surface-1",
      borderClass: "border-white/[0.06]",
    },
    welcome: {
      icon: "🚀",
      title: "Ready for launch",
      description: "Your mission control awaits. Let's build something great.",
      bgClass: "bg-gradient-to-b from-brand/5 to-transparent",
      borderClass: "border-brand/20",
    },
    search: {
      icon: "🔍",
      title: "No matches found",
      description: "Try adjusting your search or filters.",
      bgClass: "bg-surface-1",
      borderClass: "border-white/[0.06]",
    },
    error: {
      icon: "⚠️",
      title: "Something went wrong",
      description: "We couldn't load this content. Please try again.",
      bgClass: "bg-error/5",
      borderClass: "border-error/20",
    },
    success: {
      icon: "✨",
      title: "All caught up!",
      description: "You've completed everything. Time to celebrate.",
      bgClass: "bg-success/5",
      borderClass: "border-success/20",
    },
  };

  const config = variantConfig[variant] || variantConfig.default;
  
  // Allow overrides
  const displayIcon = icon !== undefined ? icon : config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  return (
    <div
      className={`
        relative rounded-2xl border p-8 md:p-12
        flex flex-col items-center justify-center text-center
        ${config.bgClass} ${config.borderClass}
        ${className}
      `}
      role="status"
      aria-live="polite"
    >
      {/* Icon */}
      {displayIcon && displayIcon !== "none" && (
        <div className="mb-4">
          <div className={`
            w-16 h-16 rounded-2xl flex items-center justify-center
            bg-surface-2 border border-white/[0.06]
            ${variant === 'welcome' ? 'animate-fade-up' : ''}
          `}>
            <span className="text-3xl" aria-hidden="true">
              {displayIcon}
            </span>
          </div>
        </div>
      )}

      {/* Title */}
      <h3 className={`
        text-lg font-semibold mb-2
        ${variant === 'error' ? 'text-error' : 'text-text-primary'}
      `}>
        {displayTitle}
      </h3>

      {/* Description */}
      <p className="text-sm text-text-secondary max-w-sm mb-6">
        {displayDescription}
      </p>

      {/* Custom children */}
      {children}

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <div className="flex items-center gap-3 mt-2">
          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg
                text-sm font-medium transition-all duration-200
                ${variant === 'error' 
                  ? 'bg-error text-white hover:bg-error-600' 
                  : 'bg-brand text-white hover:bg-brand-600 hover:shadow-glow-brand'
                }
              `}
            >
              {primaryAction.icon && <primaryAction.icon className="w-4 h-4" />}
              {primaryAction.label}
            </button>
          )}
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="
                px-4 py-2.5 rounded-lg text-sm font-medium
                bg-surface-2 text-text-secondary
                hover:bg-surface-3 hover:text-text-primary
                transition-all duration-200
              "
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PRE-BUILT EMPTY STATES - Ready to use
   ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * EmptyProjects - For the Projects page
 */
export function EmptyProjects({ onCreateProject }) {
  return (
    <EmptyState
      variant="welcome"
      icon="🎯"
      title="Your arena awaits"
      description="Projects are where momentum is built. Create your first one and start shipping."
      primaryAction={{
        label: "Create Project",
        onClick: onCreateProject,
        icon: Plus,
      }}
    />
  );
}

/**
 * EmptyTasks - For task lists within projects
 */
export function EmptyTasks({ onAddTask, projectName }) {
  return (
    <EmptyState
      variant="default"
      icon="✅"
      title="No active tasks"
      description={`${projectName ? `"${projectName}" is` : "This project is"} ready for its first mission. What needs to happen next?`}
      primaryAction={{
        label: "Add Task",
        onClick: onAddTask,
        icon: Plus,
      }}
    />
  );
}

/**
 * EmptySearch - When search returns no results
 */
export function EmptySearch({ query, onClearSearch }) {
  return (
    <EmptyState
      variant="search"
      title="No matches found"
      description={query ? `Nothing matches "${query}". Try different keywords.` : "Try adjusting your search or filters."}
      secondaryAction={onClearSearch ? {
        label: "Clear search",
        onClick: onClearSearch,
      } : undefined}
    />
  );
}

/**
 * EmptyInbox - When notifications/inbox is empty
 */
export function EmptyInbox() {
  return (
    <EmptyState
      variant="success"
      icon="📭"
      title="Inbox zero achieved"
      description="No notifications right now. You're all caught up!"
    />
  );
}

/**
 * EmptyActivity - When activity feed is empty
 */
export function EmptyActivity() {
  return (
    <EmptyState
      variant="default"
      icon="📊"
      title="No activity yet"
      description="Complete tasks and ship projects to see your activity here."
    />
  );
}

/**
 * EmptyTeam - When team members list is empty
 */
export function EmptyTeam({ onInvite }) {
  return (
    <EmptyState
      variant="welcome"
      icon="👥"
      title="Build your crew"
      description="Great things are built together. Invite teammates to collaborate."
      primaryAction={onInvite ? {
        label: "Invite Teammate",
        onClick: onInvite,
        icon: Plus,
      } : undefined}
    />
  );
}

/**
 * EmptySprint - When sprint has no tasks
 */
export function EmptySprint({ onAddTask }) {
  return (
    <EmptyState
      variant="default"
      icon="⚡"
      title="Sprint is empty"
      description="Add tasks to this sprint to start tracking progress."
      primaryAction={{
        label: "Add Task",
        onClick: onAddTask,
        icon: Plus,
      }}
    />
  );
}

/**
 * AllTasksComplete - When all tasks are done (celebration!)
 */
export function AllTasksComplete() {
  return (
    <EmptyState
      variant="success"
      icon="🎉"
      title="All tasks shipped!"
      description="You crushed it. Take a moment to appreciate your progress."
    />
  );
}
