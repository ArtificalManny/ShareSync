import React, { useState } from 'react';
import { Megaphone, AlertCircle, Trophy, DollarSign, Send } from 'lucide-react';
import BottomSheet from '../mobile/BottomSheet';
import VoiceInput from './VoiceInput';
import { createAnnouncement } from '../../api/announcements';
import { toast } from '../ui/toast';

const QuickAnnounceSheet = ({ isOpen, onClose, projectId }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('general');
  const [posting, setPosting] = useState(false);

  const types = [
    { id: 'general', label: '📢 General', icon: Megaphone, color: 'purple' },
    { id: 'important', label: '⚠️ Important', icon: AlertCircle, color: 'orange' },
    { id: 'milestone', label: '✅ Milestone', icon: Trophy, color: 'yellow' },
    { id: 'payment', label: '💰 Payment', icon: DollarSign, color: 'emerald' },
  ];

  // Load draft from localStorage
  React.useEffect(() => {
    if (isOpen) {
      const draft = localStorage.getItem('quick-announce-draft');
      if (draft) {
        const { title: draftTitle, message: draftMessage } = JSON.parse(draft);
        setTitle(draftTitle || '');
        setMessage(draftMessage || '');
      }
    }
  }, [isOpen]);

  // Auto-save draft
  React.useEffect(() => {
    if (title || message) {
      localStorage.setItem('quick-announce-draft', JSON.stringify({ title, message }));
    }
  }, [title, message]);

  const handlePost = async () => {
    if (!title.trim() || !message.trim()) {
      toast({ title: 'Fill in title and message', variant: 'error' });
      return;
    }

    try {
      setPosting(true);

      await createAnnouncement(projectId, {
        title: title.trim(),
        message: message.trim(),
        type,
        pinned: type === 'important',
      });

      toast({
        title: '📢 Announcement posted!',
        description: 'Team has been notified',
        variant: 'success',
      });

      // Clear draft
      localStorage.removeItem('quick-announce-draft');
      
      setTitle('');
      setMessage('');
      setType('general');
      onClose();
      
    } catch (error) {
      toast({ title: 'Failed to post announcement', variant: 'error' });
    } finally {
      setPosting(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Quick Announcement">
      <div className="p-6 space-y-6">
        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-slate-400 font-medium">Title</label>
            <VoiceInput 
              value={title}
              onChange={setTitle}
              onTranscript={(transcript) => {
                if (!title) setTitle(transcript);
              }}
            />
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="E.g., Payment sent to beneficiary Y"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
            maxLength={200}
          />
        </div>

        {/* Message */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-slate-400 font-medium">Message</label>
            <VoiceInput 
              value={message}
              onChange={setMessage}
              onTranscript={(transcript) => {
                if (!message) setMessage(transcript);
              }}
            />
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Provide details about this announcement..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white text-base focus:outline-none focus:ring-2 focus:ring-purple-500 h-32 resize-none"
            maxLength={2000}
          />
        </div>

        {/* Type Selection */}
        <div>
          <label className="text-sm text-slate-400 mb-3 block font-medium">Type</label>
          <div className="grid grid-cols-2 gap-3">
            {types.map((t) => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                  type === t.id
                    ? `bg-${t.color}-500/20 border-${t.color}-500 text-${t.color}-400`
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 active:scale-95'
                }`}
              >
                <t.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handlePost}
            disabled={posting || !title.trim() || !message.trim()}
            className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {posting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Post
              </>
            )}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

export default QuickAnnounceSheet;