/**
 * FocusTogether.jsx
 * "Click to follow" cursor feature
 * 
 * Allows users to click on another user's cursor and automatically
 * follow them around for 10 seconds (or until manually stopped)
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Users } from 'lucide-react';
import { useCursorContext } from '../../context/CursorContext';
import { useFocusTogether } from '../../hooks/useCursor';

function FocusTogether() {
  const { cursors } = useCursorContext();
  const { focusOnUser } = useFocusTogether();
  
  const [focusedUserId, setFocusedUserId] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [showCursorList, setShowCursorList] = useState(false);
  
  const followTimer = useRef(null);
  const countdownTimer = useRef(null);

  // Listen for focus target events from backend
  useEffect(() => {
    const handleFocusTarget = (event) => {
      const { userId, x, y } = event.detail;
      
      console.log('👀 Focus target received:', userId, x, y);
      
      // Smooth scroll to target position
      smoothScrollTo(x, y);
    };

    window.addEventListener('cursor:focus', handleFocusTarget);

    return () => {
      window.removeEventListener('cursor:focus', handleFocusTarget);
    };
  }, []);

  // Smooth scroll to position
  const smoothScrollTo = (x, y) => {
    const targetX = (x / 100) * window.innerWidth;
    const targetY = (y / 100) * window.innerHeight;

    window.scrollTo({
      left: targetX - window.innerWidth / 2,
      top: targetY - window.innerHeight / 2,
      behavior: 'smooth',
    });
  };

  // Start following a user
  const startFollowing = (userId) => {
    console.log('👀 Starting to follow:', userId);
    
    setFocusedUserId(userId);
    setIsFollowing(true);
    setTimeRemaining(10);
    
    // Request focus from backend
    focusOnUser(userId);

    // Auto-update focus every 2 seconds
    followTimer.current = setInterval(() => {
      focusOnUser(userId);
    }, 2000);

    // Countdown timer
    countdownTimer.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          stopFollowing();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Stop following
  const stopFollowing = () => {
    console.log('👁️ Stopped following');
    
    setIsFollowing(false);
    setFocusedUserId(null);
    setTimeRemaining(10);

    if (followTimer.current) {
      clearInterval(followTimer.current);
    }
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (followTimer.current) clearInterval(followTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, []);

  // Get focused user info
  const focusedUser = cursors.find((c) => c.userId === focusedUserId);

  return (
    <>
      {/* Focus Together Button (bottom-left) */}
      <motion.button
        onClick={() => setShowCursorList(!showCursorList)}
        className="focus-together-toggle"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: isFollowing
            ? 'linear-gradient(135deg, #EC4899, #8B5CF6)'
            : 'linear-gradient(135deg, #1E293B, #334155)',
          border: '2px solid rgba(139, 92, 246, 0.3)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
        }}
      >
        {isFollowing ? (
          <Eye className="w-6 h-6" />
        ) : (
          <Users className="w-6 h-6" />
        )}
        
        {/* Online count badge */}
        {cursors.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: '#10B981',
              color: 'white',
              fontSize: 11,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #0F172A',
            }}
          >
            {cursors.length}
          </div>
        )}
      </motion.button>

      {/* Following indicator */}
      <AnimatePresence>
        {isFollowing && focusedUser && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            style={{
              position: 'fixed',
              bottom: 96,
              left: 24,
              padding: '12px 16px',
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: 12,
              color: 'white',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {focusedUser.userName?.slice(0, 2).toUpperCase() || '?'}
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                Following {focusedUser.userName}
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>
                {timeRemaining}s remaining
              </div>
            </div>

            <button
              onClick={stopFollowing}
              style={{
                padding: '4px 8px',
                background: 'transparent',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: 6,
                color: '#94A3B8',
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(148, 163, 184, 0.1)';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#94A3B8';
              }}
            >
              Stop
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cursor list panel */}
      <AnimatePresence>
        {showCursorList && cursors.length > 0 && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            style={{
              position: 'fixed',
              bottom: isFollowing ? 180 : 96,
              left: 24,
              width: 280,
              maxHeight: 400,
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: 16,
              color: 'white',
              zIndex: 1000,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                fontWeight: 600,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Online Now ({cursors.length})</span>
              <button
                onClick={() => setShowCursorList(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  fontSize: 18,
                  padding: 4,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {cursors.map((cursor) => (
                <motion.button
                  key={cursor.userId}
                  onClick={() => {
                    if (focusedUserId === cursor.userId) {
                      stopFollowing();
                    } else {
                      startFollowing(cursor.userId);
                    }
                  }}
                  whileHover={{ background: 'rgba(139, 92, 246, 0.1)' }}
                  style={{
                    width: 'Available',
                    padding: '12px 16px',
                    background:
                      focusedUserId === cursor.userId
                        ? 'rgba(139, 92, 246, 0.2)'
                        : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid rgba(148, 163, 184, 0.05)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'all 150ms',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background:
                        cursor.activity === 'typing'
                          ? '#8B5CF6'
                          : cursor.activity === 'clicking'
                          ? '#EC4899'
                          : '#6366F1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {cursor.userName?.slice(0, 2).toUpperCase() || '?'}
                  </div>

                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {cursor.userName}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#94A3B8',
                        textTransform: 'capitalize',
                      }}
                    >
                      {cursor.activity || 'idle'}
                    </div>
                  </div>

                  {focusedUserId === cursor.userId && (
                    <Eye className="w-4 h-4" style={{ color: '#8B5CF6' }} />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default FocusTogether;