import React from 'react';
import Card, { CardBody, CardFooter } from '../common/Card';
import { Layers, Users, Calendar } from 'lucide-react';

const ProjectCard = ({ project }) => {
  const { name, client, progress, members, dueDate, status } = project;
  
  return (
    <Card interactive variant="elevated" className="h-full flex flex-col">
      <CardBody className="flex-1">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
            <Layers size={20} />
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
            progress === 100 ? 'bg-success-500/10 text-success-500' : 'bg-slate-700 text-slate-300'
          }`}>
            {status || (progress === 100 ? 'Completed' : 'Active')}
          </span>
        </div>

        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-brand-400 transition-colors">
          {name}
        </h3>
        <p className="text-sm text-neutral-400 mb-6">{client}</p>

        {/* Progress Bar Section */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-500 font-medium">Progress</span>
            <span className="text-white font-bold">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                progress === 100 ? 'bg-success-500' : 'bg-brand-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardBody>

      <CardFooter className="bg-slate-900/30 flex items-center justify-between">
        <div className="flex -space-x-2">
          {/* Representative member dots */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-800 bg-slate-700 flex items-center justify-center text-[10px] text-white font-bold">
              {String.fromCharCode(64 + i)}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 text-xs text-neutral-500">
          <Calendar size={12} />
          <span>{dueDate}</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;
