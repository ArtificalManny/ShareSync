// src/components/suggestions/SuggestionForm.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Submit a suggestion with optional file attachments from device
// Uploads go through /api/uploads/file (moderation pipeline)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useRef } from 'react';
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-[#1f1f23] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between sticky top-0 bg-white dark:bg-[#1f1f23] z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Submit Suggestion
              </h2>
              <p className="text-xs text-slate-500 dark:text-white/40">
                Help improve this project
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4 text-slate-400 dark:text-white/40" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Suggestion Type */}
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider">
              Suggestion Type
            </label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {contextOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setSuggestion({ ...suggestion, context: option.value })
                  }
                  className={`p-3 rounded-xl border text-left transition-all ${
                    suggestion.context === option.value
                      ? 'border-violet-300 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10'
                      : 'border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="text-sm font-medium text-slate-800 dark:text-white">
                    {option.label}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-white/30 mt-0.5">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Target */}
          {targetName && (
            <div className="p-3 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-xl">
              <p className="text-xs text-violet-700 dark:text-violet-300">
                Suggestion for:{' '}
                <span className="font-semibold">{targetName}</span>
              </p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider">
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
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl text-sm bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.10] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-shadow"
            />
          </div>

          {/* Details */}
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider">
              Details <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={suggestion.content}
              onChange={(e) =>
                setSuggestion({ ...suggestion, content: e.target.value })
              }
              placeholder="Explain your suggestion in detail..."
              rows={4}
              maxLength={2000}
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl text-sm resize-none bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.10] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-shadow"
            />
            <p className="text-[10px] text-slate-400 dark:text-white/30 mt-1">
              Be specific and constructive. Good suggestions get more votes!
            </p>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              ATTACHMENTS — Upload from device, moderated by backend
          ═══════════════════════════════════════════════════════════════ */}
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider">
              Attachments
            </label>

            {/* Preview grid */}
            {attachments.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {attachments.map((a, i) => (
                  <div
                    key={a.preview}
                    className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-white/[0.08] aspect-square bg-slate-50 dark:bg-white/[0.04]"
                  >
                    <img
                      src={a.preview}
                      alt={'Attachment ' + (i + 1)}
                      className={`w-full h-full object-cover ${a.error ? 'opacity-30' : ''}`}
                    />
                    {a.uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                    {a.error && (
                      <div className="absolute inset-0 flex items-center justify-center bg-rose-500/20">
                        <span className="text-[9px] text-rose-600 dark:text-rose-400 font-medium px-1 text-center leading-tight">
                          Blocked
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => removeAttachment(a.preview)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-white/[0.12] text-xs font-medium text-slate-500 dark:text-white/40 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:border-violet-300 dark:hover:border-violet-500/30 transition-all"
            >
              <ImageIcon className="w-4 h-4" />
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

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/[0.10] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                !suggestion.title.trim() ||
                !suggestion.content.trim() ||
                submitting ||
                anyUploading
              }
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {submitting ? (
                'Submitting...'
              ) : anyUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Submit Suggestion
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuggestionForm;
