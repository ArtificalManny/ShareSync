// src/components/projects/QuietProjectsBanner.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 7: Visual Cohesion - Quiet Projects Banner
// ═══════════════════════════════════════════════════════════════════════════════
//
// DESIGN DECISION:
// This banner alerts users to dormant projects that need attention.
// Using WARNING (amber) is semantically correct, but styled subtly.
//
// CHANGES FROM v2.0:
// - Uses design tokens instead of inline styles
// - More subtle, less alarming
// - Better integration with dark theme
// - Consistent border radius and spacing
//
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ChevronRight, Sparkles } from 'lucide-react';
import api from '../../api/client';

export default function QuietProjectsBanner() {
  const [quietProjects, setQuietProjects] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    async function fetchQuietProjects() {
      try {
        const response = await api.get('/projects/quiet');
        if (response.data.count > 0) {
          setQuietProjects(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch quiet projects:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchQuietProjects();
  }, []);
  
  if (loading) return null;
  if (!quietProjects) return null;
  
  return (
    <div className={`
      rounded-xl overflow-hidden
      bg-gradient-to-r from-warning-900/20 to-warning-800/10
      border border-warning/20
      transition-all duration-300
    `}>
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-warning/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
            <Clock className="w-4 h-4 text-warning" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-primary">
              {quietProjects.count} quiet project{quietProjects.count > 1 ? 's' : ''}
            </h3>
            <p className="text-xs text-text-tertiary">
              {quietProjects.count > 1 ? 'These need' : 'This needs'} a little momentum
            </p>
          </div>
        </div>
        
        <ChevronRight className={`
          w-4 h-4 text-text-tertiary transition-transform duration-200
          ${isExpanded ? 'rotate-90' : ''}
        `} />
      </button>
      
      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {quietProjects.projects.slice(0, 3).map(project => (
            <div 
              key={project._id}
              onClick={() => navigate(`/projects/${project._id}`)}
              className={`
                group flex items-center justify-between p-3 rounded-lg cursor-pointer
                bg-surface-1 border border-white/[0.06]
                hover:bg-surface-2 hover:border-white/[0.1]
                transition-all duration-200
              `}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-base group-hover:bg-brand/10 transition-colors">
                  {project.emoji || '📁'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate group-hover:text-brand transition-colors">
                    {project.title || project.name}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {project.daysSinceActivity} days since last activity
                  </p>
                </div>
              </div>
              
              {/* Quick Win CTA */}
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <span className="text-xs text-brand font-medium hidden sm:inline">
                  {project.quickWin}
                </span>
                <ChevronRight className="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
          
          {/* View All Link */}
          {quietProjects.count > 3 && (
            <button 
              onClick={() => navigate('/projects?filter=quiet')}
              className="
                w-full mt-2 py-2 rounded-lg text-xs font-medium
                text-text-tertiary hover:text-text-secondary
                hover:bg-surface-1 transition-all
              "
            >
              View all {quietProjects.count} quiet projects →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
