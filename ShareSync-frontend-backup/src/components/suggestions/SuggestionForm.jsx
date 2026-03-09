// src/components/suggestions/SuggestionForm.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// ⭐ UPGRADE: Item 6 - Converted to Gallery Walk Light Theme (Slate-100/1px)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { X, Send, Lightbulb } from 'lucide-react';
import { toast } from '../ui/toast';

const SuggestionForm = ({ projectId, context = 'general', targetId = null, targetName = null, onSubmit, onClose }) => {
  const [suggestion, setSuggestion] = useState({
    title: '',
    content: '',
    context,
    targetId,
    targetName
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!suggestion.title.trim() || !suggestion.content.trim()) {
      toast({ title: 'Fill in all fields', variant: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit?.({
        ...suggestion,
        projectId,
        submittedAt: new Date()
      });
      // Note: Toast is handled in the parent panel now
    } catch (error) {
      toast({ title: 'Failed to submit suggestion', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const contextOptions = [
    { value: 'general', label: '💡 General', description: 'Overall project feedback' },
    { value: 'task', label: '�� Task Improvement', description: 'Specific workflow idea' },
    { value: 'announcement', label: '�� Feedback', description: 'Thoughts on recent news' },
    { value: 'feature', label: '✨ Feature Request', description: 'New capability idea' }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-2xl w-full shadow-2xl">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center border border-violet-200">
              <Lightbulb className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Submit Suggestion</h2>
              <p className="text-sm text-slate-500">Help improve this project</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Context Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">Suggestion Type</label>
          <div className="grid grid-cols-2 gap-3">
            {contextOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSuggestion({ ...suggestion, context: option.value })}
                className={`p-4 rounded-xl border transition-all text-left ${
                  suggestion.context === option.value
                    ? 'border-violet-500 bg-violet-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-violet-300 hover:bg-slate-50'
                }`}
              >
                <div className={`font-semibold mb-1 ${suggestion.context === option.value ? 'text-violet-700' : 'text-slate-700'}`}>
                  {option.label}
                </div>
                <div className="text-xs text-slate-500">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Target (if applicable) */}
        {targetName && (
          <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-sm text-slate-600">
              Suggestion for: <span className="font-semibold text-slate-900">{targetName}</span>
            </p>
          </div>
        )}

        {/* Title */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={suggestion.title}
            onChange={(e) => setSuggestion({ ...suggestion, title: e.target.value })}
            placeholder="Brief summary of your suggestion..."
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all shadow-sm"
            autoFocus
          />
        </div>

        {/* Content */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Details <span className="text-red-500">*</span>
          </label>
          <textarea
            value={suggestion.content}
            onChange={(e) => setSuggestion({ ...suggestion, content: e.target.value })}
            placeholder="Explain your suggestion in detail..."
            rows={5}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all shadow-sm resize-none"
          />
          <p className="text-xs text-slate-500 mt-2">
            Be specific and constructive. Good suggestions get more votes!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!suggestion.title.trim() || !suggestion.content.trim() || submitting}
            className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          >
            {submitting ? (
              'Submitting...'
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Suggestion
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuggestionForm;
