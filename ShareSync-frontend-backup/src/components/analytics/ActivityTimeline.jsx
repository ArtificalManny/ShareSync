/**
 * ActivityTimeline.jsx
 * 24-hour cursor activity timeline
 * 
 * Shows activity patterns throughout the day
 */

import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, Users, Zap } from 'lucide-react';

export function ActivityTimeline({ projectId, days = 1 }) {
  const [activityData, setActivityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedHour, setSelectedHour] = useState(null);

  useEffect(() => {
    fetchActivityData();
  }, [projectId, days]);

  const fetchActivityData = async () => {
    try {
      setLoading(true);
      const endTime = Date.now();
      const startTime = endTime - days * 24 * 60 * 60 * 1000;

      const response = await fetch(
        `/api/cursors/history?projectId=${projectId}&startTime=${new Date(startTime).toISOString()}&endTime=${new Date(endTime).toISOString()}&limit=10000`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      const cursors = await response.json();

      // Group by hour
      const hourlyActivity = Array(24).fill(0).map(() => ({ count: 0, users: new Set() }));

      cursors.forEach(cursor => {
        const hour = new Date(cursor.timestamp).getHours();
        hourlyActivity[hour].count++;
        hourlyActivity[hour].users.add(cursor.userId);
      });

      // Convert Sets to counts
      const processed = hourlyActivity.map((h, hour) => ({
        hour,
        count: h.count,
        users: h.users.size,
        label: `${hour.toString().padStart(2, '0')}:00`,
      }));

      setActivityData(processed);
    } catch (error) {
      console.error('Failed to fetch activity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Clock size={32} color="#8B5CF6" />
        <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 16 }}>
          Loading activity...
        </p>
      </div>
    );
  }

  if (!activityData) return null;

  const maxActivity = Math.max(...activityData.map(d => d.count));
  const peakHour = activityData.reduce((max, d) => d.count > max.count ? d : max, activityData[0]);

  return (
    <div style={{ padding: 24, background: '#1E293B', borderRadius: 16 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Clock size={24} color="#8B5CF6" />
          <h2 style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: 0 }}>
            24-Hour Activity Timeline
          </h2>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>
          Cursor movements and user activity throughout the day
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard
          icon={TrendingUp}
          label="Peak Hour"
          value={peakHour.label}
          subtitle={`${peakHour.count} movements`}
          color="#10B981"
        />
        <StatCard
          icon={Zap}
          label="Total Activity"
          value={activityData.reduce((sum, d) => sum + d.count, 0).toLocaleString()}
          subtitle="movements"
          color="#8B5CF6"
        />
        <StatCard
          icon={Users}
          label="Active Users"
          value={Math.max(...activityData.map(d => d.users))}
          subtitle="peak users"
          color="#F59E0B"
        />
      </div>

      {/* Timeline Chart */}
      <div style={{ background: '#0F172A', borderRadius: 12, padding: 24 }}>
        <div style={{ display: 'flex', height: 200, alignItems: 'flex-end', gap: 4 }}>
          {activityData.map((data, index) => {
            const heightPercent = maxActivity > 0 ? (data.count / maxActivity) * 100 : 0;
            const isSelected = selectedHour === index;
            const isPeak = data.hour === peakHour.hour;

            return (
              <div
                key={index}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  opacity: isSelected ? 1 : 0.7,
                  transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={() => setSelectedHour(index)}
                onMouseLeave={() => setSelectedHour(null)}
              >
                {/* Bar */}
                <div
                  style={{
                    width: '100%',
                    height: `${heightPercent}%`,
                    minHeight: data.count > 0 ? 4 : 0,
                    background: isPeak
                      ? 'linear-gradient(180deg, #10B981 0%, #059669 100%)'
                      : isSelected
                      ? 'linear-gradient(180deg, #8B5CF6 0%, #7C3AED 100%)'
                      : 'linear-gradient(180deg, #475569 0%, #334155 100%)',
                    borderRadius: '4px 4px 0 0',
                    position: 'relative',
                    boxShadow: isPeak
                      ? '0 0 16px rgba(16, 185, 129, 0.5)'
                      : isSelected
                      ? '0 0 16px rgba(139, 92, 246, 0.5)'
                      : 'none',
                  }}
                >
                  {/* Tooltip */}
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '8px 12px',
                        background: 'rgba(0, 0, 0, 0.9)',
                        borderRadius: 8,
                        whiteSpace: 'nowrap',
                        marginBottom: 8,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                      }}
                    >
                      <div style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>
                        {data.label}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4 }}>
                        {data.count} movements
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
                        {data.users} users
                      </div>
                    </div>
                  )}
                </div>

                {/* Hour Label */}
                <div
                  style={{
                    color: isSelected ? 'white' : 'rgba(255,255,255,0.4)',
                    fontSize: 10,
                    fontWeight: isSelected ? 600 : 400,
                    transition: 'all 0.2s',
                  }}
                >
                  {data.hour % 3 === 0 ? data.label : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights */}
      <div style={{ marginTop: 24, padding: 16, background: 'rgba(139, 92, 246, 0.1)', borderRadius: 12, border: '1px solid rgba(139, 92, 246, 0.3)' }}>
        <h3 style={{ color: 'white', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
          📊 Activity Insights
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <InsightItem text={`Peak activity at ${peakHour.label} with ${peakHour.count} movements`} />
          <InsightItem text={`Average ${Math.round(activityData.reduce((sum, d) => sum + d.count, 0) / 24)} movements per hour`} />
          <InsightItem text={`Most active period: ${getActivePeriod(activityData)}`} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtitle, color }) {
  return (
    <div style={{ padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon size={16} color={color} />
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{label}</span>
      </div>
      <div style={{ color: 'white', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{value}</div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{subtitle}</div>
    </div>
  );
}

function InsightItem({ text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#8B5CF6' }} />
      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{text}</span>
    </div>
  );
}

function getActivePeriod(data) {
  // Find 3-hour window with most activity
  let maxSum = 0;
  let maxStart = 0;

  for (let i = 0; i < 24 - 2; i++) {
    const sum = data[i].count + data[i + 1].count + data[i + 2].count;
    if (sum > maxSum) {
      maxSum = sum;
      maxStart = i;
    }
  }

  return `${data[maxStart].label} - ${data[maxStart + 2].label}`;
}

export default ActivityTimeline;