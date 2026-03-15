
// src/components/suggestions/SuggestionForm.jsx

// ═══════════════════════════════════════════════════════════════════════════════

// Suggestion submission form — compact modal, proper light/dark, no broken emojis

// ═══════════════════════════════════════════════════════════════════════════════

 

import React, { useState } from 'react';

import { X, Send, Lightbulb, Zap, MessageSquare, Star } from 'lucide-react';

import { toast } from '../ui/toast';

 

const CONTEXT_OPTIONS = [

  { value: 'general', label: 'General', desc: 'Overall project feedback', icon: Lightbulb, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', activeBorder: 'border-amber-400 dark:border-amber-400/40' },

  { value: 'task', label: 'Task Improvement', desc: 'Specific workflow idea', icon: Zap, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10', border: 'border-violet-200 dark:border-violet-500/20', activeBorder: 'border-violet-400 dark:border-violet-400/40' },

  { value: 'announcement', label: 'Feedback', desc: 'Thoughts on recent news', icon: MessageSquare, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-500/10', border: 'border-cyan-200 dark:border-cyan-500/20', activeBorder: 'border-cyan-400 dark:border-cyan-400/40' },

  { value: 'feature', label: 'Feature Request', desc: 'New capability idea', icon: Star, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10', border: 'border-teal-200 dark:border-teal-500/20', activeBorder: 'border-teal-400 dark:border-teal-400/40' },

];

 

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

    } catch (error) {

      toast({ title: 'Failed to submit suggestion', variant: 'error' });

    } finally {

      setSubmitting(false);

    }

  };

 

  return (

    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">

      {/* Backdrop */}

      <button

        className="absolute inset-0 bg-black/60 backdrop-blur-sm"

        onClick={onClose}

        aria-label="Close"

      />

 

      {/* Modal — compact, max-w-lg */}

      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-[#1f1f23] shadow-2xl overflow-hidden">

 

        {/* Header */}

        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">

              <Lightbulb className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" />

            </div>

            <div>

              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Submit Suggestion</h2>

              <p className="text-xs text-slate-500 dark:text-white/40">Help improve this project</p>

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

          {/* Suggestion Type — compact 2x2 grid */}

          <div>

            <label className="text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider">

              Suggestion Type

            </label>

            <div className="grid grid-cols-2 gap-2 mt-2">

              {CONTEXT_OPTIONS.map((opt) => {

                const active = suggestion.context === opt.value;

                const Icon = opt.icon;

                return (

                  <button

                    key={opt.value}

                    type="button"

                    onClick={() => setSuggestion({ ...suggestion, context: opt.value })}

                    className={`p-3 rounded-xl border transition-all text-left

                      ${active

                        ? `${opt.bg} ${opt.activeBorder} ring-1 ring-${opt.color.replace('text-', '')}/20`

                        : `bg-white dark:bg-white/[0.03] ${opt.border} hover:bg-slate-50 dark:hover:bg-white/[0.05]`

                      }`}

                  >

                    <div className="flex items-center gap-2 mb-0.5">

                      <Icon className={`w-3.5 h-3.5 ${opt.color}`} />

                      <span className="text-sm font-medium text-slate-800 dark:text-white">{opt.label}</span>

                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-white/40 ml-5.5">{opt.desc}</p>

                  </button>

                );

              })}

            </div>

          </div>

 

          {/* Target (if applicable) */}

          {targetName && (

            <div className="p-3 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-xl">

              <p className="text-xs text-violet-700 dark:text-violet-300">

                Suggestion for: <span className="font-semibold">{targetName}</span>

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

              onChange={(e) => setSuggestion({ ...suggestion, title: e.target.value })}

              placeholder="Brief summary of your suggestion..."

              maxLength={100}

              className="mt-1.5 w-full px-3 py-2.5 rounded-xl text-sm

                bg-white dark:bg-white/[0.05]

                border border-slate-200 dark:border-white/[0.10]

                text-slate-900 dark:text-white

                placeholder-slate-400 dark:placeholder-white/30

                focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400

                transition-shadow"

              autoFocus

            />

          </div>

 

          {/* Details */}

          <div>

            <label className="text-xs font-medium text-slate-500 dark:text-white/40 uppercase tracking-wider">

              Details <span className="text-rose-500">*</span>

            </label>

            <textarea

              value={suggestion.content}

              onChange={(e) => setSuggestion({ ...suggestion, content: e.target.value })}

              placeholder="Explain your suggestion in detail..."

              maxLength={2000}

              rows={4}

              className="mt-1.5 w-full px-3 py-2.5 rounded-xl text-sm resize-none

                bg-white dark:bg-white/[0.05]

                border border-slate-200 dark:border-white/[0.10]

                text-slate-900 dark:text-white

                placeholder-slate-400 dark:placeholder-white/30

                focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400

                transition-shadow"

            />

            <p className="text-[11px] text-slate-400 dark:text-white/30 mt-1">

              Be specific and constructive. Good suggestions get more votes!

            </p>

          </div>

 

          {/* Actions */}

          <div className="flex items-center gap-3 pt-2">

            <button

              onClick={onClose}

              className="flex-1 py-2.5 rounded-xl text-sm font-medium

                bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-white/60

                hover:bg-slate-200 dark:hover:bg-white/[0.10]

                transition-colors"

            >

              Cancel

            </button>

            <button

              onClick={handleSubmit}

              disabled={!suggestion.title.trim() || !suggestion.content.trim() || submitting}

              className="flex-1 py-2.5 rounded-xl text-sm font-medium

                bg-violet-600 hover:bg-violet-700 text-white

                disabled:opacity-40 disabled:hover:bg-violet-600

                transition-colors flex items-center justify-center gap-2 shadow-sm"

            >

              {submitting ? (

                'Submitting...'

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

