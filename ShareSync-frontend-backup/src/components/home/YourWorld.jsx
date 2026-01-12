import React from 'react';
import Card, { CardBody } from '../common/Card';
import { CheckCircle2, Clock } from 'lucide-react';

const YourWorld = ({ tasks = [
  { id: 1, title: 'Refactor Dashboard CSS', projectName: 'ShareSync v2', completed: false, dueDate: 'Today' },
  { id: 2, title: 'API Integration', projectName: 'AI Engine', completed: true, dueDate: 'Done' },
  { id: 3, title: 'User Testing', projectName: 'Mobile App', completed: false, dueDate: 'Tomorrow' }
] }) => {
  return (
    <div className="space-y-4 py-6">
      <div className="flex justify-between items-end px-2">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Your World</h2>
          <p className="text-neutral-400 text-sm">Real-time task overview</p>
        </div>
        <button className="text-brand-400 text-sm font-medium hover:underline">View All</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => (
          <Card key={task.id} interactive variant="elevated">
            <CardBody className="flex items-start gap-3">
              <div className={task.completed ? "text-success-500" : "text-brand-500"}>
                {task.completed ? <CheckCircle2 size={18} /> : <Clock size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-white truncate">{task.title}</h4>
                <p className="text-xs text-neutral-500 mt-1">{task.projectName}</p>
                <div className="mt-3 flex items-center justify-between">
                   <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                     task.completed ? 'bg-success-500/10 text-success-500' : 'bg-brand-500/10 text-brand-500'
                   }`}>
                     {task.completed ? 'Done' : 'Active'}
                   </span>
                   <span className="text-[10px] text-neutral-600">{task.dueDate}</span>
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
