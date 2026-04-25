import React, { useState, useEffect } from 'react';
import { X, Clock, AlignLeft, Calendar as CalIcon, Zap, Users, Coffee } from 'lucide-react';

export default function CreateSessionModal({ isOpen, onClose, onSave, initialData, projectId }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('focus'); // 'focus', 'meeting', 'break'
  const [dateStr, setDateStr] = useState('');
  const [startTimeStr, setStartTimeStr] = useState('09:00');
  const [endTimeStr, setEndTimeStr] = useState('10:00');
  const [description, setDescription] = useState('');

  // Populate local states when the modal opens with grid data
  useEffect(() => {
    if (isOpen && initialData?.date) {
      const d = initialData.date;
      // Format Date for HTML5 date input (YYYY-MM-DD)
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setDateStr(`${year}-${month}-${day}`);

      // Format Time for HTML5 time input (HH:MM)
      const sh = String(initialData.hour).padStart(2, '0');
      setStartTimeStr(`${sh}:00`);

      // Default to 1 hour later
      const eh = String(initialData.hour + 1).padStart(2, '0');
      setEndTimeStr(`${eh}:00`);
      
      setTitle('');
      setDescription('');
      setType('focus');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert local HTML5 string inputs back into Date objects for the backend
    const [y, m, d] = dateStr.split('-').map(Number);
    const [sh, sm] = startTimeStr.split(':').map(Number);
    const [eh, em] = endTimeStr.split(':').map(Number);

    const startObj = new Date(y, m - 1, d, sh, sm, 0);
    const endObj = new Date(y, m - 1, d, eh, em, 0);

    if (endObj <= startObj) {
      alert("End time must be after the start time.");
      return;
    }

    // Map the UI selection to the backend enum
    let backendType = 'custom';
    if (type === 'meeting') backendType = 'meeting';

    // Ensure Focus blocks are explicitly labeled so the grid colors them correctly
    const finalTitle = type === 'focus' && !title.toLowerCase().includes('focus') 
      ? `Focus: ${title || 'Deep Work'}` 
      : title || 'Untitled Session';

    onSave({
      title: finalTitle,
      type: backendType,
      startTime: startObj.toISOString(), // Send as UTC
      endTime: endObj.toISOString(),
      description,
      projectId: projectId,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#18181b] border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header (Google Calendar style - minimalist) */}
        <div className="flex justify-between items-center px-6 py-4 bg-surface-1/50 border-b border-white/[0.04]">
          <h2 className="text-sm font-medium text-text-secondary">Schedule Session</h2>
          <button onClick={onClose} className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Title Input (Large, borderless) */}
          <div>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-2xl font-semibold text-text-primary placeholder:text-text-tertiary focus:outline-none"
              placeholder="Add title..."
            />
          </div>

          {/* Type Selector (Pills) */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('focus')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                type === 'focus' ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'bg-surface-2 text-text-secondary border border-transparent hover:bg-surface-3'
              }`}
            >
              <Zap className="w-4 h-4" /> Focus Time
            </button>
            <button
              type="button"
              onClick={() => setType('meeting')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                type === 'meeting' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-surface-2 text-text-secondary border border-transparent hover:bg-surface-3'
              }`}
            >
              <Users className="w-4 h-4" /> Meeting
            </button>
            <button
              type="button"
              onClick={() => setType('break')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                type === 'break' ? 'bg-surface-3 text-text-primary border border-white/[0.1]' : 'bg-surface-2 text-text-secondary border border-transparent hover:bg-surface-3'
              }`}
            >
              <Coffee className="w-4 h-4" /> Break
            </button>
          </div>

          <div className="h-px bg-white/[0.04]" />

          {/* Date & Time Grid */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <CalIcon className="w-5 h-5 text-text-tertiary" />
              <input
                type="date"
                required
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="bg-surface-2 border border-white/[0.08] rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-brand-500 w-full"
              />
            </div>

            <div className="flex items-center gap-4 pl-9">
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="time"
                  required
                  value={startTimeStr}
                  onChange={(e) => setStartTimeStr(e.target.value)}
                  className="bg-surface-2 border border-white/[0.08] rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-brand-500 w-full"
                />
                <span className="text-text-tertiary text-sm">to</span>
                <input
                  type="time"
                  required
                  value={endTimeStr}
                  onChange={(e) => setEndTimeStr(e.target.value)}
                  className="bg-surface-2 border border-white/[0.08] rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-brand-500 w-full"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-white/[0.04]" />

          {/* Description */}
          <div className="flex gap-4">
            <AlignLeft className="w-5 h-5 text-text-tertiary mt-2" />
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-surface-2 border border-white/[0.08] rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-brand-500 resize-none"
              placeholder="Add description or meeting links..."
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-400 transition-colors shadow-lg shadow-brand-500/20"
            >
              Save to Rhythm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
