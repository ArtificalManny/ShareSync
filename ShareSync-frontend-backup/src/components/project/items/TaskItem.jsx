import React from "react";
import { ClipboardList, CheckCircle2, PencilLine, Clock } from "lucide-react";
import Card, { CardBody } from "../../common/Card";

/**
 * TaskItem - Phase 5 A+ Refinement
 * Renders task-related activity with high-contrast design system logic.
 */
export default function TaskItem({ event, when, isFresh = false, className = "" }) {
  const u = event || {};
  const t = (u.type || "").toLowerCase();
  const title = u.title || u.meta?.title || u.text || "Task";
  const whenText = when || (u.createdAt ? new Date(u.createdAt).toLocaleString() : "");

  // Semantic Status Configuration
  const isCompleted = t.includes("completed");
  const isUpdated = t.includes("updated");

  const statusConfig = isCompleted
    ? {
        icon: <CheckCircle2 className="w-4 h-4 text-success-500" />,
        accent: "border-success-500/30 bg-success-500/5",
        label: "Shipped",
        text: "text-success-500"
      }
    : isUpdated
    ? {
        icon: <PencilLine className="w-4 h-4 text-warning-500" />,
        accent: "border-warning-500/30 bg-warning-500/5",
        label: "Updated",
        text: "text-warning-500"
      }
    : {
        icon: <ClipboardList className="w-4 h-4 text-brand-400" />,
        accent: "border-brand-500/30 bg-brand-500/5",
        label: "Drafted",
        text: "text-brand-400"
      };

  const actionText = isCompleted
    ? "Successfully completed"
    : isUpdated
    ? "Refined details for"
    : "Started new mission:";

  return (
    <Card 
      variant="flat" 
      interactive 
      className={`group border-l-2 ${statusConfig.accent} ${isFresh ? "animate-pulse" : ""} ${className}`}
    >
      <CardBody className="py-3 px-4 flex items-center gap-4">
        {/* Status Icon Orb */}
        <div className={`flex-shrink-0 p-2 rounded-lg bg-slate-900 border border-white/5 group-hover:scale-110 transition-transform`}>
          {statusConfig.icon}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${statusConfig.text}`}>
              {statusConfig.label}
            </span>
            <span className="text-[10px] text-neutral-500 font-medium">•</span>
            <div className="flex items-center gap-1 text-[10px] text-neutral-500 font-bold">
              <Clock size={10} />
              {whenText}
            </div>
          </div>
          
          <p className="text-sm text-neutral-300 truncate font-medium">
            <span className="text-neutral-500 font-normal mr-1">{actionText}</span>
            <span className="text-white group-hover:text-brand-400 transition-colors tracking-tight">
              {title}
            </span>
          </p>
        </div>

        {/* Subtle Indicator for Fresh Content */}
        {isFresh && (
          <div className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
        )}
      </CardBody>
    </Card>
  );
}
