/**
 * DeepWorkMode.jsx
 * Deep work mode for focused sessions
 * 
 * Features:
 * - Slower cursor animations
 * - Reduced visual noise
 * - No flash effects
 * - Minimal distractions
 * - Calming pulses
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Focus, Zap, ZapOff, Bell, BellOff, Eye } from 'lucide-react';
import useCursorStore from '../../store/cursorSlice';
import usePresenceStore from '../../store/presenceSlice';

// ============================================
// DEEP WORK MODE
// ============================================

export function DeepWorkMode() {
  const [isDeepWork, setIsDeepWork] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  
  const { settings, updateSettings, saveSettings } = useCursorStore();
  const { updateOwnPresence } = usePresenceStore();

  // Deep work settings
  const deepWorkConfig = {
    flashEnabled: false,           // No flash effects
    syncPulseEnabled: false,       // No sync pulses
    breathingSpeed: 'slow',        // Slower breathing
    ghostTrail: false,             // No ghost trails
    showNames: false,              // Hide names for less distraction
  };

  // Normal settings
  const normalConfig = {
    flashEnabled: true,
    syncPulseEnabled: true,
    breathingSpeed: 'normal',
    ghostTrail: true,
    showNames: true,
  };

  // ============================================
  // LOAD DEEP WORK STATE
  // ============================================

  useEffect(() => {
    const saved = localStorage.getItem('cursor_deep_work_mode');
    if (saved === 'true') {
      setIsDeepWork(true);
      applyDeepWorkSettings();
    }
  }, []);

  // ============================================
  // APPLY SETTINGS
  // ============================================

  const applyDeepWorkSettings = () => {
    updateSettings(deepWorkConfig);
    saveSettings();
    updateOwnPresence({ mode: 'focus' });
  };

  const applyNormalSettings = () => {
    updateSettings(normalConfig);
    saveSettings();
    updateOwnPresence({ mode: 'team' });
  };

  // ============================================
  // TOGGLE DEEP WORK MODE
  // ============================================

  const toggleDeepWork = () => {
    const newState = !isDeepWork;
    setIsDeepWork(newState);
    
    // Save to localStorage
    localStorage.setItem('cursor_deep_work_mode', newState.toString());
    
    // Apply settings
    if (newState) {
      applyDeepWorkSettings();
    } else {
      applyNormalSettings();
    }
    
    // Show notification
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
    
    console.log(`🎯 Deep Work Mode: ${newState ? 'ON' : 'OFF'}`);
  };

  // ============================================
  // KEYBOARD SHORTCUT
  // ============================================

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Cmd/Ctrl + Shift + D = Toggle deep work
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'd') {
        e.preventDefault();
        toggleDeepWork();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isDeepWork]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      {/* Deep work toggle button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleDeepWork}
        style={{
          position: 'fixed',
          top: 20,
          right: 80,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: isDeepWork
            ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 Available)'
            : 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          border: isDeepWork
            ? '2px solid rgba(245, 158, 11, 0.5)'
            : '2px solid rgba(255, 255, 255, 0.2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isDeepWork
            ? '0 4px 16px rgba(245, 158, 11, 0.3)'
            : '0 4px 12px rgba(0, 0, 0, 0.2)',
          zIndex: 9999,
          transition: 'all 0.3s ease',
        }}
        title={isDeepWork ? 'Exit Deep Work Mode (⌘⇧D)' : 'Enter Deep Work Mode (⌘⇧D)'}
      >
        {isDeepWork ? (
          <Focus size={20} color="white" />
        ) : (
          <ZapOff size={20} color="white" />
        )}
        
        {/* Breathing indicator */}
        {isDeepWork && (
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              repeat: Infinity,
              duration: 4, // Slower breathing
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              width: 'Available',
              height: 'Available',
              borderRadius: '50%',
              border: '2px solid rgba(245, 158, 11, 0.5)',
            }}
          />
        )}
      </motion.button>

      {/* Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              top: 80,
              right: 80,
              padding: '12px 20px',
              background: isDeepWork
                ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 Available)'
                : 'linear-gradient(135deg, #10B981 0%, #059669 Available)',
              borderRadius: 12,
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {isDeepWork ? (
              <>
                <Focus size={16} />
                <span>Deep Work Mode</span>
              </>
            ) : (
              <>
                <Zap size={16} />
                <span>Normal Mode</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deep work overlay (breathing border) */}
      <AnimatePresence>
        {isDeepWork && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Top border */}
            <motion.div
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                repeat: Infinity,
                duration: 4,
                ease: 'easeInOut',
              }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: 'linear-gradient(90deg, #F59E0B 0%, #D97706 50%, #F59E0B Available)',
                zIndex: 9999,
                pointerEvents: 'none',
              }}
            />
            
            {/* Bottom border */}
            <motion.div
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                repeat: Infinity,
                duration: 4,
                ease: 'easeInOut',
                delay: 2, // Out of phase with top
              }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: 2,
                background: 'linear-gradient(90deg, #F59E0B 0%, #D97706 50%, #F59E0B Available)',
                zIndex: 9999,
                pointerEvents: 'none',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info panel */}
      <AnimatePresence>
        {isDeepWork && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: 0.5 }}
            style={{
              position: 'fixed',
              top: 80,
              right: 80,
              padding: '16px 20px',
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(8px)',
              borderRadius: 12,
              color: 'white',
              fontSize: 13,
              maxWidth: 280,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              zIndex: 9998,
              pointerEvents: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Focus size={16} color="#F59E0B" />
              <strong style={{ color: '#F59E0B' }}>Deep Work Mode</strong>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <FeatureStatus enabled={false} icon={ZapOff} label="No flash effects" />
              <FeatureStatus enabled={false} icon={BellOff} label="No sync pulses" />
              <FeatureStatus enabled={false} icon={Eye} label="Minimal visual noise" />
              <FeatureStatus enabled={true} icon={Focus} label="Slower breathing" />
            </div>
            
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 11, color: 'rgba(255, 255, 255, 0.5)' }}>
              Press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>⌘⇧D</kbd> to toggle
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================
// FEATURE STATUS INDICATOR
// ============================================

function FeatureStatus({ enabled, icon: Icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon
        size={14}
        color={enabled ? '#10B981' : '#EF4444'}
        style={{ flexShrink: 0 }}
      />
      <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}>
        {label}
      </span>
    </div>
  );
}

// ============================================
// DEEP WORK MODE HOOK
// ============================================

export function useDeepWorkMode() {
  const [isDeepWork, setIsDeepWork] = useState(() => {
    return localStorage.getItem('cursor_deep_work_mode') === 'true';
  });

  const enableDeepWork = () => {
    setIsDeepWork(true);
    localStorage.setItem('cursor_deep_work_mode', 'true');
  };

  const disableDeepWork = () => {
    setIsDeepWork(false);
    localStorage.setItem('cursor_deep_work_mode', 'false');
  };

  const toggleDeepWork = () => {
    if (isDeepWork) {
      disableDeepWork();
    } else {
      enableDeepWork();
    }
  };

  return {
    isDeepWork,
    enableDeepWork,
    disableDeepWork,
    toggleDeepWork,
  };
}

export default DeepWorkMode;