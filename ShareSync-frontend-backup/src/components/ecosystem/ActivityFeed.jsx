import UserAvatar from '../ui/UserAvatar';
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Rocket, CheckCircle, FileText, DollarSign, Users, 
  MessageCircle, TrendingUp, Clock, Sparkles
} from 'lucide-react';

const activityColors = {
  purple: 'text-violet-600 bg-violet-100 dark:text-brand dark:bg-brand/10',
  emerald: 'text-emerald-600 bg-emerald-100 dark:text-success dark:bg-success/10',
  blue: 'text-blue-600 bg-blue-100 dark:text-info dark:bg-info/10',
  fuchsia: 'text-fuchsia-600 bg-fuchsia-100 dark:text-fuchsia-500 dark:bg-fuchsia-500/10',
  orange: 'text-orange-600 bg-orange-100 dark:text-warning dark:bg-warning/10',
};

const iconMap = { Rocket, CheckCircle, TrendingUp, MessageCircle, DollarSign, Sparkles, Users, FileText };

/* ─────────────────────────────────────────────────────────────────────────
   ANIMATION VARIANTS (PHASE 3)
───────────────────────────────────────────────────────────────────────── */
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } 
  }
};

export default function ActivityFeed({ activities = [] }) {
  if (!activities || activities.length === 0) return null;

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {activities.map((activity) => {
        
        if (activity.type === 'interstitial') {
          return (
            <motion.div variants={item} key={activity.id} className="py-2">
              {activity.component}
            </motion.div>
          );
        }

        const Icon = typeof activity.icon === 'string' ? (iconMap[activity.icon] || Sparkles) : (activity.icon || Sparkles);
        const colorClass = activityColors[activity.color] || activityColors.purple;
        const activityUser =
          typeof activity.user === 'object'
            ? activity.user
            : {
                name: activity.user || activity.actorName || activity.username || 'User',
                avatarUrl:
                  activity.avatarUrl ||
                  activity.profilePicture ||
                  activity.profileImage ||
                  activity.avatar ||
                  activity.userAvatar ||
                  activity.actorAvatar ||
                  null,
              };
        const hasUserIdentity = Boolean(activity.user || activityUser.avatarUrl || activityUser.profilePicture || activityUser.avatar);
        
        return (
          <motion.div
            variants={item}
            key={activity.id}
            className="group flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-surface-1 border border-slate-200 dark:border-white/[0.06] hover:border-violet-300 dark:hover:border-white/[0.12] shadow-sm hover:shadow-md hover:shadow-violet-100/50 dark:hover:shadow-none transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
          >
            {hasUserIdentity ? (
              <UserAvatar
                user={activityUser}
                name={activityUser.name || 'User'}
                avatarUrl={
                  activityUser.avatarUrl ||
                  activityUser.profilePicture ||
                  activityUser.profileImage ||
                  activityUser.avatar
                }
                size={48}
                ringClassName="ring-0"
                className="shadow-sm border border-slate-200 dark:border-white/10"
              />
            ) : (
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                <Icon className="w-6 h-6" />
              </div>
            )}
            
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-base text-slate-800 dark:text-text-primary leading-snug">
                {activity.user && (
                  <span className="font-bold text-violet-600 dark:text-brand">{activity.user} </span>
                )}
                <span className="font-medium text-slate-500 dark:text-text-tertiary">{activity.action} </span>
                <span className="font-bold text-slate-800 dark:text-text-primary">{activity.content}</span>
              </p>
              
              <div className="flex items-center gap-2 mt-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-text-tertiary">
                {activity.project && (
                  <>
                    <span className="bg-slate-100 dark:bg-surface-2 px-2 py-1 rounded-md text-slate-600 dark:text-text-secondary">
                      {activity.project}
                    </span>
                    <span className="opacity-30">•</span>
                  </>
                )}
                <div className="flex items-center gap-1 text-slate-500 dark:text-text-tertiary normal-case tracking-normal">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-medium">{activity.timestamp}</span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
