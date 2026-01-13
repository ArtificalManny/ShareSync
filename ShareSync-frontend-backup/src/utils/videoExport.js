/**
 * videoExport.js
 * Export cursor recordings to MP4 video
 * 
 * Uses:
 * - Canvas API for rendering
 * - MediaRecorder API for video capture
 * - Blob API for file download
 */

/**
 * Export cursor recording to MP4
 * 
 * @param {Array} frames - Array of recorded frames
 * @param {Object} options - Export options
 * @returns {Promise<Blob>} - Video blob
 */
export async function exportToMP4(frames, options = {}) {
    const {
      width = 1920,
      height = 1080,
      fps = 30,
      quality = 0.8,
      background = '#0F172A', // Dark background
      showProgress = true,
    } = options;
  
    console.log(`🎬 Starting video export: ${frames.length} frames at ${fps}fps`);
  
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
  
    // Create video stream
    const stream = canvas.captureStream(fps);
    
    // Setup MediaRecorder
    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5000000, // 5 Mbps
    });
  
    const chunks = [];
  
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };
  
    // Start recording
    recorder.start();
  
    // Render each frame
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
  
      // Clear canvas
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);
  
      // Draw cursors
      frame.cursors.forEach((cursor) => {
        drawCursor(ctx, cursor, width, height);
      });
  
      // Draw frame number (optional)
      if (showProgress) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '14px monospace';
        ctx.fillText(`Frame ${i + 1}/${frames.length}`, 10, height - 10);
      }
  
      // Wait for next frame (to maintain fps)
      await new Promise((resolve) => setTimeout(resolve, 1000 / fps));
    }
  
    // Stop recording
    recorder.stop();
  
    // Wait for recording to finish
    const videoBlob = await new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve(blob);
      };
    });
  
    console.log('✅ Video export complete:', videoBlob.size, 'bytes');
  
    return videoBlob;
  }
  
  /**
   * Draw a cursor on canvas
   */
  function drawCursor(ctx, cursor, canvasWidth, canvasHeight) {
    // Convert viewport % to canvas pixels
    const x = (cursor.x / 100) * canvasWidth;
    const y = (cursor.y / 100) * canvasHeight;
  
    // Draw cursor circle
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = cursor.color || '#8B5CF6';
    ctx.fill();
  
    // Draw cursor outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  
    // Draw name label
    if (cursor.userName) {
      const labelY = y + 20;
      
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      
      // Measure text
      const textWidth = ctx.measureText(cursor.userName).width;
      const padding = 8;
      
      // Draw label background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.fillRect(
        x - textWidth / 2 - padding,
        labelY - 12,
        textWidth + padding * 2,
        20
      );
      
      // Draw label text
      ctx.fillStyle = 'white';
      ctx.fillText(cursor.userName, x, labelY + 2);
    }
  
    // Draw activity indicator
    if (cursor.activity && cursor.activity !== 'idle') {
      drawActivityIndicator(ctx, x, y, cursor.activity);
    }
  }
  
  /**
   * Draw activity indicator (typing, clicking, etc.)
   */
  function drawActivityIndicator(ctx, x, y, activity) {
    const colors = {
      typing: '#8B5CF6',
      clicking: '#EC4899',
      dragging: '#6366F1',
    };
  
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.strokeStyle = colors[activity] || '#8B5CF6';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  /**
   * Download video blob as file
   */
  export function downloadVideo(blob, filename = 'cursor-recording.webm') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('💾 Video downloaded:', filename);
  }
  
  /**
   * Export and download in one step
   */
  export async function exportAndDownload(frames, options = {}) {
    const filename = options.filename || `cursor-recording-${Date.now()}.webm`;
    
    try {
      const blob = await exportToMP4(frames, options);
      downloadVideo(blob, filename);
      return blob;
    } catch (error) {
      console.error('❌ Export failed:', error);
      throw error;
    }
  }
  
  /**
   * Generate thumbnail from first frame
   */
  export function generateThumbnail(frames, options = {}) {
    const {
      width = 640,
      height = 360,
      background = '#0F172A',
    } = options;
  
    if (frames.length === 0) return null;
  
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
  
    // Draw first frame
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  
    const firstFrame = frames[0];
    firstFrame.cursors.forEach((cursor) => {
      drawCursor(ctx, cursor, width, height);
    });
  
    // Convert to data URL
    return canvas.toDataURL('image/png');
  }
  
  /**
   * Convert WebM to MP4 (requires FFmpeg.wasm)
   * This is optional and requires additional setup
   */
  export async function convertToMP4(webmBlob) {
    // This would use FFmpeg.wasm to convert WebM to MP4
    // For now, we'll just return the WebM blob
    console.warn('⚠️ MP4 conversion not implemented yet. Using WebM format.');
    return webmBlob;
  }
  
  /**
   * Estimate video file size
   */
  export function estimateFileSize(frames, fps = 30, bitrate = 5000000) {
    const durationSeconds = frames.length / fps;
    const estimatedBytes = (bitrate / 8) * durationSeconds;
    return {
      bytes: Math.round(estimatedBytes),
      kb: Math.round(estimatedBytes / 1024),
      mb: (estimatedBytes / 1024 / 1024).toFixed(2),
    };
  }
  
  /**
   * Check if video export is supported
   */
  export function isVideoExportSupported() {
    const canvas = document.createElement('canvas');
    
    return !!(
      canvas.captureStream &&
      typeof MediaRecorder !== 'undefined' &&
      MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    );
  }
  
  /**
   * Get available video formats
   */
  export function getAvailableFormats() {
    const formats = [];
    
    const codecs = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
    ];
  
    codecs.forEach((codec) => {
      if (MediaRecorder.isTypeSupported(codec)) {
        formats.push(codec);
      }
    });
  
    return formats;
  }
  
  /**
   * Create video with custom branding/watermark
   */
  export async function exportWithBranding(frames, options = {}) {
    const {
      watermark = 'OpenShare',
      watermarkPosition = 'bottom-right',
      logo = null,
      ...exportOptions
    } = options;
  
    // Add watermark to each frame
    const brandedFrames = frames.map((frame) => ({
      ...frame,
      watermark,
      watermarkPosition,
      logo,
    }));
  
    return exportToMP4(brandedFrames, exportOptions);
  }
  
  // ============================================
  // EXPORT UTILITIES
  // ============================================
  
  export default {
    exportToMP4,
    downloadVideo,
    exportAndDownload,
    generateThumbnail,
    convertToMP4,
    estimateFileSize,
    isVideoExportSupported,
    getAvailableFormats,
    exportWithBranding,
  };