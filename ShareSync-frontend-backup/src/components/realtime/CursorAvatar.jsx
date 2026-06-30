/**
 * CursorAvatar.jsx
 * Avatar photo bubble that appears next to cursor
 * 
 * Features:
 * - User photo or initials fallback
 * - Name tooltip on hover
 * - Pulses with activity
 * - Smooth animations
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';

function CursorAvatar({ userName, userAvatar, activity, isFlashing }) {
  const [showTooltip, setShowTooltip] = useState(false);

  // ============================================
  // INITIALS FALLBACK
  // ============================================

  const getInitials = (name) => {
    if (!name) return '?';
    
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // ============================================
  // ACTIVITY BORDER COLOR
  // ============================================

  const getBorderColor = () => {
    switch (activity) {
      case 'typing':
        return '#8B5CF6'; // Purple
      case 'clicking':
        return '#EC4899'; // Pink
      case 'dragging':
        return '#6366F1'; // Indigo
      default:
        return '#94A3B8'; // Muted
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div
      className="cursor-avatar-wrapper"
      style={{
        position: 'absolute',
        top: -12,
        left: 20,
        pointerEvents: 'auto', // Allow hover
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Avatar bubble */}
      <motion.div
        className="cursor-avatar"
        animate={{
          scale: isFlashing ? 1.2 : activity !== 'idle' ? 1.05 : 1,
        }}
        transition={{
          duration: 0.2,
          ease: 'easeOut',
        }}
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: `2px solid ${getBorderColor()}`,
          background: userAvatar ? 'transparent' : '#1E293B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          boxShadow: `0 0 8px ${getBorderColor()}`,
          position: 'relative',
        }}
      >
        {/* Photo or initials */}
        {userAvatar ? (
          <img
            src={userAvatar}
            alt={userName}
            style={{
              width: 'Available',
              height: 'Available',
              objectFit: 'cover',
            }}
          />
        ) : (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'white',
            }}
          >
            {getInitials(userName)}
          </span>
        )}

        {/* Activity indicator dot */}
        {activity !== 'idle' && (
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
            }}
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: getBorderColor(),
              border: '2px solid white',
            }}
          />
        )}
      </motion.div>

      {/* Name tooltip */}
      {showTooltip && (
        <motion.div
          className="cursor-tooltip"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'absolute',
            top: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '6px 12px',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: 8,
            color: 'white',
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            zIndex: 10000,
            pointerEvents: 'none',
          }}
        >
          {userName}
          
          {/* Activity label */}
          {activity !== 'idle' && (
            <span
              style={{
                marginLeft: 8,
                color: getBorderColor(),
                fontSize: 11,
              }}
            >
              • {activity}
            </span>
          )}

          {/* Tooltip arrow */}
          <div
            style={{
              position: 'absolute',
              top: -4,
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: 8,
              height: 8,
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRight: 'none',
              borderBottom: 'none',
            }}
          />
        </motion.div>
      )}
    </div>
  );
}

export default CursorAvatar;