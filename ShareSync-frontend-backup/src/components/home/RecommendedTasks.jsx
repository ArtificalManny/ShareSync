import React from 'react';
import Card, { CardHeader, CardBody } from '../common/Card';
import Button from '../common/Button';
import { Zap, Star, AlertCircle } from 'lucide-react';

const RecommendedTasks = ({ recommendations = [
  { id: 1, title: 'Finalize UI Components', reason: 'High impact on sprint goal', impact: 'High', estimatedTime: '45m', priority: 'high' },
  { id: 2, title: 'Update Documentation', reason: 'Onboard new members faster', impact: 'Medium', estimatedTime: '20m', priority: 'normal' }
] }) => {
  return (
    <Card variant="flat" className="bg-slate-800/40 border-white/5 backdrop-blur-sm mt-8">
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="text-warning-500" size={20} />
          <h3 className="text-lg font-bold text-white">Recommended for You</h3>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 bg-warning-500/10 text-warning-500 rounded uppercase tracking-wider">
          AI Priority
        </span>
      </CardHeader>
      
      <CardBody className="space-y-4">
        {recommendations.map((item) => (
          <div 
            key={item.id}
            className="p-4 rounded-xl bg-slate-900/50 border border-white/5 hover:border-brand-500/30 transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-white group-hover:text-brand-400 transition-colors">
                    {item.title}
                  </h4>
                  {item.priority === 'high' && <AlertCircle size={14} className="text-danger-500" />}
                </div>
                <p className="text-sm text-neutral-400 mt-1">{item.reason}</p>
              </div>
              <Button variant="tertiary" size="sm" className="shrink-0">Start</Button>
            </div>
            
            <div className="mt-4 flex items-center gap-4 text-[10px] font-medium text-neutral-500 uppercase tracking-widest">
              <span className="flex items-center gap-1">
                <Star size={12} className="text-warning-500" /> {item.impact} Impact
              </span>
              <span>•</span>
              <span>{item.estimatedTime}</span>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
};

export default RecommendedTasks;
