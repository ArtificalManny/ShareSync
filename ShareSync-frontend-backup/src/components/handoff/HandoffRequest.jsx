// src/components/handoff/HandoffRequest.jsx - Week 8 Day 5-6
import React, { useState } from 'react';
import { X, AlertCircle, Users, Send } from 'lucide-react';
import { toast } from '../ui/toast';

/**
 * HandoffRequest - "I'm stuck on X, can you take it?"
 * Modal for requesting help on a task
 */
const HandoffRequest = ({ task, projectMembers = [], onRequest, onClose }) => {
  const [selectedMember, setSelectedMember] = useState(null);
  const [message, setMessage] = useState(`I'm stuck on "${task.title}". Can you take this?`);
  const [sending, setSending] = useState(false);

  const handleSendRequest = async () => {
    if (!selectedMember) {
      toast({ title: 'Select a team member', variant: 'error' });
      return;
    }

    setSending(true);
    try {
      await onRequest?.({
        taskId: task._id,
        fromUserId: 'currentUser', // Will be replaced with actual user ID
        toUserId: selectedMember.id,
        message,
        task,
        timestamp: new Date()
      });

      toast({ 
        title: '🤝 Help requested!', 
        description: `${selectedMember.name} will be notified`,
        variant: 'success' 
      });
      onClose?.();
    } catch (error) {
      toast({ title: 'Failed to send request', variant: 'error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-orange-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Request Help</h2>
              <p className="text-sm text-slate-400">Ask a teammate to take over</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Task Info */}
        <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700">
          <p className="text-sm text-slate-400 mb-1">Task:</p>
          <p className="font-semibold text-white">{task.title}</p>
        </div>

        {/* Select Team Member */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Who can help?
          </label>
          <div className="space-y-2">
            {projectMembers.length === 0 ? (
              <p className="text-center text-slate-500 py-4">No team members available</p>
            ) : (
              projectMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedMember(member)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    selectedMember?.id === member.id
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-slate-700 bg-slate-800/30 hover:border-orange-500/50'
                  }`}
                >
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center text-lg">
                    {member.avatar || member.name[0]}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-white">{member.name}</div>
                    {member.online && (
                      <div className="text-xs text-emerald-400">● Online</div>
                    )}
                  </div>
                  {selectedMember?.id === member.id && (
                    <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">Message (optional)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Explain why you're stuck..."
            rows={3}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          />
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
            onClick={handleSendRequest}
            disabled={!selectedMember || sending}
            className="flex-1 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sending ? (
              'Sending...'
            ) : (
              <>
                <Send className="w-4 h-4" />
                Request Help
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HandoffRequest;
