import React from 'react';
import { Circle, Clock, ArrowRight } from 'lucide-react';
import Card, { CardHeader, CardBody, CardFooter } from '../common/Card';
import Button from '../common/Button';

const TaskItem = ({ title, project, time, status = "info" }) => {
  const dotColors = {
    brand: "text-purple-500",
    warning: "text-amber-500",
    info: "text-blue-500",
    success: "text-emerald-500"
  };

  return (
    <div className="group flex items-center justify-between p-4 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 transition-all cursor-pointer">
      <div className="flex items-center gap-4">
        <Circle className={`w-5 h-5 ${dotColors[status]} group-hover:scale-110 transition-transform`} />
        <div>
          <div className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">{title}</div>
          <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
            <span className="text-purple-400/80 font-semibold">{project}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {time}
            </span>
          </div>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-white transition-all transform group-hover:translate-x-1" />
    </div>
  );
};

export default function RecommendedTasks() {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Recommended Quests</h3>
        <Button variant="ghost" size="sm">View All</Button>
      </CardHeader>
      
      <CardBody className="space-y-1 flex-grow">
        <TaskItem title="Fix login page CSS" project="ShareSync v2" time="25m" status="brand" />
        <TaskItem title="Review API Documentation" project="AI Writer" time="15m" status="warning" />
        <TaskItem title="Draft Weekly Report" project="Freelance" time="45m" status="info" />
      </CardBody>
      
      <CardFooter className="bg-white/5">
        <div className="text-xs text-center text-slate-500 italic">
          3 tasks remaining for your daily goal
        </div>
      </CardFooter>
    </Card>
  );
}
