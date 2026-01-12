import React from 'react';
import Card, { CardBody } from '../common/Card';
import { CheckCircle2, Clock } from 'lucide-react';

/**
 * YourWorld - Refined Elite UI
 * Fixes text truncation using line-clamp and sharpens typographic hierarchy.
 */
const YourWorld = ({ tasks = [
  { id: 1, title: 'Refactor Dashboard CSS', projectName: 'ShareSync v2', completed: false, dueDate: 'Today' },
  { id: 2, title: 'API Integration', projectName: 'AI Engine', completed: true, dueDate: 'Done' },
  { id: 3, title: 'User Testing', projectName: 'Mobile App', completed: false, dueDate: 'Tomorrow' }
] }) => {
  return (
    <div className="space-y-4 py-2">
      {/* Header Bonding: Tightened margins and technical metadata style */}
      <div className="flex justify-between items-end px-1">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">Your World</h2>
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] mt-0.5">Real-time Task Pulse</p>
        </div>
        <button className="text-[10px] font-black text-brand-400 uppercase tracking-widest hover:text-brand-300 transition-colors pb-1">
          View All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => (
          <Card key={task.id} interactive variant="elevated" className="bg-slate-900/40 border-white/5 hover:border-brand-500/30 transition-all duration-300">
            <CardBody className="p-4 flex flex-col h-full justify-between min-h-[140px]">
              <div className="flex items-start gap-3">
                <div className={`mt-1 flex-shrink-0 ${task.completed ? "text-success-500" : "text-brand-500"}`}>
                  {task.completed ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* ELITE FIX: line-clamp-2 allows 2 lines before truncating, text-sm makes it crisper */}
                  <h4 className="text-sm font-bold text-white leading-snug line-clamp-2 mb-1">
                    {task.title}
                  </h4>
                  <p className="text-[11px] font-medium text-neutral-500 tracking-wide">
                    {task.projectName}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                 <span className={`text-[9px] px-2 py-0.5 rounded-sm uppercase font-black tracking-wider ${
                   task.completed ? 'bg-success-500/10 text-success-500' : 'bg-brand-500/10 text-brand-400'
                 }`}>
                   {task.completed ? 'Done' : 'Active'}
                 </span>
                 <div className="flex items-center gap-1.5">
                   <Clock size={10} className="text-neutral-600" />
                   <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-tight">
                     {task.dueDate}
                   </span>
                 </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default YourWorld;
