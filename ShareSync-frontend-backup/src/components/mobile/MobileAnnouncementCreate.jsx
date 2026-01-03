import React, { useState } from 'react';
import { Megaphone, AlertCircle, Trophy, DollarSign } from 'lucide-react';
import { createAnnouncement } from '../../api/announcements';
import { toast } from '../ui/toast';
import BottomSheet from './BottomSheet';

const MobileAnnouncementCreate = ({ projectId, isOpen, onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('general');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim()) {
      toast({ title: "Please fill in all fields", variant: "error" });
      return;
    }

    try {
      setCreating(true);
      await createAnnouncement(projectId, {
        title: title.trim(),
        message: message.trim(),
        type,
        pinned: true,
      });
      
      toast({ title: "Announcement created! 📢", variant: "success" });
      setTitle('');
      setMessage('');
      setType('general');
      onCreated?.();
      onClose();
    } catch (error) {
      toast({ title: "Failed to create announcement", variant: "error" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Create Announcement"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Type Selection */}
        <div>
          <label className="text-sm text-slate-400 mb-3 block font-medium">Type</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'general', label: '📢 General', icon: Megaphone, color: 'purple' },
              { value: 'important', label: '⚠️ Important', icon: AlertCircle, color: 'orange' },
              { value: 'milestone', label: '✅ Milestone', icon: Trophy, color: 'yellow' },
              { value: 'payment', label: '💰 Payment', icon: DollarSign, color: 'emerald' },
            ].map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`p-4 rounded-xl border-2 text-sm font-medium transition-all min-h-[80px] flex flex-col items-center justify-center gap-2 ${
                  type === t.value
                    ? `bg-${t.color}-500/20 border-${t.color}-500 text-${t.color}-400`
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 active:scale-95'
                }`}
              >
                <t.icon className="w-6 h-6" />
                <span className="text-xs">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-sm text-slate-400 mb-2 block font-medium">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="E.g., Payment sent to beneficiary Y"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
            maxLength={200}
            required
          />
        </div>

        {/* Message */}
        <div>
          <label className="text-sm text-slate-400 mb-2 block font-medium">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Provide details about this announcement..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white text-base focus:outline-none focus:ring-2 focus:ring-purple-500 h-32 resize-none"
            maxLength={2000}
            required
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 pb-safe">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-xl font-medium transition-all text-base"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={creating || !title.trim() || !message.trim()}
            className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl font-medium hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};

export default MobileAnnouncementCreate;
