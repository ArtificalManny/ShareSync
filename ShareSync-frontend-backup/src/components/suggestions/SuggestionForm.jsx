// src/components/suggestions/SuggestionForm.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Submit a suggestion with optional file attachments from device
// Uploads go through /api/uploads/file (moderation pipeline)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Lightbulb, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from '../ui/toast';
import client from '../../api/client';

// ─── Upload helper ──────────────────────────────────────────────────────────

async function uploadFileToServer(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await client.post('/uploads/file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const data = res.data;
  if (data?.ok === false) {
    throw new Error(data?.moderation?.reason || 'Upload blocked by moderation');
  }

  const url = data?.url || data?.file?.url || data?.data?.url;
  if (!url) throw new Error('Upload succeeded but no URL returned');
  return url;
}

// ─── Main Component ─────────────────────────────────────────────────────────

const SuggestionForm = ({
  projectId,
  context = 'general',
  targetId = null,
  targetName = null,
  onSubmit,
  onClose,
}) => {
  const [suggestion, setSuggestion] = useState({
    title: '',
    content: '',
    context,
    targetId,
    targetName,
  });
  const [submitting, setSubmitting] = useState(false);

  // Attachment state: array of { file, preview, url, uploading, error }
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  // ─── File selection + immediate upload ──────────────────────────────

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Only image files are supported', variant: 'error' });
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'File must be under 10MB', variant: 'error' });
        continue;
      }

      const preview = URL.createObjectURL(file);

      setAttachments((prev) => [
        ...prev,
        { file, preview, url: null, uploading: true, error: null },
      ]);

      // Upload immediately through moderation pipeline
      uploadFileToServer(file)
        .then((url) => {
          setAttachments((prev) =>
            prev.map((a) =>
              a.preview === preview ? { ...a, url, uploading: false } : a
            )
          );
        })
        .catch((err) => {
          const errorMsg =
            err?.response?.data?.message || err?.message || 'Upload failed';

          setAttachments((prev) =>
            prev.map((a) =>
              a.preview === preview
                ? { ...a, uploading: false, error: errorMsg }
                : a
            )
          );

          toast({ title: errorMsg, variant: 'error' });
        });
    }

    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (preview) => {
    setAttachments((prev) => {
      URL.revokeObjectURL(preview);
      return prev.filter((a) => a.preview !== preview);
    });
  };

  // ─── Submit ─────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!suggestion.title.trim() || !suggestion.content.trim()) {
      toast({ title: 'Fill in all fields', variant: 'error' });
      return;
    }

    if (attachments.some((a) => a.uploading)) {
      toast({ title: 'Please wait for uploads to finish', variant: 'error' });
      return;
    }

    setSubmitting(true);

    try {
      const attachmentUrls = attachments
        .filter((a) => a.url && !a.error)
        .map((a) => a.url);

      await onSubmit?.({
        ...suggestion,
        attachments: attachmentUrls,
        projectId,
        submittedAt: new Date(),
      });

      toast({
        title: 'Suggestion submitted!',
        description: 'Project members will review it',
        variant: 'success',
      });

      onClose?.();
    } catch (error) {
      toast({
        title: error?.message || 'Failed to submit suggestion',
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const contextOptions = [
    { value: 'general', label: 'General', description: 'Overall project feedback' },
    { value: 'task', label: 'Task Improvement', description: 'Specific workflow idea' },
    { value: 'announcement', label: 'Feedback', description: 'Thoughts on recent news' },
    { value: 'feature', label: 'Feature Request', description: 'New capability idea' },
  ];

  const anyUploading = attachments.some((a) => a.uploading);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-8 backdrop-blur-md sm:py-10">
      <style>
        {`
          .suggestion-form-modal {
            background:
              radial-gradient(circle at 12% 0%, rgba(139, 92, 246, 0.12), transparent 34%),
              radial-gradient(circle at 92% 0%, rgba(34, 211, 238, 0.08), transparent 32%),
              linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96)) !important;
            border-color: rgba(124, 58, 237, 0.18) !important;
            box-shadow:
              0 38px 120px rgba(15, 23, 42, 0.22),
              inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
          }

          .dark .suggestion-form-modal {
            background:
              radial-gradient(circle at 12% 0%, rgba(139, 92, 246, 0.16), transparent 34%),
              radial-gradient(circle at 92% 0%, rgba(34, 211, 238, 0.10), transparent 32%),
              linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.94)) !important;
            border-color: rgba(255, 255, 255, 0.10) !important;
            box-shadow:
              0 42px 130px rgba(0, 0, 0, 0.52),
              inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          }

          .suggestion-form-header {
            background: rgba(255, 255, 255, 0.86) !important;
            backdrop-filter: blur(18px);
          }

          .dark .suggestion-form-header {
            background: rgba(15, 23, 42, 0.86) !important;
          }

          .suggestion-form-footer {
            background: rgba(255, 255, 255, 0.92) !important;
            box-shadow:
              0 -18px 42px rgba(15, 23, 42, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.72);
            backdrop-filter: blur(18px);
          }

          .dark .suggestion-form-footer {
            background: rgba(2, 6, 23, 0.88) !important;
            box-shadow:
              0 -18px 46px rgba(0, 0, 0, 0.34),
              inset 0 1px 0 rgba(255, 255, 255, 0.06);
          }

          .suggestion-submit-button,
          .suggestion-submit-button span,
          .suggestion-submit-button svg {
            color: #ffffff !important;
            stroke: #ffffff !important;
          }
        `}
      </style>

      <div className="suggestion-form-modal relative flex w-full max-w-2xl max-h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-[28px] border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-[#1f1f23] shadow-2xl">
        {/* Header */}
        <div className="suggestion-form-header shrink-0 border-b border-slate-100 px-7 py-5 dark:border-white/[0.06]">
          <div className="flex items-center justify-between gap-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 shadow-lg shadow-violet-500/10 dark:bg-violet-500/15 dark:text-violet-300">
                <Lightbulb className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">
                  Submit Suggestion
                </h2>
                <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-white/45">
                  Help improve this project
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/45 dark:hover:bg-white/[0.08] dark:hover:text-white"
              aria-label="Close submit suggestion modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-7 py-6">
          {/* Suggestion Type */}
          <div>
            <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-white/45">
              Suggestion Type
            </label>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {contextOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setSuggestion({ ...suggestion, context: option.value })
                  }
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    suggestion.context === option.value
                      ? 'border-violet-200 bg-violet-50 shadow-sm ring-4 ring-violet-500/10 dark:border-violet-500/30 dark:bg-violet-500/10'
                      : 'border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/40 dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="text-sm font-bold text-slate-800 dark:text-white">
                    {option.label}
                  </div>
                  <div className="mt-1 text-[11px] font-medium text-slate-400 dark:text-white/30">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Target */}
          {targetName && (
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-500/20 dark:bg-violet-500/10">
              <p className="text-xs text-violet-700 dark:text-violet-300">
                Suggestion for:{' '}
                <span className="font-semibold">{targetName}</span>
              </p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-white/45">
              Title <span className="text-rose-500">*</span>
            </label>

            <input
              type="text"
              value={suggestion.title}
              onChange={(e) =>
                setSuggestion({ ...suggestion, title: e.target.value })
              }
              placeholder="Brief summary of your suggestion..."
              maxLength={100}
              autoFocus
              className="mt-2.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-shadow focus:outline-none focus:ring-4 focus:ring-violet-500/15 dark:border-white/[0.10] dark:bg-white/[0.05] dark:text-white dark:placeholder-white/30"
            />
          </div>

          {/* Details */}
          <div>
            <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-white/45">
              Details <span className="text-rose-500">*</span>
            </label>

            <textarea
              value={suggestion.content}
              onChange={(e) =>
                setSuggestion({ ...suggestion, content: e.target.value })
              }
              placeholder="Explain your suggestion in detail..."
              rows={5}
              maxLength={2000}
              className="mt-2.5 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-shadow focus:outline-none focus:ring-4 focus:ring-violet-500/15 dark:border-white/[0.10] dark:bg-white/[0.05] dark:text-white dark:placeholder-white/30"
            />

            <p className="mt-2 text-[11px] font-medium text-slate-400 dark:text-white/30">
              Be specific and constructive. Good suggestions get more votes!
            </p>
          </div>

          {/* Attachments */}
          <div>
            <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-white/45">
              Attachments
            </label>

            {attachments.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {attachments.map((a, i) => (
                  <div
                    key={a.preview}
                    className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-white/[0.08] dark:bg-white/[0.04]"
                  >
                    <img
                      src={a.preview}
                      alt={'Attachment ' + (i + 1)}
                      className={`h-full w-full object-cover ${a.error ? 'opacity-30' : ''}`}
                    />

                    {a.uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      </div>
                    )}

                    {a.error && (
                      <div className="absolute inset-0 flex items-center justify-center bg-rose-500/20">
                        <span className="px-1 text-center text-[9px] font-medium leading-tight text-rose-600 dark:text-rose-400">
                          Blocked
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => removeAttachment(a.preview)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 transition-colors hover:bg-black/80"
                      aria-label="Remove attachment"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-xs font-bold text-slate-500 transition-all hover:border-violet-300 hover:bg-violet-50/40 dark:border-white/[0.12] dark:text-white/40 dark:hover:border-violet-500/30 dark:hover:bg-white/[0.04]"
            >
              <ImageIcon className="h-4 w-4" />
              Add Photo
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="suggestion-form-footer shrink-0 border-t border-slate-200/70 px-7 py-5 dark:border-white/[0.08]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[0.72fr_1fr]">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[52px] rounded-2xl bg-slate-100 px-5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-white/[0.06] dark:text-white/70 dark:hover:bg-white/[0.10]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                !suggestion.title.trim() ||
                !suggestion.content.trim() ||
                submitting ||
                anyUploading
              }
              className="suggestion-submit-button relative isolate flex min-h-[52px] items-center justify-center gap-2 overflow-hidden rounded-2xl px-5 text-sm font-black text-white shadow-sm transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-100"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                  background:
                    suggestion.title.trim() && suggestion.content.trim() && !submitting && !anyUploading
                      ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 48%, #6d28d9 Available)'
                      : 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 52%, #7c3aed Available)',
                  boxShadow:
                    suggestion.title.trim() && suggestion.content.trim() && !submitting && !anyUploading
                      ? 'inset 0 1px 0 rgba(255,255,255,0.26), 0 16px 36px rgba(109,40,217,0.34)'
                      : 'inset 0 1px 0 rgba(255,255,255,0.22), 0 10px 24px rgba(109,40,217,0.20)',
                }}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-2xl border border-violet-200/80"
              />

              {submitting ? (
                <span className="relative z-10 text-white drop-shadow-sm">
                  Submitting...
                </span>
              ) : anyUploading ? (
                <>
                  <Loader2 className="relative z-10 h-4 w-4 animate-spin text-white" />
                  <span className="relative z-10 text-white drop-shadow-sm">
                    Uploading...
                  </span>
                </>
              ) : (
                <>
                  <Send className="relative z-10 h-4 w-4 text-white drop-shadow-sm" />
                  <span className="relative z-10 whitespace-nowrap text-white drop-shadow-sm">
                    Submit Suggestion
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SuggestionForm;
