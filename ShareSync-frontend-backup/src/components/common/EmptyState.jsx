import React from 'react';
import { motion } from 'framer-motion';
import Button from './Button';

/**
 * EmptyState Component - MetaLab Edition
 * 
 * Beautiful empty states that guide users with:
 * - Animated icon with gradient background
 * - Clear, hierarchical messaging
 * - Primary and secondary action buttons
 * - Staggered entrance animations
 * - Matches OpenShare's spatial design system
 * 
 * Usage:
 * <EmptyState
 *   icon={<RocketIcon />}
 *   title="No Projects Yet"
 *   description="Create your first project to start tracking momentum and building your legacy."
 *   action={{ 
 *     label: 'Create Project', 
 *     onClick: handleCreate,
 *     icon: <PlusIcon />
 *   }}
 *   secondaryAction={{
 *     label: 'Learn More',
 *     onClick: handleLearnMore
 *   }}
 * />
 * 
 * Props:
 * - icon: React element (required) - Icon to display
 * - title: string (required) - Main heading
 * - description: string (required) - Explanatory text
 * - action: { label, onClick, icon? } - Primary action button
 * - secondaryAction: { label, onClick } - Optional secondary action
 * - variant: 'default' | 'subtle' - Visual style
 * - className: string - Additional classes
 */

const EmptyState = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  variant = 'default',
  className = '',
}) => {
  // Variant styles matching your MetaLab system
  const variants = {
    default: {
      container: 'p-16 md:p-20',
      iconBg: 'bg-gradient-to-br from-violet-500/20 via-violet-600/10 to-transparent',
      iconColor: 'text-violet-400',
      iconBorder: 'border border-white/5',
    },
    subtle: {
      container: 'p-12 md:p-16',
      iconBg: 'bg-white/[0.02]',
      iconColor: 'text-slate-500',
      iconBorder: 'border border-white/5',
    },
  };

  const style = variants[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={`
        flex flex-col items-center justify-center
        text-center
        ${style.container}
        ${className}
      `}
    >
      {/* Animated Icon with MetaLab Gradient */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          delay: 0.2,
          type: 'spring',
          stiffness: 200,
          damping: 15,
        }}
        className={`
          w-24 h-24 mb-8
          flex items-center justify-center
          rounded-3xl
          ${style.iconBg}
          ${style.iconBorder}
          ${style.iconColor}
        `}
      >
        {icon}
      </motion.div>

      {/* Title - Heavy weight, tight tracking */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tighter"
      >
        {title}
      </motion.h3>

      {/* Description - Medium weight, relaxed spacing */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-base md:text-lg text-slate-400 max-w-md mb-10 leading-relaxed font-medium"
      >
        {description}
      </motion.p>

      {/* Actions - Staggered entrance */}
      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {action && (
            <Button
              variant="primary"
              size="lg"
              onClick={action.onClick}
              icon={action.icon}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              size="lg"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmptyState;
