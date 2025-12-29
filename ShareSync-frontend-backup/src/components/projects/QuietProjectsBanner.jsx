// src/components/projects/QuietProjectsBanner.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import api from '../../api/client';

export default function QuietProjectsBanner() {
  const [quietProjects, setQuietProjects] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    async function fetchQuietProjects() {
      try {
        const response = await api.get('/projects/quiet');  // ✅ Fixed: removed /api/
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
    <div 
      className="rounded-2xl p-5 mb-6"
      style={{
        background: 'rgba(234, 88, 12, 0.1)',
        border: '1px solid rgba(251, 146, 60, 0.3)',
        boxShadow: '0 4px 16px rgba(234, 88, 12, 0.1)'
      }}
    >
      <div className="flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
        
        <div className="flex-1">
          <h3 className="font-bold text-lg text-orange-300 mb-2">
            {quietProjects.count} project{quietProjects.count > 1 ? 's' : ''} been quiet for a bit
          </h3>
          <p className="text-orange-200 text-sm mb-4">
            Want to give {quietProjects.count > 1 ? 'them' : 'it'} a tiny push?
          </p>
          
          <div className="space-y-2">
            {quietProjects.projects.slice(0, 3).map(project => (
              <div 
                key={project._id}
                className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all"
                style={{
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid rgba(100, 116, 139, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(15, 23, 42, 0.7)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(15, 23, 42, 0.5)';
                }}
                onClick={() => navigate(`/projects/${project._id}`)}
              >
                <div>
                  <p className="font-medium text-white">{project.title}</p>
                  <p className="text-xs text-slate-400">
                    {project.daysSinceActivity} days since last activity
                  </p>
                </div>
                <div className="text-sm text-purple-300 hover:text-purple-200 transition-colors">
                  {project.quickWin} →
                </div>
              </div>
            ))}
          </div>
          
          {quietProjects.count > 3 && (
            <button 
              className="mt-3 text-sm text-orange-300 hover:text-orange-200 transition-colors"
              onClick={() => {
                console.log('Show all quiet projects');
              }}
            >
              View all {quietProjects.count} quiet projects →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
