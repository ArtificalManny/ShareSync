// src/components/moderation/ReportButton.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// REPORT BUTTON — User content reporting component
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, X, AlertTriangle, Loader2, Check } from 'lucide-react';
import api from '../../api/client';

// Content types that can be reported
const CONTENT_TYPES = {
  user_profile: 'User Profile',
  project: 'Project',
  task: 'Task',
  comment: 'Comment',
  message: 'Message',
  file: 'File',
};

// Report reasons with icons
const REPORT_REASONS = [
  { value: 'dangerous_content', label: 'Dangerous or Violent Content', icon: '⚠️' },
  { value: 'spam', label: 'Spam or Scam', icon: '🚫' },
  { value: 'harassment', label: 'Harassment or Bullying', icon: '😠' },
  { value: 'hate_speech', label: 'Hate Speech', icon: '🚷' },
  { value: 'sexual_content', label: 'Sexual Content', icon: '🔞' },
  { value: 'impersonation', label: 'Impersonation', icon: '🎭' },
  { value: 'misinformation', label: 'False Information', icon: '❌' },
  { value: 'intellectual_property', label: 'Copyright/IP Violation', icon: '©️' },
  { value: 'other', label: 'Other', icon: '📝' },
];

export function ReportButton({
  contentType,
  contentId,
  contentOwnerId,
  className = '',
  variant = 'icon', // 'icon' | 'text' | 'full'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  const [additionalContext, setAdditionalContext] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setStatus('loading');
    setError(null);

    try {
      await api.post('/content-reports', {
        contentType,
        contentId,
        reportedUserId: contentOwnerId,
        reason: selectedReason,
        additionalContext: additionalContext || undefined,
      });

      setStatus('success');

      // Auto-close after success
      setTimeout(() => {
        setIsOpen(false);
        // Reset state after close animation
        setTimeout(() => {
          setStatus('idle');
          setSelectedReason(null);
          setAdditionalContext('');
        }, 300);
      }, 2000);
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.message || 'Failed to submit report');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset after animation
    setTimeout(() => {
      setStatus('idle');
      setSelectedReason(null);
      setAdditionalContext('');
      setError(null);
    }, 300);
  };

  // Render trigger button based on variant
  const renderTrigger = () => {
    switch (variant) {
      case 'text':
        return (
          <button
            onClick={() => setIsOpen(true)}
            className={`
              text-sm text-slate-400 hover:text-red-400
              transition-colors duration-200
              ${className}
            `}
          >
            Report
          </button>
        );
      case 'full':
        return (
          <button
            onClick={() => setIsOpen(true)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg
              text-sm text-slate-400 hover:text-red-400
              hover:bg-red-500/10 transition-all duration-200
              ${className}
            `}
          >
            <Flag className="w-4 h-4" />
            Report
          </button>
        );
      default: // 'icon'
        return (
          <button
            onClick={() => setIsOpen(true)}
            className={`
              p-2 rounded-lg text-slate-500
              hover:text-red-400 hover:bg-red-500/10
              transition-colors duration-200
              ${className}
            `}
            title="Report"
          >
            <Flag className="w-4 h-4" />
          </button>
        );
    }
  };

  return (
    <>
      {renderTrigger()}

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#12121a] rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Report {CONTENT_TYPES[contentType] || 'Content'}
                  </h3>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1 rounded-lg hover:bg-white/5 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                {status === 'success' ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-8 text-center"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Check className="w-8 h-8 text-emerald-400" />
                    </div>
                    <p className="text-white font-medium">Report Submitted</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Thank you for helping keep ShareSync safe.
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <p className="text-sm text-slate-400">
                      Why are you reporting this content?
                    </p>

                    {/* Reason Selection */}
                    <div className="space-y-2">
                      {REPORT_REASONS.map((reason) => (
                        <button
                          key={reason.value}
                          onClick={() => setSelectedReason(reason.value)}
                          className={`
                            w-full flex items-center gap-3 p-3 rounded-lg
                            text-left transition-colors duration-200
                            ${
                              selectedReason === reason.value
                                ? 'bg-purple-500/10 border border-purple-500/30 text-white'
                                : 'bg-white/[0.03] border border-transparent text-slate-300 hover:border-white/10'
                            }
                          `}
                        >
                          <span className="text-lg">{reason.icon}</span>
                          <span className="text-sm">{reason.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Additional Context */}
                    {selectedReason && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                      >
                        <label className="block text-sm text-slate-400 mb-2">
                          Additional context (optional)
                        </label>
                        <textarea
                          value={additionalContext}
                          onChange={(e) => setAdditionalContext(e.target.value)}
                          placeholder="Provide any additional details..."
                          rows={3}
                          maxLength={500}
                          className="
                            w-full px-3 py-2 rounded-lg resize-none
                            bg-white/[0.03] border border-white/[0.06]
                            text-white placeholder:text-slate-500
                            focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20
                            transition-all duration-200
                          "
                        />
                        <p className="text-xs text-slate-500 mt-1 text-right">
                          {additionalContext.length}/500
                        </p>
                      </motion.div>
                    )}

                    {/* Error */}
                    {error && (
                      <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg">
                        {error}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              {status !== 'success' && (
                <div className="flex justify-end gap-3 p-4 border-t border-white/[0.06]">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 rounded-lg text-slate-400 hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedReason || status === 'loading'}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg
                      font-medium transition-all duration-200
                      ${
                        !selectedReason || status === 'loading'
                          ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                          : 'bg-red-500 hover:bg-red-600 text-white'
                      }
                    `}
                  >
                    {status === 'loading' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Report'
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ReportButton;
