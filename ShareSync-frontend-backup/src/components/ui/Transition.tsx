// ═══════════════════════════════════════════════════════════════════════════
// SHARESYNC TRANSITION COMPONENTS
// Reusable animation wrappers for consistent motion throughout the app
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  fadeRise, 
  scalePop, 
  slideIn, 
  slideInRight,
  springs 
} from '@/lib/motion';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type TransitionVariant = 'fade' | 'scale' | 'slide' | 'slideRight' | 'none';

interface TransitionProps {
  children: React.ReactNode;
  show?: boolean;
  variant?: TransitionVariant;
  className?: string;
  delay?: number;
}

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT MAPPING
// ─────────────────────────────────────────────────────────────────────────────

const variants: Record<TransitionVariant, Variants> = {
  fade: fadeRise,
  scale: scalePop,
  slide: slideIn,
  slideRight: slideInRight,
  none: {
    hidden: {},
    visible: {},
    exit: {},
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TRANSITION COMPONENT
// Wraps content with enter/exit animations
// ─────────────────────────────────────────────────────────────────────────────

export function Transition({
  children,
  show = true,
  variant = 'fade',
  className,
  delay = 0,
}: TransitionProps) {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          variants={variants[variant]}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={className}
          transition={{ delay: delay / 1000 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE TRANSITION
// Use this to wrap page content for smooth page transitions
// ─────────────────────────────────────────────────────────────────────────────

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={springs.smooth}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGGER CONTAINER & ITEM
// Use for lists where items should animate in sequence
// ─────────────────────────────────────────────────────────────────────────────

export function StaggerContainer({ 
  children, 
  className,
  staggerDelay = 0.05,
}: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.1,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { 
          opacity: 0, 
          y: 20,
          scale: 0.95,
        },
        visible: { 
          opacity: 1, 
          y: 0,
          scale: 1,
          transition: springs.smooth,
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FADE IN
// Simple fade in animation
// ─────────────────────────────────────────────────────────────────────────────

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export function FadeIn({ 
  children, 
  className, 
  delay = 0,
  duration = 0.3,
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ 
        duration,
        delay: delay / 1000,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCALE IN
// Pop-in animation for modals, tooltips, etc.
// ─────────────────────────────────────────────────────────────────────────────

interface ScaleInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function ScaleIn({ children, className, delay = 0 }: ScaleInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        ...springs.bouncy,
        delay: delay / 1000,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE UP
// Slide in from bottom animation
// ─────────────────────────────────────────────────────────────────────────────

interface SlideUpProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
}

export function SlideUp({ 
  children, 
  className, 
  delay = 0,
  distance = 20,
}: SlideUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: distance }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        ...springs.smooth,
        delay: delay / 1000,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRESENCE WRAPPER
// Handles AnimatePresence for conditional rendering
// ─────────────────────────────────────────────────────────────────────────────

interface PresenceProps {
  children: React.ReactNode;
  show: boolean;
  mode?: 'wait' | 'sync' | 'popLayout';
}

export function Presence({ children, show, mode = 'wait' }: PresenceProps) {
  return (
    <AnimatePresence mode={mode}>
      {show && children}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED LIST
// Automatically animates list items as they're added/removed
// ─────────────────────────────────────────────────────────────────────────────

interface AnimatedListProps<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  itemClassName?: string;
}

export function AnimatedList<T>({
  items,
  keyExtractor,
  renderItem,
  className,
  itemClassName,
}: AnimatedListProps<T>) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.05,
          },
        },
      }}
      className={className}
    >
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div
            key={keyExtractor(item)}
            layout
            variants={{
              hidden: { opacity: 0, y: 20, scale: 0.95 },
              visible: { 
                opacity: 1, 
                y: 0, 
                scale: 1,
                transition: springs.smooth,
              },
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.95,
              transition: { duration: 0.15 },
            }}
            className={itemClassName}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default Transition;
