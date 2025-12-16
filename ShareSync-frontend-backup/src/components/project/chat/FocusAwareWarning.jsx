// src/components/project/chat/FocusAwareWarning.jsx
import React from 'react';
import { AlertCircle, Clock, Flame, X } from 'lucide-react';

export default function FocusAwareWarning({ 
  focusedMembers = [], 
  onSendAnyway, 
  onScheduleForBreak,
  onCancel 
}) {
  if (focusedMembers.length === 0) return null;

  const totalFocused = focusedMembers.length;
  const shortestRemaining = Math.min(...focusedMembers.map(m => m.remainingMinutes));

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-orange-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-orange-500/20 rounded-xl">
            <AlertCircle className="w-6 h-6 text-orange-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg mb-1">
              ⚠️ {totalFocused} teammate{totalFocused > 1 ? 's are' : ' is'} in deep work
            </h3>
            <p className="text-slate-400 text-sm">
              They may not respond until their focus session ends
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {focusedMembers.map((member, i) => (
            <div 
              key={i}
              className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden">
                  {member.avatar ? (
                    <img 
                      src={member.avatar} 
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-semibold">
                      {member.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 border-2 border-slate-900 rounded-full" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">{member.name}</p>
                <p className="text-slate-400 text-xs truncate">{member.activity}</p>
              </div>

              <div className="flex items-center gap-1 text-xs text-orange-400">
                <Flame className="w-3 h-3" />
                <span>{member.remainingMinutes} min</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-300 leading-relaxed">
              Your message will be delivered immediately, but notifications will be 
              {totalFocused > 1 ? ' batched ' : ' delayed '}
              until their {totalFocused > 1 ? 'breaks' : 'break'} (~{shortestRemaining} min).
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={onSendAnyway}
            className="w-full bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-xl text-white font-semibold transition-all"
          >
            Send anyway
          </button>
          
          {onScheduleForBreak && (
            <button
              onClick={onScheduleForBreak}
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 px-6 py-3 rounded-xl text-white font-semibold transition-all"
            >
              Schedule for their break
            </button>
          )}
          
          <button
            onClick={onCancel}
            className="w-full text-slate-400 hover:text-white text-sm transition-all py-2"
          >
            Cancel message
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <p className="text-xs text-slate-500 text-center">
            Respecting focus time reduces interruptions by 85% 
            <span className="inline-block mx-1">•</span>
            Research by Cal Newport
          </p>
        </div>
      </div>
    </div>
  );
}
