// src/components/suggestions/SuggestionForm.jsx - Form to submit suggestions
import React, { useState } from 'react';
import { X, Send, Lightbulb } from 'lucide-react';
import { toast } from '../ui/toast';

/**
 * SuggestionForm - Submit a new suggestion
 * For public spectators to give feedback
 */
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
      
      toast({ 
        title: '💡 Suggestion submitted!', 
        description: 'Project members will review it',
        variant: 'success' 
      });
      onClose?.();
    } catch (error) {
      toast({ title: 'Failed to submit suggestion', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const contextOptions = [
    { value: 'general', label: '💡 General Suggestion', description: 'Overall project feedback' },
    { value: 'task', label: '📋 Task Improvement', description: 'Suggestion for a specific task' },
    { value: 'announcement', label: '📢 Announcement Feedback', description: 'Feedback on an announcement' },
    { value: 'feature', label: '✨ Feature Request', description: 'New feature idea' }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 max-w-2xl w-full shadow-2xl">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Submit Suggestion</h2>
              <p className="text-sm text-slate-400">Help improve this project</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Context Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-3">Suggestion Type</label>
          <div className="grid grid-cols-2 gap-3">
            {contextOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSuggestion({ ...suggestion, context: option.value })}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  suggestion.context === option.value
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-slate-700 bg-slate-800/30 hover:border-purple-500/50'
                }`}
              >
                <div className="font-semibold text-white mb-1">{option.label}</div>
                <div className="text-xs text-slate-400">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Target (if applicable) */}
        {targetName && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <p className="text-sm text-blue-300">
              Suggestion for: <span className="font-semibold">{targetName}</span>
            </p>
          </div>
        )}

        {/* Title */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={suggestion.title}
            onChange={(e) => setSuggestion({ ...suggestion, title: e.target.value })}
            placeholder="Brief summary of your suggestion..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            autoFocus
          />
        </div>

        {/* Content */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">
            Details <span className="text-red-400">*</span>
          </label>
          <textarea
            value={suggestion.content}
            onChange={(e) => setSuggestion({ ...suggestion, content: e.target.value })}
            placeholder="Explain your suggestion in detail..."
            rows={6}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
          <p className="text-xs text-slate-500 mt-2">
            Be specific and constructive. Good suggestions get more votes!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!suggestion.title.trim() || !suggestion.content.trim() || submitting}
            className="flex-1 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
