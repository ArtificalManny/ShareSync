import { toast } from "../ui/Toast";
/**
 * ShareCursorClip.jsx
 * Share cursor recordings to social media
 * 
 * Features:
 * - Share to Twitter/X
 * - Share to TikTok
 * - Share to Instagram (story)
 * - Copy link
 * - Generate shareable preview
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2,
  Twitter,
  Instagram,
  Facebook,
  Link2,
  Download,
  Check,
  Copy,
  Video,
  Sparkles,
  X,
} from 'lucide-react';
import { exportToMP4, generateThumbnail, estimateFileSize } from '../../utils/videoExport';

// ============================================
// SHARE CURSOR CLIP
// ============================================

export function ShareCursorClip({ frames, onClose, isOpen }) {
  const [thumbnail, setThumbnail] = useState(null);
  const [fileSize, setFileSize] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [videoBlob, setVideoBlob] = useState(null);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // ============================================
  // GENERATE PREVIEW
  // ============================================

  useEffect(() => {
    if (frames && frames.length > 0) {
      // Generate thumbnail
      const thumb = generateThumbnail(frames, {
        width: 640,
        height: 360,
      });
      setThumbnail(thumb);

      // Estimate file size
      const size = estimateFileSize(frames);
      setFileSize(size);
    }
  }, [frames]);

  // ============================================
  // EXPORT VIDEO
  // ============================================

  const handleExport = async () => {
    if (!frames || frames.length === 0) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Export with progress updates
      const blob = await exportToMP4(frames, {
        width: 1920,
        height: 1080,
        fps: 30,
        quality: 0.8,
        showProgress: true,
      });

      setVideoBlob(blob);
      setExportProgress(100);

      // Generate shareable URL (would be uploaded to server in production)
      const url = URL.createObjectURL(blob);
      setShareUrl(url);

      console.log('✅ Video exported successfully');
    } catch (error) {
      console.error('❌ Export failed:', error);
      toast.error('Export failed', { description: 'Please try again', duration: 3000 });
    } finally {
      setIsExporting(false);
    }
  };

  // ============================================
  // SHARE FUNCTIONS
  // ============================================

  const shareToTwitter = () => {
    const text = encodeURIComponent('Check out my cursor recording on OpenShare! 🎨✨');
    const url = encodeURIComponent(shareUrl || window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(shareUrl || window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareToInstagram = () => {
    // Instagram doesn't support direct sharing via URL
    // Would need to download video and open Instagram app
    toast.info('Manual share required', { description: 'Download and share to Instagram Stories', duration: 4000 });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const downloadVideo = () => {
    if (!videoBlob) return;

    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cursor-recording-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ============================================
  // RENDER
  // ============================================

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001,
          padding: 20,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            borderRadius: 24,
            padding: 32,
            maxWidth: 600,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Share2 size={20} color="white" />
              </div>
              <div>
                <h2 style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: 0 }}>
                  Share Cursor Recording
                </h2>
                <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 13, margin: 0 }}>
                  {frames?.length || 0} frames · {fileSize?.mb || 0} MB
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: 8,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.background = 'rgba(255, 255, 255, 0.2)')}
              onMouseLeave={(e) => (e.target.style.background = 'rgba(255, 255, 255, 0.1)')}
            >
              <X size={16} color="white" />
            </button>
          </div>

          {/* Video preview */}
          {thumbnail && (
            <div
              style={{
                width: '100%',
                height: 280,
                borderRadius: 16,
                overflow: 'hidden',
                marginBottom: 24,
                position: 'relative',
                background: '#0F172A',
              }}
            >
              <img
                src={thumbnail}
                alt="Video preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              
              {/* Play icon overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'rgba(139, 92, 246, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Video size={28} color="white" />
              </div>

              {/* Duration badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  right: 12,
                  padding: '4px 12px',
                  background: 'rgba(0, 0, 0, 0.8)',
                  borderRadius: 6,
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {((frames?.length || 0) / 30).toFixed(1)}s
              </div>
            </div>
          )}

          {/* Export button */}
          {!videoBlob && !isExporting && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExport}
              style={{
                width: '100%',
                padding: 16,
                background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                border: 'none',
                borderRadius: 12,
                color: 'white',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 24,
              }}
            >
              <Sparkles size={20} />
              Export Video
            </motion.button>
          )}

          {/* Export progress */}
          {isExporting && (
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 14 }}>
                  Exporting video...
                </span>
                <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>
                  {exportProgress}%
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: 8,
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${exportProgress}%` }}
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #8B5CF6 0%, #EC4899 100%)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Share options */}
          {videoBlob && (
            <>
              <div style={{ marginBottom: 16 }}>
                <h3
                  style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 12,
                  }}
                >
                  Share to
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  <ShareButton icon={Twitter} label="Twitter" onClick={shareToTwitter} color="#1DA1F2" />
                  <ShareButton icon={Facebook} label="Facebook" onClick={shareToFacebook} color="#1877F2" />
                  <ShareButton icon={Instagram} label="Instagram" onClick={shareToInstagram} color="#E4405F" />
                  <ShareButton
                    icon={copied ? Check : Link2}
                    label={copied ? 'Copied!' : 'Copy Link'}
                    onClick={copyLink}
                    color="#8B5CF6"
                  />
                </div>
              </div>

              {/* Download button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={downloadVideo}
                style={{
                  width: '100%',
                  padding: 14,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 12,
                  color: 'white',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Download size={18} />
                Download Video
              </motion.button>
            </>
          )}

          {/* Tips */}
          <div
            style={{
              marginTop: 24,
              padding: 16,
              background: 'rgba(139, 92, 246, 0.1)',
              borderRadius: 12,
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              💡 <strong>Pro tip:</strong> Cursor recordings are perfect for showing off cool
              collaboration moments, teaching workflows, or just having fun!
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// SHARE BUTTON
// ============================================

function ShareButton({ icon: Icon, label, onClick, color }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        padding: '16px 12px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${color}33`,
        borderRadius: 12,
        color: 'white',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `${color}22`;
        e.currentTarget.style.borderColor = `${color}66`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
        e.currentTarget.style.borderColor = `${color}33`;
      }}
    >
      <Icon size={20} color={color} />
      <span style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
    </motion.button>
  );
}

export default ShareCursorClip;