// src/components/handoff/HandoffNotification.jsx - Week 8 Day 5-6
import React, { useState } from 'react';
import { Check, X, AlertCircle, Clock } from 'lucide-react';
import { toast } from '../ui/toast';

/**
 * HandoffNotification - Incoming help request notification
 * Shows when someone asks you to take over a task
 */
const HandoffNotification = ({ request, onAccept, onDecline }) => {
  const [responding, setResponding] = useState(false);

  const handleAccept = async () => {
    setResponding(true);
    try {
      await onAccept?.(request);
      toast({ 
        title: '✅ Task accepted!', 
        description: 'You are now the owner of this task',
        variant: 'success' 
      });
    } catch (error) {
      toast({ title: 'Failed to accept task', variant: 'error' });
    } finally {
      setResponding(false);
    }
  };

  const handleDecline = async () => {
    setResponding(true);
    try {
      await onDecline?.(request);
      toast({ 
        title: 'Request declined', 
        variant: 'default' 
      });
    } catch (error) {
      toast({ title: 'Failed to decline', variant: 'error' });
    } finally {
      setResponding(false);
    }
  };

  return (
    <div className="bg-slate-800/95 backdrop-blur-xl border-l-4 border-orange-500 rounded-r-xl p-4 shadow-2xl">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-orange-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-white mb-1">Help Requested</h4>
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-purple-400">{request.fromUserName}</span> needs help with:
          </p>
        </div>
      </div>

      {/* Task Info */}
      <div className="bg-slate-900/50 rounded-xl p-3 mb-3 ml-13">
        <p className="font-semibold text-white mb-2">{request.task.title}</p>
        {request.message && (
          <p className="text-sm text-slate-400 italic">"{request.message}"</p>
        )}
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 ml-13">
        <Clock className="w-3 h-3" />
        <span>{new Date(request.timestamp).toLocaleTimeString()}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 ml-13">
        <button
          onClick={handleAccept}
          disabled={responding}
          className="flex-1 py-2 px-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          {responding ? 'Accepting...' : "I'll Take It"}
        </button>
        <button
          onClick={handleDecline}
          disabled={responding}
          className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          Decline
        </button>
      </div>
    </div>
  );
};

export default HandoffNotification;
