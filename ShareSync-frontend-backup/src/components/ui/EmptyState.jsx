// src/components/ui/EmptyState.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3: Visual Cohesion - Premium Empty State System
// - Uses framer-motion for staggered entrances.
// - High-contrast typography (tight tracking, heavy font weights).
// - Vibrant background gradients mapped to variants.
// ═══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { motion } from "framer-motion";
import { Plus, Search, CheckCircle2, Megaphone, Inbox, Users } from "lucide-react";

export default function EmptyState({
  variant = "default", // 'default' | 'welcome' | 'search' | 'success' | 'celebratory'
  icon: IconComponent,
  title,
  description,
  primaryAction,
  secondaryAction,
  className = "",
  children,
}) {
  const variantConfig = {
    default: {
      Icon: IconComponent || Plus,
      iconBg: "bg-slate-100 dark:bg-white/5",
      iconColor: "text-slate-400 dark:text-slate-500",
      border: "border-slate-200 dark:border-white/10",
      buttonStyle: "bg-violet-600 hover:bg-violet-700 text-white shadow-md hover:shadow-lg",
    },
    welcome: {
      Icon: IconComponent || Plus,
      iconBg: "bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-500/20 dark:to-fuchsia-500/20",
      iconColor: "text-violet-600 dark:text-violet-400",
      border: "border-violet-200 dark:border-violet-500/20",
      buttonStyle: "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:scale-[1.02] text-white shadow-lg",
    },
    search: {
      Icon: IconComponent || Search,
      iconBg: "bg-slate-100 dark:bg-white/5",
      iconColor: "text-slate-500",
      border: "border-slate-200 dark:border-white/10",
      buttonStyle: "bg-slate-800 hover:bg-slate-900 dark:bg-white/10 dark:hover:bg-white/20 text-white",
    },
    success: {
      Icon: IconComponent || CheckCircle2,
      iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-500/20",
      buttonStyle: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md",
    },
    celebratory: {
      Icon: IconComponent || CheckCircle2,
      iconBg: "bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-500/20 dark:to-orange-500/20",
      iconColor: "text-amber-600 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-500/20",
      buttonStyle: "bg-gradient-to-r from-amber-500 to-orange-500 hover:scale-[1.02] text-white shadow-lg",
    }
  };

  const config = variantConfig[variant] || variantConfig.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`relative w-full rounded-2xl border p-10 md:p-14 flex flex-col items-center justify-center text-center bg-white dark:bg-[#1f1f23] ${config.border} shadow-sm ${className}`}
      role="status"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
        className={`w-16 h-16 md:w-20 md:h-20 mb-6 flex items-center justify-center rounded-2xl border ${config.border} ${config.iconBg} shadow-inner`}
      >
        <config.Icon className={`w-8 h-8 md:w-10 md:h-10 ${config.iconColor}`} />
      </motion.div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-[20px] md:text-[24px] font-black text-slate-900 dark:text-white tracking-tight mb-3"
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-[14px] md:text-[15px] font-medium text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed"
      >
        {description}
      </motion.p>

      {children}

      {(primaryAction || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold tracking-wide transition-all duration-300 ${config.buttonStyle}`}
            >
              {primaryAction.icon && <primaryAction.icon className="w-4 h-4" />}
              {primaryAction.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-5 py-2.5 rounded-xl text-[13px] font-bold tracking-wide bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────
export function EmptyProjects({ onCreateProject }) {
  return <EmptyState variant="welcome" title="Your arena awaits" description="Projects are where momentum is built. Create your first one and start shipping." primaryAction={{ label: "Create Project", onClick: onCreateProject, icon: Plus }} />;
}

export function EmptyTasks({ onAddTask, projectName }) {
  return <EmptyState variant="default" title="No active tasks" description={`${projectName ? `"${projectName}" is` : "This project is"} ready for its first mission. What needs to happen next?`} primaryAction={{ label: "Add Task", onClick: onAddTask, icon: Plus }} />;
}

export function EmptySearch({ query, onClearSearch }) {
  return <EmptyState variant="search" title="No matches found" description={query ? `Nothing matches "${query}". Try different keywords.` : "Try adjusting your search or filters."} secondaryAction={onClearSearch ? { label: "Clear Search", onClick: onClearSearch } : undefined} />;
}

export function EmptyInbox() {
  return <EmptyState variant="success" icon={Inbox} title="Inbox zero achieved" description="No notifications right now. You're all caught up!" />;
}

export function EmptyTeam({ onInvite }) {
  return <EmptyState variant="welcome" icon={Users} title="Build your crew" description="Great things are built together. Invite teammates to collaborate." primaryAction={onInvite ? { label: "Invite Teammate", onClick: onInvite, icon: Plus } : undefined} />;
}

export function EmptyAnnouncements({ onPost }) {
  return <EmptyState variant="default" icon={Megaphone} title="It's quiet in here" description="Post your first announcement to keep everyone in the loop." primaryAction={onPost ? { label: "Post Announcement", onClick: onPost, icon: Plus } : undefined} />;
}
