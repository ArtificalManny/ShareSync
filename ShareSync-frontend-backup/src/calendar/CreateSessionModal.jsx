import React, { useState, useEffect } from 'react';
import { X, Clock, AlignLeft, Calendar as CalIcon, Zap, Users, Coffee } from 'lucide-react';


function toDateInputValue(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toTimeInputValue(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '09:00';

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function normalizeInitialType(value) {
  const type = String(value || '').toLowerCase();

  if (type === 'meeting' || type === 'standup') return 'meeting';
  if (type === 'break') return 'break';

  return 'focus';
}

function cleanEditableTitle(value, type) {
  const title = String(value || '');

  if (type === 'focus') {
    return title.replace(/^focus:\s*/i, '');
  }

  return title;
}


const SESSION_COLORS = [
  { name: 'Grape', value: '#8B5CF6' },
  { name: 'Tomato', value: '#EF4444' },
  { name: 'Tangerine', value: '#F97316' },
  { name: 'Banana', value: '#EAB308' },
  { name: 'Sage', value: '#22C55E' },
  { name: 'Peacock', value: '#06B6D4' },
  { name: 'Blueberry', value: '#3B82F6' },
  { name: 'Lavender', value: '#A855F7' },
  { name: 'Graphite', value: '#64748B' },
];

const DEFAULT_SESSION_COLOR = '#8B5CF6';

export default function CreateSessionModal({ isOpen, onClose, onSave, initialData, projectId }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('focus'); // 'focus', 'meeting', 'break'
  const [dateStr, setDateStr] = useState('');
  const [startTimeStr, setStartTimeStr] = useState('09:00');
  const [endTimeStr, setEndTimeStr] = useState('10:00');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(DEFAULT_SESSION_COLOR);

  // Populate local states when the modal opens with grid data or an existing session
  useEffect(() => {
    if (!isOpen) return;

    if (initialData?.mode === 'edit') {
      const start = initialData.startDate instanceof Date
        ? initialData.startDate
        : new Date(initialData.startDate || initialData.date);

      const end = initialData.endDate instanceof Date
        ? initialData.endDate
        : new Date(initialData.endDate || start.getTime() + Number(initialData.duration || 60) * 60000);

      const normalizedType = normalizeInitialType(initialData.type || initialData.sourceType);

      setDateStr(toDateInputValue(start));
      setStartTimeStr(toTimeInputValue(start));
      setEndTimeStr(toTimeInputValue(end));
      setTitle(cleanEditableTitle(initialData.title, normalizedType));
      setDescription(
        initialData.description ??
        initialData.notes ??
        initialData.originalData?.description ??
        initialData.originalData?.notes ??
        ''
      )

      setColor(
        initialData.color ??
        initialData.originalData?.color ??
        DEFAULT_SESSION_COLOR
      );
      setType(normalizedType);
      return;
    }

    if (initialData?.date) {
      const d = initialData.date;
      setDateStr(toDateInputValue(d));

      const sh = String(initialData.hour).padStart(2, '0');
      setStartTimeStr(`${sh}:00`);

      const eh = String(initialData.hour + 1).padStart(2, '0');
      setEndTimeStr(`${eh}:00`);

      setTitle('');
      setDescription('');
      setColor(DEFAULT_SESSION_COLOR);
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

    const sessionDescription = description ?? '';

    onSave({
      title: finalTitle,
      type: backendType,
      startTime: startObj.toISOString(), // Send as UTC
      endTime: endObj.toISOString(),
      description: sessionDescription,
      notes: sessionDescription,
      color,
      projectId: projectId,
    });

    onClose();
  };

  const typeOptions = [
    {
      id: 'focus',
      label: 'Focus Time',
      description: 'Deep work block',
      icon: Zap,
      activeClass: 'border-violet-300 bg-violet-50 text-violet-700 shadow-violet-100/70 dark:border-violet-400/30 dark:bg-violet-500/15 dark:text-violet-200',
      iconClass: 'text-violet-500',
    },
    {
      id: 'meeting',
      label: 'Meeting',
      description: 'Team sync',
      icon: Users,
      activeClass: 'border-cyan-300 bg-cyan-50 text-cyan-700 shadow-cyan-100/70 dark:border-cyan-400/30 dark:bg-cyan-500/15 dark:text-cyan-200',
      iconClass: 'text-cyan-500',
    },
    {
      id: 'break',
      label: 'Break',
      description: 'Recovery window',
      icon: Coffee,
      activeClass: 'border-amber-300 bg-amber-50 text-amber-700 shadow-amber-100/70 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200',
      iconClass: 'text-amber-500',
    },
  ];

  const inputClassName = "w-full rounded-2xl border border-slate-200 bg-white/95 dark:bg-white/[0.08] px-4 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white dark:placeholder:text-white/30 dark:focus:border-violet-400/40 dark:focus:ring-violet-500/15";

  return (
    <div className="schedule-session-clean-labels-v1 fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 px-4 pt-16 pb-8 backdrop-blur-md sm:px-5 sm:pt-16 sm:pb-10">
        <style>{`
          /* schedule-session-label-contrast-v2 */
          .schedule-session-clean-labels-v1 .schedule-field-label-plain-v1 {
            display: inline-flex !important;
            width: auto !important;
            max-width: max-content !important;
            padding: 0 !important;
            margin: 0 0 0.5rem 0 !important;
            background: transparent !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            color: rgba(255, 255, 255, 0.92) !important;
            -webkit-text-fill-color: rgba(255, 255, 255, 0.92) !important;
            text-shadow: 0 1px 14px rgba(0, 0, 0, 0.55) !important;
            opacity: 1 !important;
          }

          .dark .schedule-session-clean-labels-v1 .schedule-field-label-plain-v1 {
            color: rgba(255, 255, 255, 0.94) !important;
            -webkit-text-fill-color: rgba(255, 255, 255, 0.94) !important;
          }
        `}</style>


      <div className="relative flex h-auto max-h-[calc(100dvh-9rem)] w-full max-w-md flex-col overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/92 shadow-[0_22px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 dark:border-white/[0.08] dark:bg-[#101827]/95 dark:shadow-black/40">
        {/* Pearl/glass atmosphere */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.92),rgba(255,255,255,0.68)_32%,rgba(139,92,246,0.08)_70%,rgba(34,211,238,0.04)_Available)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.16),rgba(15,23,42,0.08)_38%,rgba(15,23,42,0)_Available)]" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl dark:bg-cyan-400/10" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-violet-300/12 blur-3xl dark:bg-violet-500/10" />
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/95 to-transparent" />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          {/* Header */}
          <div className="shrink-0 flex items-start justify-between gap-3 border-b border-slate-200/70 px-5 py-3 dark:border-white/[0.06]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-violet-600 shadow-sm shadow-violet-100 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-300">
                <Clock className="h-5 w-5" />
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
                  Rhythm Planner
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  Schedule Session
                </h2>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500 dark:text-white/45">
                  Block focused work, meetings, or recovery time into the project rhythm.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white/80 p-2 text-slate-400 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-600 hover:shadow-md dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white/40 dark:hover:text-white"
              aria-label="Close schedule session modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form id="create-session-form" onSubmit={handleSubmit} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4 pb-7 overscroll-contain">
            {/* Title Input */}
            <div>
              <label className="schedule-field-label-plain-v1 block text-xs font-black uppercase tracking-[0.16em]">Session Title</label>
              <input
                type="text"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white/95 dark:bg-white/[0.08] px-4 py-2.5 text-base font-semibold tracking-tight text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white dark:placeholder:text-white/30 dark:focus:border-violet-400/40 dark:focus:ring-violet-500/15"
                placeholder="Add title..."
              />
            </div>

            {/* Type Selector */}
            <div>
              <label className="schedule-field-label-plain-v1 block text-xs font-black uppercase tracking-[0.16em]">Session Type</label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {typeOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = type === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setType(option.id)}
                      className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-left shadow-sm transition-all hover:-translate-y-0.5 ${
                        isActive
                          ? option.activeClass
                          : 'border-slate-200 bg-white/75 text-slate-600 hover:border-violet-200 hover:bg-white hover:shadow-md dark:border-white/[0.08] dark:bg-white/[0.045] dark:text-white/70 dark:hover:bg-white/[0.075]'
                      }`}
                    >
                      <div className={`flex h-7.5 w-7.5 items-center justify-center rounded-xl ${isActive ? 'bg-white/80 dark:bg-white/[0.08]' : 'bg-slate-50 dark:bg-white/[0.04]'}`}>
                        <Icon className={`h-4 w-4 ${isActive ? option.iconClass : 'text-slate-400 dark:text-white/35'}`} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold">{option.label}</p>
                        <p className="mt-0.5 text-xs opacity-70">{option.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-white/[0.08]" />

            {/* Date & Time Grid */}
            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-[44px_1fr] sm:items-center">
                <div className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 dark:bg-white/[0.04] dark:text-white/35 sm:flex">
                  <CalIcon className="h-5 w-5" />
                </div>

                <div>
                  <label className="schedule-field-label-plain-v1 block text-xs font-black uppercase tracking-[0.16em]">Date</label>
                  <input
                    type="date"
                    required
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[44px_1fr] sm:items-start">
                <div className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 dark:bg-white/[0.04] dark:text-white/35 sm:flex">
                  <Clock className="h-5 w-5" />
                </div>

                <div>
                  <label className="schedule-field-label-plain-v1 block text-xs font-black uppercase tracking-[0.16em]">Time Window</label>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <input
                      type="time"
                      required
                      value={startTimeStr}
                      onChange={(e) => setStartTimeStr(e.target.value)}
                      className={inputClassName}
                    />
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-white/35">
                      to
                    </span>
                    <input
                      type="time"
                      required
                      value={endTimeStr}
                      onChange={(e) => setEndTimeStr(e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-white/[0.08]" />

            {/* Description */}
            <div className="grid gap-3 sm:grid-cols-[44px_1fr] sm:items-start">
              <div className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 dark:bg-white/[0.04] dark:text-white/35 sm:flex">
                <AlignLeft className="h-5 w-5" />
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="rounded-2xl border border-white/70 dark:border-white/[0.14] bg-white/95 dark:bg-white/[0.08] px-4 py-3 text-xs font-black uppercase tracking-[0.28em] text-slate-700 dark:text-violet-100 shadow-[0_10px_30px_rgba(15,23,42,0.10)]">
                    Session Color
                  </div>

                  <div className="flex flex-wrap gap-3 rounded-3xl border border-white/45 bg-white/45 dark:bg-white/[0.08] p-4 shadow-inner">
                    {SESSION_COLORS.map((option) => {
                      const isSelected = color === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setColor(option.value)}
                          aria-label={`Use ${option.name}`}
                          title={option.name}
                          className="h-10 w-10 rounded-full border-2 border-white/80 shadow-lg transition hover:-translate-y-0.5 hover:scale-105"
                          style={{
                            backgroundColor: option.value,
                            boxShadow: isSelected
                              ? `0 0 0 3px rgba(255,255,255,0.95), 0 0 0 6px ${option.value}`
                              : '0 8px 18px rgba(15,23,42,0.18)',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="schedule-field-label-plain-v1 block text-xs font-black uppercase tracking-[0.16em]">Notes</label>

                <textarea
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`${inputClassName} min-h-[64px] resize-none leading-relaxed`}
                  placeholder="Add description or meeting links..."
                />
                </div>
              </div>
            </div>

          </form>

          {/* Footer Actions */}
          <div className="relative z-10 shrink-0 border-t border-slate-200/70 bg-white/95 dark:bg-white/[0.08] px-5 py-3 backdrop-blur-md dark:border-white/[0.06] dark:bg-[#101827]/95">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-5 py-3 text-sm font-bold text-white/70 transition-colors hover:bg-white/12 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="create-session-form"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-violet-200/70 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-700 px-6 py-3 text-sm font-black text-white shadow-[0_18px_48px_rgba(124,58,237,0.42)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(124,58,237,0.55)] focus:outline-none focus:ring-4 focus:ring-violet-300/35"
              >
                <Zap className="h-4 w-4" />
                {initialData?.mode === 'edit' ? 'Update Session' : 'Add Session'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
