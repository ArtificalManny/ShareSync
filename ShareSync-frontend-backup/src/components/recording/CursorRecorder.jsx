/**
 * CursorRecorder.jsx
 * Record 10-second cursor movement clips
 * 
 * Features:
 * - Records last 10 seconds of cursor activity
 * - Rolling buffer (circular buffer)
 * - Captures cursor positions, activity, effects
 * - Can replay recorded clips
 * - Export to video format
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Circle, Square, Download, Share2, Play, Pause, RotateCcw } from 'lucide-react';
import { useCursorContext } from '../../context/CursorContext';
import useCursorStore from '../../store/cursorSlice';

// ============================================
// RECORDING CONSTANTS
// ============================================

const RECORDING_DURATION = 10000; // 10 seconds
const FRAME_RATE = 30; // 30 fps
const MAX_FRAMES = RECORDING_DURATION / (1000 / FRAME_RATE); // 300 frames

// ============================================
// CURSOR RECORDER
// ============================================

export function CursorRecorder({ enabled = true }) {
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedFrames, setRecordedFrames] = useState([]);
  
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  
  // UI state
  const [showControls, setShowControls] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  // Refs
  const framesBuffer = useRef([]);
  const recordingInterval = useRef(null);
  const playbackInterval = useRef(null);
  const startTime = useRef(0);
  
  // Context
  const { cursors } = useCursorContext();
  const settings = useCursorStore((state) => state.settings);

  // ============================================
  // RECORDING LOGIC
  // ============================================

  const captureFrame = useCallback(() => {
    if (!isRecording || isPaused) return;

    const frame = {
      timestamp: Date.now() - startTime.current,
      cursors: cursors.map((cursor) => ({
        userId: cursor.userId,
        userName: cursor.userName,
        x: cursor.x,
        y: cursor.y,
        activity: cursor.activity,
        color: cursor.color || '#8B5CF6',
        avatar: cursor.avatar,
      })),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };

    // Add to circular buffer
    framesBuffer.current.push(frame);

    // Keep only last 300 frames (10 seconds at 30fps)
    if (framesBuffer.current.length > MAX_FRAMES) {
      framesBuffer.current.shift();
    }

    // Update UI time
    setRecordingTime(framesBuffer.current.length * (1000 / FRAME_RATE));
  }, [isRecording, isPaused, cursors]);

  // ============================================
  // START/STOP RECORDING
  // ============================================

  const startRecording = useCallback(() => {
    console.log('🎥 Starting cursor recording...');
    
    setIsRecording(true);
    setIsPaused(false);
    startTime.current = Date.now();
    framesBuffer.current = [];
    setRecordingTime(0);

    // Capture frames at 30fps
    recordingInterval.current = setInterval(() => {
      captureFrame();
    }, 1000 / FRAME_RATE);
  }, [captureFrame]);

  const stopRecording = useCallback(() => {
    console.log('🎥 Stopping cursor recording...');
    
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }

    setIsRecording(false);
    setIsPaused(false);
    
    // Save frames
    setRecordedFrames([...framesBuffer.current]);
    
    console.log(`✅ Recorded ${framesBuffer.current.length} frames`);
  }, []);

  const pauseRecording = useCallback(() => {
    setIsPaused(!isPaused);
  }, [isPaused]);

  const clearRecording = useCallback(() => {
    framesBuffer.current = [];
    setRecordedFrames([]);
    setRecordingTime(0);
    setCurrentFrame(0);
    setIsPlaying(false);
  }, []);

  // ============================================
  // PLAYBACK LOGIC
  // ============================================

  const playRecording = useCallback(() => {
    if (recordedFrames.length === 0) return;

    console.log('▶️ Playing recording...');
    setIsPlaying(true);
    setCurrentFrame(0);

    let frameIndex = 0;

    playbackInterval.current = setInterval(() => {
      frameIndex++;
      
      if (frameIndex >= recordedFrames.length) {
        // End of recording
        clearInterval(playbackInterval.current);
        playbackInterval.current = null;
        setIsPlaying(false);
        setCurrentFrame(0);
      } else {
        setCurrentFrame(frameIndex);
      }
    }, 1000 / FRAME_RATE);
  }, [recordedFrames]);

  const pausePlayback = useCallback(() => {
    if (playbackInterval.current) {
      clearInterval(playbackInterval.current);
      playbackInterval.current = null;
    }
    setIsPlaying(false);
  }, []);

  const resetPlayback = useCallback(() => {
    pausePlayback();
    setCurrentFrame(0);
  }, [pausePlayback]);

  // ============================================
  // CLEANUP
  // ============================================

  useEffect(() => {
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
      if (playbackInterval.current) {
        clearInterval(playbackInterval.current);
      }
    };
  }, []);

  // ============================================
  // KEYBOARD SHORTCUTS
  // ============================================

  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (e) => {
      // Cmd/Ctrl + Shift + R = Start/Stop recording
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'r') {
        e.preventDefault();
        if (isRecording) {
          stopRecording();
        } else {
          startRecording();
        }
      }

      // Cmd/Ctrl + Shift + P = Pause recording
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        if (isRecording) {
          pauseRecording();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [enabled, isRecording, startRecording, stopRecording, pauseRecording]);

  // ============================================
  // RENDER
  // ============================================

  if (!enabled) return null;

  return (
    <>
      {/* Recording controls (floating button) */}
      <div
        className="cursor-recorder-controls"
        style={{
          position: 'fixed',
          bottom: 80,
          left: 24,
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Main record button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={isRecording ? stopRecording : startRecording}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: isRecording
              ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
              : 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            position: 'relative',
          }}
        >
          {isRecording ? (
            <Square size={20} color="white" fill="white" />
          ) : (
            <Circle size={20} color="white" fill="white" />
          )}
          
          {isRecording && (
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#EF4444',
                border: '2px solid white',
              }}
            />
          )}
        </motion.button>

        {/* Recording time indicator */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              style={{
                padding: '6px 12px',
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(8px)',
                borderRadius: 999,
                color: 'white',
                fontSize: 11,
                fontWeight: 600,
                fontFamily: 'monospace',
                textAlign: 'center',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              {(recordingTime / 1000).toFixed(1)}s / 10s
            </motion.div>
          )}
        </AnimatePresence>

        {/* Extended controls */}
        <AnimatePresence>
          {showControls && !isRecording && recordedFrames.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {/* Play/Pause */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={isPlaying ? pausePlayback : playRecording}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                }}
              >
                {isPlaying ? (
                  <Pause size={20} color="white" fill="white" />
                ) : (
                  <Play size={20} color="white" fill="white" />
                )}
              </motion.button>

              {/* Reset */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetPlayback}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                }}
              >
                <RotateCcw size={20} color="white" />
              </motion.button>

              {/* Clear */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearRecording}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                }}
              >
                <Download size={20} color="white" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Playback overlay */}
      {isPlaying && recordedFrames[currentFrame] && (
        <PlaybackOverlay
          frame={recordedFrames[currentFrame]}
          totalFrames={recordedFrames.length}
          currentFrame={currentFrame}
          settings={settings}
        />
      )}

      {/* Recording hint */}
      <AnimatePresence>
        {!isRecording && recordedFrames.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed',
              bottom: 150,
              left: 24,
              padding: '8px 12px',
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(8px)',
              borderRadius: 8,
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: 11,
              fontWeight: 500,
              border: '1px solid rgba(139, 92, 246, 0.3)',
              maxWidth: 200,
              zIndex: 9999,
            }}
          >
            Press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>⌘⇧R</kbd> to record
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================
// PLAYBACK OVERLAY
// ============================================

function PlaybackOverlay({ frame, totalFrames, currentFrame, settings }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9998,
      }}
    >
      {/* Playback cursors */}
      {frame.cursors.map((cursor) => (
        <motion.div
          key={cursor.userId}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          style={{
            position: 'absolute',
            left: `${cursor.x}%`,
            top: `${cursor.y}%`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        >
          {/* Cursor dot */}
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: cursor.color,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            }}
          />
          
          {/* Name label */}
          {settings.showNames && (
            <div
              style={{
                position: 'absolute',
                top: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '4px 8px',
                background: 'rgba(15, 23, 42, 0.95)',
                color: 'white',
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 6,
                whiteSpace: 'nowrap',
                border: `1px solid ${cursor.color}`,
              }}
            >
              {cursor.userName}
            </div>
          )}
        </motion.div>
      ))}

      {/* Progress bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          maxWidth: 600,
          height: 4,
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${(currentFrame / totalFrames) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #8B5CF6 0%, #EC4899 100%)',
            transition: 'width 0.1s linear',
          }}
        />
      </div>
    </div>
  );
}

export default CursorRecorder;