// src/components/community/TipSubmission.jsx - Week 9 Day 1-2
import React, { useState } from 'react';
import { X, Lightbulb, Trophy, Send } from 'lucide-react';
import { toast } from '../ui/toast';

/**
 * TipSubmission - Submit a community tip
 * "How I maintain 100-day streak", productivity tips, etc.
 */
const TipSubmission = ({ onSubmit, onClose }) => {
  const [tip, setTip] = useState({
    title: '',
    content: '',
    category: 'productivity',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { value: 'productivity', label: '⚡ Productivity', color: 'purple' },
    { value: 'streaks', label: '🔥 Streaks', color: 'orange' },
    { value: 'focus', label: '🎯 Focus', color: 'blue' },
    { value: 'teamwork', label: '🤝 Teamwork', color: 'emerald' },
    { value: 'motivation', label: '💪 Motivation', color: 'yellow' }
  ];

  const handleAddTag = () => {
    if (tagInput.trim() && !tip.tags.includes(tagInput.trim())) {
      setTip({ ...tip, tags: [...tip.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTip({ ...tip, tags: tip.tags.filter(t => t !== tagToRemove) });
  };

  const handleSubmit = async () => {
    if (!tip.title.trim() || !tip.content.trim()) {
      toast({ title: 'Fill in all fields', variant: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit?.({
        ...tip,
        submittedAt: new Date(),
        author: 'currentUser' // Will be replaced with actual user
      });

      toast({ 
        title: '🎉 Tip submitted!', 
        description: 'Your tip will help the community',
        variant: 'success' 
      });
      onClose?.();
    } catch (error) {
      toast({ title: 'Failed to submit tip', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Share Your Tip</h2>
              <p className="text-sm text-slate-400">Help the community stay productive</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Title */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={tip.title}
            onChange={(e) => setTip({ ...tip, title: e.target.value })}
            placeholder="How I maintain a 100-day streak"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            autoFocus
          />
        </div>

        {/* Category */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-3">Category</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setTip({ ...tip, category: cat.value })}
                className={`px-4 py-3 rounded-xl border-2 transition-all text-left ${
                  tip.category === cat.value
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-slate-700 bg-slate-800/30 hover:border-purple-500/50'
                }`}
              >
                <div className="font-semibold text-white">{cat.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">
            Your Tip <span className="text-red-400">*</span>
          </label>
          <textarea
            value={tip.content}
            onChange={(e) => setTip({ ...tip, content: e.target.value })}
            placeholder="Share your best practices, strategies, or insights..."
            rows={8}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
          <p className="text-xs text-slate-500 mt-2">
            {tip.content.length} characters
          </p>
        </div>

        {/* Tags */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">Tags (optional)</label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Add a tag..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-semibold transition-all"
            >
              Add
            </button>
          </div>
          {tip.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tip.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs font-semibold text-purple-300 flex items-center gap-2"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
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
            disabled={!tip.title.trim() || !tip.content.trim() || submitting}
            className="flex-1 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              'Submitting...'
            ) : (
              <>
                <Send className="w-4 h-4" />
                Share Tip
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TipSubmission;
