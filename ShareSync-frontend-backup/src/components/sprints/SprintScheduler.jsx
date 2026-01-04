// src/components/sprints/SprintScheduler.jsx - Week 8 Day 3-4
import React, { useState } from 'react';
import { Clock, Users, Calendar, X, Zap } from 'lucide-react';
import { toast } from '../ui/toast';

/**
 * SprintScheduler - Schedule a 25-minute team sprint
 * Allows setting time, inviting team members, and adding goals
 */
const SprintScheduler = ({ projectId, onSchedule, onClose }) => {
  const [sprintData, setSprintData] = useState({
    duration: 25, // Default 25 minutes
    startTime: 'now',
    customTime: '',
    goal: '',
    invitedMembers: []
  });

  const [availableMembers] = useState([
    { id: 1, name: 'Sarah', avatar: '👩', online: true },
    { id: 2, name: 'Mike', avatar: '👨', online: true },
    { id: 3, name: 'Alex', avatar: '🧑', online: false }
  ]);

  const handleSchedule = () => {
    if (!sprintData.goal.trim()) {
      toast({ title: 'Add a sprint goal', variant: 'error' });
      return;
    }

    const sprint = {
      projectId,
      duration: sprintData.duration,
      startTime: sprintData.startTime === 'now' ? new Date() : new Date(sprintData.customTime),
      goal: sprintData.goal,
      invitedMembers: sprintData.invitedMembers,
      createdAt: new Date()
    };

    onSchedule?.(sprint);
    toast({ 
      title: '�� Sprint scheduled!', 
      description: `${sprintData.duration}-minute sprint starting ${sprintData.startTime === 'now' ? 'now' : 'at ' + sprintData.customTime}`,
      variant: 'success' 
    });
  };

  const toggleMember = (memberId) => {
    setSprintData(prev => ({
      ...prev,
      invitedMembers: prev.invitedMembers.includes(memberId)
        ? prev.invitedMembers.filter(id => id !== memberId)
        : [...prev.invitedMembers, memberId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Schedule Team Sprint</h2>
              <p className="text-sm text-slate-400">Focus together, ship faster</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Duration Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-3">Duration</label>
          <div className="grid grid-cols-3 gap-3">
            {[15, 25, 45].map((duration) => (
              <button
                key={duration}
                type="button"
                onClick={() => setSprintData(prev => ({ ...prev, duration }))}
                className={`px-4 py-3 rounded-xl border-2 transition-all ${
                  sprintData.duration === duration
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-slate-700 bg-slate-800/30 hover:border-purple-500/50'
                }`}
              >
                <Clock className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                <div className="text-sm font-bold text-white">{duration} min</div>
              </button>
            ))}
          </div>
        </div>

        {/* Start Time */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-3">Start Time</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSprintData(prev => ({ ...prev, startTime: 'now' }))}
              className={`px-4 py-3 rounded-xl border-2 transition-all ${
                sprintData.startTime === 'now'
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-slate-700 bg-slate-800/30 hover:border-emerald-500/50'
              }`}
            >
              <Zap className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
              <div className="text-sm font-bold text-white">Start Now</div>
            </button>
            <button
              type="button"
              onClick={() => setSprintData(prev => ({ ...prev, startTime: 'custom' }))}
              className={`px-4 py-3 rounded-xl border-2 transition-all ${
                sprintData.startTime === 'custom'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-700 bg-slate-800/30 hover:border-blue-500/50'
              }`}
            >
              <Calendar className="w-5 h-5 mx-auto mb-1 text-blue-400" />
              <div className="text-sm font-bold text-white">Schedule</div>
            </button>
          </div>

          {sprintData.startTime === 'custom' && (
            <input
              type="datetime-local"
              value={sprintData.customTime}
              onChange={(e) => setSprintData(prev => ({ ...prev, customTime: e.target.value }))}
              className="w-full mt-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          )}
        </div>

        {/* Sprint Goal */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">Sprint Goal</label>
          <input
            type="text"
            value={sprintData.goal}
            onChange={(e) => setSprintData(prev => ({ ...prev, goal: e.target.value }))}
            placeholder="What will you ship together?"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Invite Team Members */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Invite Team ({sprintData.invitedMembers.length})
          </label>
          <div className="space-y-2">
            {availableMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => toggleMember(member.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  sprintData.invitedMembers.includes(member.id)
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-slate-700 bg-slate-800/30 hover:border-purple-500/50'
                }`}
              >
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-lg">
                  {member.avatar}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-white">{member.name}</div>
                  <div className={`text-xs ${member.online ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {member.online ? '● Online' : 'Offline'}
                  </div>
                </div>
                {sprintData.invitedMembers.includes(member.id) && (
                  <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSchedule}
            className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 rounded-xl font-bold transition-all"
          >
            {sprintData.startTime === 'now' ? '🚀 Start Sprint' : '📅 Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SprintScheduler;
