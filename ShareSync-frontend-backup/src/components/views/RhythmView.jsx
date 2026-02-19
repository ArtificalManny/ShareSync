import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus, ChevronLeft, ChevronRight, Clock,
  Zap, Sun, Moon, Coffee, Brain, Shield
} from 'lucide-react';
import { getProjectRhythm, createEvent } from '../../api/calendar';
import CreateSessionModal from '../../calendar/CreateSessionModal';

const TIME_SLOTS = [
  { hour: 8, label: '8 AM' },
  { hour: 9, label: '9 AM' },
  { hour: 10, label: '10 AM' },
  { hour: 11, label: '11 AM' },
  { hour: 12, label: '12 PM' },
  { hour: 13, label: '1 PM' },
  { hour: 14, label: '2 PM' },
  { hour: 15, label: '3 PM' },
  { hour: 16, label: '4 PM' },
  { hour: 17, label: '5 PM' },
  { hour: 18, label: '6 PM' },
];

const ENERGY_ZONES = [
  { hours: [8, 9, 10, 11], label: 'High Energy', icon: Sun, color: 'text-warning-400', bg: 'bg-warning-500/5' },
  { hours: [12, 13, 14], label: 'Medium Energy', icon: Coffee, color: 'text-cyan-400', bg: 'bg-cyan-500/5' },
  { hours: [15, 16, 17, 18], label: 'Lower Energy', icon: Moon, color: 'text-purple-400', bg: 'bg-purple-500/5' },
];

function CalendarEvent({ event }) {
  const getEventColor = () => {
    switch (event.type) {
      case 'focus': return 'bg-brand-500/20 border-brand-500/30 text-brand-400 shadow-md shadow-brand-500/10';
      case 'meeting': return 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400 shadow-md shadow-cyan-500/10';
      case 'task': return 'bg-success-500/20 border-success-500/30 text-success-400 shadow-md shadow-success-500/10';
      default: return 'bg-surface-2 border-white/[0.08] text-text-secondary';
    }
  };
  
  const height = (event.duration / 60) * 64; 
  
  return (
    <div
      className={`absolute left-1 right-1 rounded-lg border px-3 py-2 cursor-pointer hover:brightness-125 transition-all z-20 overflow-hidden ${getEventColor()}`}
      style={{ 
        top: `${((event.startHour - 8) + event.startMinute / 60) * 64}px`,
        height: `${Math.max(height, 48)}px`
      }}
    >
      <div className="font-medium text-sm truncate">{event.title}</div>
      {height >= 48 && (
        <div className="text-xs opacity-80 mt-0.5">
          {event.startHour > 12 ? event.startHour - 12 : event.startHour}:{String(event.startMinute).padStart(2, '0')} {event.startHour >= 12 ? 'PM' : 'AM'}
        </div>
      )}
    </div>
  );
}

function DayColumn({ day, events, isToday, workload, onAddEvent }) {
  const getWorkloadColor = () => {
    if (workload > 100) return 'bg-error-500';
    if (workload > 80) return 'bg-warning-500';
    if (workload > 50) return 'bg-success-500';
    return 'bg-cyan-500';
  };
  
  return (
    <div className="flex-1 min-w-[140px] border-r border-white/[0.04] last:border-r-0">
      <div className={`sticky top-0 z-30 px-3 py-3 border-b border-white/[0.06] ${isToday ? 'bg-brand-500/10' : 'bg-surface-0'}`}>
        <div className="text-center">
          <div className={`text-sm font-medium ${isToday ? 'text-brand-400' : 'text-text-secondary'}`}>{day.dayName}</div>
          <div className={`text-2xl font-bold ${isToday ? 'text-brand-400' : 'text-text-primary'}`}>{day.date}</div>
        </div>
        <div className="mt-2 h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-300 ${getWorkloadColor()}`} style={{ width: `${Math.min(workload, 100)}%` }} />
        </div>
      </div>
      
      <div className="relative bg-surface-0/50">
        {TIME_SLOTS.map((slot) => {
          const zone = ENERGY_ZONES.find(z => z.hours.includes(slot.hour));
          return (
            <div 
              key={slot.hour}
              className={`h-16 border-b border-white/[0.04] cursor-pointer hover:bg-white/[0.03] transition-colors relative group ${zone?.bg || ''}`}
              onClick={() => onAddEvent(day.fullDate, slot.hour)}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus className="w-5 h-5 text-text-tertiary" />
              </div>
            </div>
          );
        })}
        {events.map(event => <CalendarEvent key={event.id} event={event} />)}
      </div>
    </div>
  );
}

function EnergySidebar() {
  return (
    <div className="w-24 flex-shrink-0 border-r border-white/[0.06] bg-surface-0 z-20">
      <div className="h-[88px] border-b border-white/[0.06]" />
      {TIME_SLOTS.map((slot) => {
        const zone = ENERGY_ZONES.find(z => z.hours.includes(slot.hour));
        const Icon = zone?.icon || Clock;
        const isZoneStart = zone?.hours[0] === slot.hour;
        
        return (
          <div key={slot.hour} className="h-16 relative border-b border-white/[0.04]">
            <div className="absolute -top-3 left-3 text-xs font-medium text-text-tertiary bg-surface-0 px-1">{slot.label}</div>
            {isZoneStart && (
              <div className={`absolute top-1/2 -translate-y-1/2 right-2 ${zone.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function RhythmView({ projectId }) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [realEvents, setRealEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  // ✅ FIX: STRICT BOUNDARIES. Clamp to exact 00:00:00 of the correct day.
  const weekDays = useMemo(() => {
    const start = new Date(currentWeek);
    start.setHours(0, 0, 0, 0); // Absolute midnight
    start.setDate(start.getDate() - start.getDay() + 1); // Monday
    
    return Array.from({ length: 5 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return {
        date: date.getDate(),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: date, // Safely 00:00:00
        isToday: date.toDateString() === new Date().toDateString()
      };
    });
  }, [currentWeek]);

  const loadRhythmData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      // Form absolute boundary strings
      const startBound = new Date(weekDays[0].fullDate);
      startBound.setHours(0, 0, 0, 0);
      
      const endBound = new Date(weekDays[4].fullDate);
      endBound.setHours(23, 59, 59, 999);
      
      const payload = await getProjectRhythm(projectId, startBound.toISOString(), endBound.toISOString());
      
      console.log("📅 Loaded Rhythm Payload:", payload); // Debug Log
      
      if (payload?.data) {
        const mapped = payload.data.map(item => {
          const startDate = new Date(item.startAt);
          const endDate = new Date(item.endAt);
          const dayIndex = startDate.getDay() - 1; // 0=Mon, 4=Fri

          let duration = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
          if (isNaN(duration) || duration <= 0) duration = 60; // Fallback

          let uiType = 'task';
          if (item.type === 'event' || item.type === 'meeting') uiType = 'meeting';
          if (item.title.toLowerCase().includes('focus')) uiType = 'focus';
          
          return {
            id: item.id,
            title: item.title,
            type: uiType,
            startHour: startDate.getHours(),
            startMinute: startDate.getMinutes(),
            duration: duration,
            day: dayIndex,
          };
        }).filter(e => e.day >= 0 && e.day <= 4); 

        setRealEvents(mapped);
      }
    } catch (err) {
      console.error("Failed to load Rhythm timeline", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRhythmData();
  }, [projectId, currentWeek]);

  const handleAddEventClick = (date, hour) => {
    setSelectedSlot({ date, hour });
    setIsModalOpen(true);
  };

  const handleSaveSession = async (eventData) => {
    try {
      await createEvent(eventData);
      console.log("✅ Successfully created event");
      await loadRhythmData(); // Instantly fetch to update grid
    } catch (err) {
      console.error("Failed to save event", err);
      alert("Failed to save session! Check the console.");
    }
  };

  const workloads = weekDays.map((_, idx) => {
    const dayEvents = realEvents.filter(e => e.day === idx);
    const totalMinutes = dayEvents.reduce((sum, e) => sum + e.duration, 0);
    return Math.round((totalMinutes / 480) * 100);
  });

  return (
    <div className="p-10 max-w-full mx-auto pb-32">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleAddEventClick(new Date(), 9)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-400 transition-all shadow-lg shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Session</span>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => { const p = new Date(currentWeek); p.setDate(p.getDate() - 7); setCurrentWeek(p); }} className="p-2 rounded-lg hover:bg-surface-2 text-text-tertiary transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={() => setCurrentWeek(new Date())} className="px-4 py-2 rounded-xl bg-surface-1 border border-white/[0.08] text-sm text-text-secondary hover:bg-surface-2 transition-colors">Today</button>
          <div className="px-4 py-2 rounded-xl bg-surface-1 border border-white/[0.08]">
            <span className="text-sm font-medium text-text-primary">
              {weekDays[0].fullDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
              {weekDays[4].fullDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <button onClick={() => { const n = new Date(currentWeek); n.setDate(n.getDate() + 7); setCurrentWeek(n); }} className="p-2 rounded-lg hover:bg-surface-2 text-text-tertiary transition-colors"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>
      
      <div className="flex gap-6">
        <div className="flex-1 rounded-2xl border border-white/[0.08] bg-surface-0 overflow-hidden relative shadow-xl">
          {loading && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
               <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <div className="flex">
            <EnergySidebar />
            {weekDays.map((day, idx) => (
              <DayColumn key={idx} day={day} events={realEvents.filter(e => e.day === idx)} isToday={day.isToday} workload={workloads[idx]} onAddEvent={handleAddEventClick} />
            ))}
          </div>
        </div>
      </div>

      <CreateSessionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={selectedSlot}
        onSave={handleSaveSession}
        projectId={projectId}
      />
    </div>
  );
}
