// src/components/sprints/SprintRetro.jsx - Week 8 Day 3-4
import React, { useState } from 'react';
import { Trophy, Rocket, MessageCircle, X, Sparkles } from 'lucide-react';
import { toast } from '../ui/toast';

/**
 * SprintRetro - Quick retrospective after sprint ends
 * "What did you ship?"
 */
const SprintRetro = ({ sprint, participants, onClose, onComplete }) => {
  const [ships, setShips] = useState(
    participants.map(p => ({
      userId: p.id,
      userName: p.name,
      avatar: p.avatar,
      whatIShipped: p.id === 3 ? '' : `Completed ${p.shipsCount} tasks`, // Only current user needs to fill
      isCurrentUser: p.id === 3
    }))
  );

  const [myShip, setMyShip] = useState('');

  const handleSubmit = () => {
    if (!myShip.trim()) {
      toast({ title: 'Share what you shipped!', variant: 'error' });
      return;
    }

    const updatedShips = ships.map(s =>
      s.isCurrentUser ? { ...s, whatIShipped: myShip } : s
    );

    onComplete?.({
      sprint,
      ships: updatedShips,
      completedAt: new Date()
    });

    toast({
      title: '🎉 Sprint complete!',
      description: 'Great work team!',
      variant: 'success'
    });
  };

  const totalShips = participants.reduce((sum, p) => sum + p.shipsCount, 0);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Sprint Complete! ��</h2>
          <p className="text-slate-400">Time to celebrate what you shipped</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">{sprint.duration}</div>
            <div className="text-xs text-slate-400">Minutes</div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400 mb-1">{totalShips}</div>
            <div className="text-xs text-slate-400">Total Ships</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">{participants.length}</div>
            <div className="text-xs text-slate-400">Team Members</div>
          </div>
        </div>

        {/* Sprint Goal Recap */}
        <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="font-semibold text-white text-sm">Sprint Goal</h3>
          </div>
          <p className="text-slate-300">{sprint.goal}</p>
        </div>

        {/* What Did You Ship? */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Rocket className="w-4 h-4 text-purple-400" />
            What did YOU ship?
          </label>
          <textarea
            value={myShip}
            onChange={(e) => setMyShip(e.target.value)}
            placeholder="Describe what you accomplished..."
            rows={3}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            autoFocus
          />
        </div>

        {/* What Others Shipped */}
        <div className="mb-6">
          <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-blue-400" />
            What the team shipped
          </h3>
          <div className="space-y-3">
            {ships.filter(s => !s.isCurrentUser && s.whatIShipped).map((ship) => (
              <div
                key={ship.userId}
                className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                    {ship.avatar}
                  </div>
                  <span className="font-medium text-white">{ship.userName}</span>
                </div>
                <p className="text-sm text-slate-300 ml-11">{ship.whatIShipped}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition-all"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={!myShip.trim()}
            className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🎉 Complete Sprint
          </button>
        </div>

        {/* Quick Note */}
        <p className="text-center text-xs text-slate-500 mt-4">
          Your ships will be saved to the project timeline
        </p>
      </div>
    </div>
  );
};

export default SprintRetro;
