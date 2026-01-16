// src/components/project/items/TaskItem.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - "Breathing Card System"
// ═══════════════════════════════════════════════════════════════════════════════
// 3-ELEMENT RULE APPLIED:
// Each item has: 1) Title  2) Status badge  3) Time
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { CheckCircle2, PencilLine, ClipboardList } from "lucide-react";
import Card, { CardBadge } from "../../common/Card";

export default function TaskItem({ event, when, isFresh = false, className = "" }) {
  const u = event || {};
  const t = (u.type || "").toLowerCase();
  const title = u.title || u.meta?.title || u.text || "Task";
  const whenText = when || (u.createdAt ? new Date(u.createdAt).toLocaleString() : "");

  // Status configuration
  const isCompleted = t.includes("completed");
  const isUpdated = t.includes("updated");

  const status = isCompleted
    ? { icon: CheckCircle2, label: "Shipped", variant: "success", cardStatus: "success" }
    : isUpdated
    ? { icon: PencilLine, label: "Updated", variant: "warning", cardStatus: null }
    : { icon: ClipboardList, label: "Drafted", variant: "brand", cardStatus: null };

  const Icon = status.icon;

  return (
    <Card 
      variant={isCompleted ? "ambient" : "elevated"}
      status={status.cardStatus}
      interactive 
      animated
      padding="sm"
      className={`group ${className}`}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={`
          flex-shrink-0 p-2 rounded-lg
          ${isCompleted ? 'bg-success/10 text-success' : 
            isUpdated ? 'bg-warning/10 text-warning' : 
            'bg-brand/10 text-brand'}
        `}>
          <Icon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Element 1: Title */}
          <p className="text-sm font-medium text-text-primary group-hover:text-brand transition-colors truncate">
            {title}
          </p>
          
          {/* Element 3: Time */}
          <p className="text-xs text-text-tertiary mt-0.5">
            {whenText}
          </p>
        </div>

        {/* Element 2: Status Badge */}
        <CardBadge variant={status.variant}>
          {status.label}
        </CardBadge>

        {/* Fresh indicator (subtle, no glow) */}
        {isFresh && (
          <div className="w-1.5 h-1.5 rounded-full bg-brand" />
        )}
      </div>
    </Card>
  );
}
