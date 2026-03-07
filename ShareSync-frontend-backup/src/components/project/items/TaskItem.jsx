// src/components/project/items/TaskItem.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - PHASE 4: Information Architecture
// OPTIMISTIC UI: Instantly updates state on click before API resolves
// ═══════════════════════════════════════════════════════════════════════════════
// 3-ZONE PATTERN (Asana-style consistent scanning):
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │ ZONE 1: Identity      │ ZONE 2: Status              │ ZONE 3: Action        │
// │ ──────────────────    │ ──────────────────          │ ──────────────────    │
// │ Icon + Title          │ Timestamp                   │ Status text           │
// │ (type determines icon)│ (when it happened)          │ Chevron on hover      │
// └─────────────────────────────────────────────────────────────────────────────┘
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { CheckCircle2, PencilLine, ClipboardList, ChevronRight } from "lucide-react";
import { useMomentumContext } from "../../../contexts/MomentumContext";

export default function TaskItem({ event, when, isFresh = false, onClick, className = "" }) {
  const u = event || {};
  const t = (u.type || "").toLowerCase();
  const title = u.title || u.meta?.title || u.text || "Task";
  const whenText = when || (u.createdAt ? new Date(u.createdAt).toLocaleString() : "");

  // ─────────────────────────────────────────────────────────────────────────────
  // OPTIMISTIC UI STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [optimisticCompleted, setOptimisticCompleted] = useState(false);
  const momentumContext = useMomentumContext();
  
  // Safely extract context methods (prevents crashes if context is missing)
  const addOptimisticXP = momentumContext?.addOptimisticXP;
  const revertOptimisticXP = momentumContext?.revertOptimisticXP;

  // Status configuration (incorporating optimistic state)
  const isCompleted = t.includes("completed") || optimisticCompleted;
  const isUpdated = t.includes("updated");

  const status = isCompleted
    ? { icon: CheckCircle2, label: "Shipped", color: "text-success", bg: "bg-success/10" }
    : isUpdated
    ? { icon: PencilLine, label: "Updated", color: "text-warning", bg: "bg-warning/10" }
    : { icon: ClipboardList, label: "Drafted", color: "text-brand", bg: "bg-brand/10" };

  const Icon = status.icon;

  // ─────────────────────────────────────────────────────────────────────────────
  // OPTIMISTIC CLICK HANDLER
  // ─────────────────────────────────────────────────────────────────────────────
  const handleItemClick = async (e) => {
    if (!onClick) return;

    // If it's already completed natively or optimistically, just fire the normal click
    if (t.includes("completed") || optimisticCompleted) {
      return onClick(e);
    }

    // 🔥 Optimistic Execution: Instantly update UI and XP
    setOptimisticCompleted(true);
    if (addOptimisticXP) addOptimisticXP(10); // Standard task completion XP

    try {
      // Fire the backend API call asynchronously
      const result = await onClick(e);
      
      // If the parent explicitly returns a failure object, revert
      if (result && result.success === false) {
        throw new Error("Server rejected completion");
      }
    } catch (error) {
      // ⚠️ Revert on Failure: If the API fails, undo the checkmark and XP silently
      console.warn("Optimistic update failed, reverting UI:", error);
      setOptimisticCompleted(false);
      if (revertOptimisticXP) revertOptimisticXP(10);
      
      // Notify the user why the checkmark disappeared
      window.alert("Failed to sync task. Please try again.");
    }
  };

  return (
    <div 
      onClick={handleItemClick}
      className={`
        group flex items-center gap-4 p-3 rounded-xl
        bg-surface-1 border border-white/[0.06]
        hover:bg-surface-2 hover:border-white/[0.1]
        transition-all duration-200
        ${onClick ? 'cursor-pointer' : ''}
        ${isCompleted ? 'opacity-70' : ''}
        ${className}
      `}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 1: Identity (What is this?)
          Icon (indicates type) + Title
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Icon - type indicator */}
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center shrink-0
          transition-colors duration-200
          ${status.bg}
        `}>
          <Icon className={`w-4 h-4 ${status.color}`} />
        </div>

        {/* Title */}
        <p className="text-sm font-medium text-text-primary truncate group-hover:text-brand transition-colors">
          {title}
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 2: Status (When did it happen?)
          Timestamp - simple, not competing
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="hidden sm:block shrink-0">
        <span className="text-xs text-text-tertiary">
          {whenText}
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 3: Action (What's the status?)
          Status text + fresh indicator + chevron
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Status text - not a badge, just text */}
        <span className={`text-xs font-medium ${status.color}`}>
          {status.label}
        </span>

        {/* Fresh indicator (subtle dot) */}
        {isFresh && !isCompleted && (
          <div className="w-1.5 h-1.5 rounded-full bg-brand" />
        )}

        {/* Chevron on hover */}
        {onClick && (
          <ChevronRight className="
            w-4 h-4 text-text-tertiary
            opacity-0 group-hover:opacity-100
            transition-opacity duration-200
          " />
        )}
      </div>
    </div>
  );
}
