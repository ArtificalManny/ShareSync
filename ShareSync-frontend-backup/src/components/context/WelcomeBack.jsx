import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Rocket, 
  Zap, 
  Users, 
  FileEdit, 
  ArrowRight, 
  Home,
  Clock,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../utils/api';

/**
 * WelcomeBack Component
 * 
 * Premium "Welcome Back" experience for returning users.
 * Leverages psychology principles:
 * - Zeigarnik Effect: Shows unfinished actions
 * - Social proof: Recent collaborators
 * - Momentum: Focus session continuity
 * 
 * MetaLab 2026 Design:
 * - Glassmorphism backdrop
 * - Spring physics animations
 * - Staggered reveals
 * - Spatial UI hierarchy
 */

// Animation variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.9, 
    y: 40,
  },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 20,
    transition: { duration: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
};

const WelcomeBack = ({ onClose }) => {
  const [context, setContext] = useState(null);
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch context summary on mount
  useEffect(() => {
    if (!user) return;

    const checkContext = async () => {
      try {
        setIsLoading(true);
        const data = await apiRequest('/user-context/summary', 'GET');
        
        if (data && data.showWelcomeBack) {
          setContext(data);
          setShow(true);
        }
      } catch (error) {
        console.error('[WelcomeBack] Failed to load context:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Small delay to ensure smooth page load
    const timer = setTimeout(checkContext, 500);
    return () => clearTimeout(timer);
  }, [user]);

  // Handle keyboard escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && show) {
        handleDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show]);

  // Format time since last active
  const formatTimeSince = useCallback((ms) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
  }, []);

  // Get friendly greeting based on time of day
  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Resume where user left off
  const handleResume = useCallback(async () => {
    setIsNavigating(true);
    
    try {
      // Determine best route to resume
      let targetRoute = '/home';
      
      if (context?.lastProject?._id) {
        targetRoute = `/projects/${context.lastProject._id}`;
      } else if (context?.lastTask?._id) {
        targetRoute = `/projects/${context.lastTask.projectId}/tasks/${context.lastTask._id}`;
      } else if (context?.lastView && context.lastView !== 'home') {
        targetRoute = `/${context.lastView}`;
      }

      // Navigate with smooth transition
      navigate(targetRoute);
      setShow(false);
      onClose?.();
    } catch (error) {
      console.error('[WelcomeBack] Navigation failed:', error);
      setIsNavigating(false);
    }
  }, [context, navigate, onClose]);

  // Start fresh from home
  const handleStartFresh = useCallback(() => {
    navigate('/home');
    setShow(false);
    onClose?.();
  }, [navigate, onClose]);

  // Dismiss modal
  const handleDismiss = useCallback(() => {
    setShow(false);
    onClose?.();
  }, [onClose]);

  // Navigate to specific unfinished action
  const handleActionClick = useCallback((action) => {
    if (action.contextId) {
      // Try to navigate based on action type
      if (action.action.includes('task')) {
        navigate(`/projects/${action.contextId}`);
      } else if (action.action.includes('message')) {
        navigate('/messages');
      } else {
        handleResume();
      }
    } else {
      handleResume();
    }
    setShow(false);
    onClose?.();
  }, [navigate, handleResume, onClose]);

  // Don't render if no context or shouldn't show
  if (!show || !context || isLoading) return null;

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          key="welcome-back-backdrop"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={handleDismiss}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
          
          {/* Ambient glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px]" />
          </div>

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDismiss}
              className="absolute -top-12 right-0 p-2 text-slate-400 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-6 h-6" />
            </motion.button>

            {/* Card */}
            <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header with gradient accent */}
              <div className="relative px-8 pt-10 pb-6">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-purple-500 to-pink-500" />
                
                <motion.div variants={itemVariants} className="text-center">
                  {/* Animated emoji */}
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 400, 
                      damping: 15,
                      delay: 0.3,
                    }}
                    className="inline-block text-5xl mb-4"
                  >
                    👋
                  </motion.div>
                  
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {getGreeting()}!
                  </h2>
                  
                  <div className="flex items-center justify-center gap-2 text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>
                      You were last here {context.timeSinceLastActiveFormatted || formatTimeSince(context.timeSinceLastActive)}
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Content */}
              <div className="px-8 pb-8 space-y-4">
                {/* Last Project Card */}
                {context.lastProject && (
                  <motion.div variants={itemVariants}>
                    <ContextCard
                      icon={<Rocket className="w-5 h-5" />}
                      iconBg="bg-purple-500/20"
                      iconColor="text-purple-400"
                      label="Last Working On"
                      title={context.lastProject.name}
                      subtitle={context.lastProject.description}
                      badge={context.lastProject.icon}
                      onClick={handleResume}
                    />
                  </motion.div>
                )}

                {/* Last Task Card */}
                {context.lastTask && !context.lastProject && (
                  <motion.div variants={itemVariants}>
                    <ContextCard
                      icon={<FileEdit className="w-5 h-5" />}
                      iconBg="bg-blue-500/20"
                      iconColor="text-blue-400"
                      label="Last Task"
                      title={context.lastTask.title}
                      subtitle={`Status: ${context.lastTask.status}`}
                      onClick={handleResume}
                    />
                  </motion.div>
                )}

                {/* Focus Session Card */}
                {context.wasInFocus && context.currentFocusSession && (
                  <motion.div variants={itemVariants}>
                    <ContextCard
                      icon={<Zap className="w-5 h-5" />}
                      iconBg="bg-emerald-500/20"
                      iconColor="text-emerald-400"
                      label="Active Focus Session"
                      title="You were in deep focus mode"
                      subtitle="Ready to continue your flow state?"
                      highlight
                    />
                  </motion.div>
                )}

                {/* Unfinished Actions Card (Zeigarnik Effect) */}
                {context.topUnfinishedActions && context.topUnfinishedActions.length > 0 && (
                  <motion.div variants={itemVariants}>
                    <div className="bg-slate-800/50 border border-amber-500/20 rounded-xl p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-amber-400/80 uppercase tracking-wider font-medium mb-2">
                            Pick up where you left off
                          </p>
                          <ul className="space-y-2">
                            {context.topUnfinishedActions.map((action, idx) => (
                              <li 
                                key={idx}
                                onClick={() => handleActionClick(action)}
                                className="flex items-center gap-2 text-sm text-slate-300 hover:text-white cursor-pointer transition-colors group"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 group-hover:bg-amber-400 transition-colors" />
                                <span className="truncate">{action.context}</span>
                                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex-shrink-0" />
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Recent Collaborators */}
                {context.recentCollaborators && context.recentCollaborators.length > 0 && (
                  <motion.div variants={itemVariants}>
                    <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                            Recent Collaborators
                          </p>
                          <div className="flex items-center">
                            <div className="flex -space-x-2">
                              {context.recentCollaborators.slice(0, 5).map((collab, idx) => (
                                <CollaboratorAvatar 
                                  key={collab.userId?._id || idx} 
                                  collaborator={collab.userId} 
                                  index={idx}
                                />
                              ))}
                            </div>
                            {context.recentCollaborators.length > 5 && (
                              <span className="ml-3 text-xs text-slate-400">
                                +{context.recentCollaborators.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <motion.div 
                  variants={itemVariants}
                  className="flex gap-3 pt-4"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleResume}
                    disabled={isNavigating}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-purple-500 hover:bg-purple-400 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isNavigating ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Continue Where I Left Off</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStartFresh}
                    disabled={isNavigating}
                    className="flex items-center gap-2 px-6 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-medium rounded-xl transition-colors border border-white/10"
                  >
                    <Home className="w-4 h-4" />
                    <span>Start Fresh</span>
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Context Card - Reusable card for context items
 */
const ContextCard = ({ 
  icon, 
  iconBg, 
  iconColor, 
  label, 
  title, 
  subtitle, 
  badge,
  highlight,
  onClick,
}) => (
  <div 
    onClick={onClick}
    className={`
      bg-slate-800/50 border rounded-xl p-4 
      ${highlight ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5'}
      ${onClick ? 'cursor-pointer hover:bg-slate-800/80 hover:border-white/10 transition-all' : ''}
    `}
  >
    <div className="flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center ${iconColor} flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
          {label}
        </p>
        <div className="flex items-center gap-2">
          {badge && <span className="text-lg">{badge}</span>}
          <h3 className="text-base font-semibold text-white truncate">
            {title}
          </h3>
        </div>
        {subtitle && (
          <p className="text-sm text-slate-400 mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>
      {onClick && (
        <ArrowRight className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" />
      )}
    </div>
  </div>
);

/**
 * Collaborator Avatar - Animated avatar with tooltip
 */
const CollaboratorAvatar = ({ collaborator, index }) => {
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, x: -10 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative group"
    >
      {collaborator?.avatar ? (
        <img
          src={collaborator.avatar}
          alt={collaborator.displayName || collaborator.username}
          className="w-8 h-8 rounded-full border-2 border-slate-900 object-cover"
        />
      ) : (
        <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
          <span className="text-xs font-medium text-white">
            {getInitials(collaborator?.displayName || collaborator?.username)}
          </span>
        </div>
      )}
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        {collaborator?.displayName || collaborator?.username || 'Teammate'}
      </div>
    </motion.div>
  );
};

export default WelcomeBack;
