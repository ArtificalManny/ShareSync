// src/components/community/TemplateCard.jsx - Week 9 Day 1-2
import React, { useState } from 'react';
import { Sparkles, Copy, Check, Download, Eye } from 'lucide-react';
import { toast } from '../ui/toast';

/**
 * TemplateCard - Display a project template
 * Shows template info, use count, preview
 */
const TemplateCard = ({ template, onUse, onPreview }) => {
  const [copied, setCopied] = useState(false);

  const categoryColors = {
    school: 'from-blue-600 to-cyan-600',
    work: 'from-purple-600 to-fuchsia-600',
    personal: 'from-pink-600 to-rose-600',
    health: 'from-emerald-600 to-green-600',
    creative: 'from-orange-600 to-yellow-600'
  };

  const categoryEmojis = {
    school: '🎓',
    work: '💼',
    personal: '✨',
    health: '💪',
    creative: '🎨'
  };

  const handleShare = () => {
    const url = `${window.location.origin}/community/templates/${template.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ 
      title: '🔗 Link copied!', 
      description: 'Share this template with others',
      variant: 'success' 
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-xl hover:border-purple-500/40 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 bg-gradient-to-r ${categoryColors[template.category] || categoryColors.work} rounded-xl flex items-center justify-center`}>
            <span className="text-2xl">{categoryEmojis[template.category] || '💼'}</span>
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{template.name}</h3>
            <p className="text-xs text-slate-400">
              by <span className="text-purple-400">{template.author}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      {template.description && (
        <p className="text-sm text-slate-300 mb-4 line-clamp-2">
          {template.description}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <Download className="w-3 h-3" />
          <span>{template.uses} uses</span>
        </div>
        <div className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          <span>{template.tasks.length} tasks</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onPreview?.(template)}
          className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-semibold transition-all"
        >
          Preview
        </button>
        <button
          onClick={() => onUse?.(template)}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 rounded-xl text-sm font-bold transition-all"
        >
          Use Template
        </button>
        <button
          onClick={handleShare}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default TemplateCard;
