// src/components/home/WeeklyNarrative.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';

export default function WeeklyNarrative() {
  const [narrative, setNarrative] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchNarrative() {
      try {
        const response = await api.get('/users/weekly-narrative');  // ✅ Fixed: removed /api/
        setNarrative(response.data);
      } catch (error) {
        console.error('Failed to fetch narrative:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchNarrative();
  }, []);
  
  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700/50 rounded w-1/3 mb-3"></div>
          <div className="h-4 bg-slate-700/50 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-slate-700/50 rounded w-1/2"></div>
        </div>
      </div>
    );
  }
  
  if (!narrative) return null;
  
  const TrendIcon = 
    narrative.shipCount.direction === 'up' ? TrendingUp :
    narrative.shipCount.direction === 'down' ? TrendingDown :
    Minus;
  
  const trendColor = 
    narrative.shipCount.direction === 'up' ? 'text-emerald-400' :
    narrative.shipCount.direction === 'down' ? 'text-orange-400' :
    'text-slate-400';
  
  return (
    <div className="glass-card" style={{
      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(236, 72, 153, 0.15))',
      border: '1px solid rgba(99, 102, 241, 0.3)',
      borderRadius: '1.5rem',
      padding: '1.5rem',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)'
    }}>
      <div className="flex items-start gap-4">
        <div 
          className="p-3 rounded-xl flex-shrink-0"
          style={{
            background: 'rgba(99, 102, 241, 0.2)',
            border: '1px solid rgba(99, 102, 241, 0.3)'
          }}
        >
          <TrendIcon className={`w-6 h-6 ${trendColor}`} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-lg text-white">This Week So Far</h3>
          </div>
          
          <div className="space-y-2 text-slate-300">
            <p className="text-sm">{narrative.shipCount.text}</p>
            <p className="text-sm">{narrative.peakTime.text}</p>
            
            <div 
              className="mt-4 pt-4" 
              style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <p className="text-purple-300 font-medium text-sm flex items-start gap-2">
                <span className="text-lg">💡</span>
                <span>{narrative.prediction.text}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
