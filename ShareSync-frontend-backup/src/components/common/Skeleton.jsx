import React from 'react';
import { motion } from 'framer-motion';

/**
 * Skeleton Component - Animated Loading States
 * 
 * Provides shimmer effect for loading content while maintaining layout consistency.
 * Uses OpenShare's MetaLab elevation system for authentic depth.
 * 
 * Features:
 * - Shimmer animation using your existing Tailwind keyframes
 * - Multiple variants for different content types
 * - Customizable width/height
 * - Maintains your 8px spacing grid
 * - Matches your border-radius system
 * 
 * Usage:
 * <Skeleton variant="card" count={3} />
 * <Skeleton variant="text" width="60%" />
 * <Skeleton variant="avatar" />
 * 
 * Variants:
 * - text: Single line of text (h-4)
 * - title: Page/section title (h-8)
 * - avatar: Circular avatar (w-12 h-12)
 * - card: Card placeholder (h-32)
 * - button: Button placeholder (h-10)
 * - line: Custom single line (specify height)
 */

const Skeleton = ({ 
  variant = 'text', 
  count = 1, 
  width, 
  height, 
  className = '' 
}) => {
  // Variant styles matching your components
  const variants = {
    text: 'h-4 rounded',           // Text line (16px)
    title: 'h-8 rounded',          // Title/heading (32px)
    avatar: 'w-12 h-12 rounded-full', // Avatar (48px circle)
    card: 'h-32 rounded-xl',       // Card (128px, using your xl radius)
    button: 'h-10 rounded-lg',     // Button (40px, using your lg radius)
    line: 'h-1 rounded',           // Thin line/divider
  };

  // Shimmer animation config
  const shimmerAnimation = {
    animate: {
      backgroundPosition: ['200% 0', '-200% 0'],
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  };

  // Custom sizing if provided
  const customStyle = {
    width: width || '100%',
    height: height || 'auto',
  };

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          {...shimmerAnimation}
          style={customStyle}
          className={`
            ${variants[variant]}
            bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800
            bg-[length:200%_100%]
            ${className}
          `}
          aria-hidden="true"
          role="status"
        />
      ))}
    </div>
  );
};

// Named exports for convenience
export const SkeletonText = (props) => <Skeleton variant="text" {...props} />;
export const SkeletonTitle = (props) => <Skeleton variant="title" {...props} />;
export const SkeletonAvatar = (props) => <Skeleton variant="avatar" {...props} />;
export const SkeletonCard = (props) => <Skeleton variant="card" {...props} />;
export const SkeletonButton = (props) => <Skeleton variant="button" {...props} />;

export default Skeleton;
