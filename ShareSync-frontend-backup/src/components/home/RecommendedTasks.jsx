// src/components/home/RecommendedTasks.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM v2.0 - "Breathing Card System"
// ═══════════════════════════════════════════════════════════════════════════════
// 3-ELEMENT RULE APPLIED:
// Each task has: 1) Title  2) Reason/context  3) Time estimate
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import Card, { CardBadge } from '../common/Card';
import Button from '../common/Button';
import { Zap, Clock } from 'lucide-react';

const RecommendedTasks = ({ recommendations = [
  { id: 1, title: 'Finalize UI Components', reason: 'High impact on sprint goal', estimatedTime: '45m', priority: 'high' },
  { id: 2, title: 'Update Documentation', reason: 'Onboard new members faster', estimatedTime: '20m', priority: 'normal' }
] }) => {
  return (
    <Card variant="ambient" padding="none" className="mt-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-warning" />
          <h3 className="text-sm font-semibold text-text-primary">Recommended for You</h3>
        </div>
        <CardBadge variant="warning">AI Priority</CardBadge>
      </div>
      
      {/* Task List */}
      <div className="p-3 space-y-2">
        {recommendations.map((item) => (
          <Card
            key={item.id}
            variant={item.priority === 'high' ? 'elevated' : 'ambient'}
            interactive
            animated
            padding="sm"
            className="group"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Element 1: Title */}
                <h4 className="text-sm font-medium text-text-primary group-hover:text-brand transition-colors truncate">
                  {item.title}
                </h4>
                
                {/* Element 2: Reason */}
                <p className="text-xs text-text-tertiary mt-0.5 truncate">
                  {item.reason}
                </p>
              </div>
              
              {/* Element 3: Time + Action */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-text-tertiary flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {item.estimatedTime}
                </span>
                <Button 
                  variant="tertiary" 
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Start
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};

export default RecommendedTasks;
