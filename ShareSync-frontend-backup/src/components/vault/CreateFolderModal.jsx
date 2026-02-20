import React, { useState } from 'react';
import { X, Folder, Shield } from 'lucide-react';

export default function CreateFolderModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    await onCreate(name, isPrivate);
    setIsSubmitting(false);
    setName('');
    setIsPrivate(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#18181b] border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/[0.04]">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-warning-400" />
            <h2 className="text-sm font-medium text-text-primary">Create Folder</h2>
          </div>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Folder Name</label>
            <input
              type="text"
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-2 border border-white/[0.08] rounded-xl px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-brand-500 transition-colors"
              placeholder="e.g. Design Assets"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-2 border border-white/[0.04]">
            <div className="flex items-center gap-3">
              <Shield className={`w-5 h-5 ${isPrivate ? 'text-brand-400' : 'text-text-tertiary'}`} />
              <div>
                <p className="text-sm font-medium text-text-primary">Private Folder</p>
                <p className="text-xs text-text-tertiary">Only moderators can view contents</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`w-11 h-6 rounded-full transition-colors relative ${isPrivate ? 'bg-brand-500' : 'bg-surface-3'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isPrivate ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || !name.trim()}
              className="px-6 py-2 bg-brand-500 text-white text-sm font-medium rounded-xl hover:bg-brand-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
