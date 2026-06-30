/**
 * Analytics.jsx
 * Analytics dashboard page for cursor insights
 * 
 * Location: src/pages/Analytics.jsx
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart3, Activity, TrendingUp, ArrowLeft } from 'lucide-react';
import CursorHeatmap from '../components/analytics/CursorHeatmap';
import ActivityTimeline from '../components/analytics/ActivityTimeline';
import useDocumentTitle from "../hooks/useDocumentTitle";

export default function Analytics() {
  useDocumentTitle("Analytics");
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [timeWindow, setTimeWindow] = useState(86400); // 24 hours default

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <BarChart3 size={32} color="#8B5CF6" />
            <div>
              <h1 style={styles.title}>Cursor Analytics</h1>
              <p style={styles.subtitle}>
                Real-time insights into cursor activity and user engagement
              </p>
            </div>
          </div>

          {/* Time Window Selector */}
          <div style={styles.timeSelector}>
            <label style={styles.label}>Time Range:</label>
            <select
              value={timeWindow}
              onChange={(e) => setTimeWindow(Number(e.target.value))}
              style={styles.select}
            >
              <option value={3600}>Last Hour</option>
              <option value={86400}>Last 24 Hours</option>
              <option value={604800}>Last Week</option>
              <option value={2592000}>Last Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={styles.statsGrid}>
        <QuickStatCard
          icon={Activity}
          label="Total Activity"
          value="15.2K"
          change="+12%"
          changeType="positive"
        />
        <QuickStatCard
          icon={TrendingUp}
          label="Active Users"
          value="23"
          change="+5"
          changeType="positive"
        />
        <QuickStatCard
          icon={BarChart3}
          label="Peak Hour"
          value="14:00"
          change="2.1K moves"
          changeType="neutral"
        />
        <QuickStatCard
          icon={Activity}
          label="Avg per User"
          value="661"
          change="+8%"
          changeType="positive"
        />
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        {/* Activity Timeline */}
        <div style={styles.section}>
          <ActivityTimeline
            projectId={projectId || 'demo'}
            days={Math.ceil(timeWindow / 86400)}
          />
        </div>

        {/* Cursor Heatmap */}
        <div style={styles.section}>
          <CursorHeatmap
            projectId={projectId || 'demo'}
            timeWindow={timeWindow}
            gridSize={20}
          />
        </div>

        {/* Additional Insights */}
        <div style={styles.section}>
          <InsightsPanel projectId={projectId} />
        </div>
      </div>
    </div>
  );
}

// ============================================
// QUICK STAT CARD
// ============================================

function QuickStatCard({ icon: Icon, label, value, change, changeType }) {
  const changeColors = {
    positive: '#10B981',
    negative: '#EF4444',
    neutral: '#94A3B8',
  };

  return (
    <div style={styles.statCard}>
      <div style={styles.statHeader}>
        <Icon size={20} color="#8B5CF6" />
        <span style={styles.statLabel}>{label}</span>
      </div>
      <div style={styles.statValue}>{value}</div>
      <div
        style={{
          ...styles.statChange,
          color: changeColors[changeType],
        }}
      >
        {change}
      </div>
    </div>
  );
}

// ============================================
// INSIGHTS PANEL
// ============================================

function InsightsPanel({ projectId }) {
  return (
    <div style={styles.insightsPanel}>
      <div style={styles.insightsHeader}>
        <TrendingUp size={24} color="#8B5CF6" />
        <h3 style={styles.insightsTitle}>Key Insights</h3>
      </div>

      <div style={styles.insightsList}>
        <InsightItem
          emoji="🎯"
          text="Peak activity occurs between 2-4 PM"
          type="info"
        />
        <InsightItem
          emoji="👥"
          text="23 users active in the last 24 hours"
          type="success"
        />
        <InsightItem
          emoji="📈"
          text="Activity increased 12% from last week"
          type="success"
        />
        <InsightItem
          emoji="💡"
          text="Most engagement on left side of screen"
          type="info"
        />
      </div>

      {/* Export Options */}
      <div style={styles.exportSection}>
        <button style={styles.exportButton}>
          <BarChart3 size={16} />
          <span>Export Report</span>
        </button>
        <button style={styles.exportButton}>
          <Activity size={16} />
          <span>Download Data</span>
        </button>
      </div>
    </div>
  );
}

function InsightItem({ emoji, text, type }) {
  const typeColors = {
    success: 'rgba(16, 185, 129, 0.1)',
    info: 'rgba(139, 92, 246, 0.1)',
    warning: 'rgba(245, 158, 11, 0.1)',
  };

  return (
    <div
      style={{
        ...styles.insightItem,
        background: typeColors[type],
      }}
    >
      <span style={styles.insightEmoji}>{emoji}</span>
      <span style={styles.insightText}>{text}</span>
    </div>
  );
}

// ============================================
// STYLES
// ============================================

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B Available)',
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    color: 'white',
    fontSize: 14,
    cursor: 'pointer',
    marginBottom: 24,
    transition: 'all 0.2s',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 24,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
  },
  title: {
    color: 'white',
    fontSize: 32,
    fontWeight: 700,
    margin: 0,
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    margin: 0,
  },
  timeSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: 600,
  },
  select: {
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    color: 'white',
    fontSize: 14,
    cursor: 'pointer',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    padding: 20,
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    borderRadius: 12,
    transition: 'all 0.2s',
  },
  statHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: 500,
  },
  statValue: {
    color: 'white',
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 8,
  },
  statChange: {
    fontSize: 14,
    fontWeight: 600,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  section: {
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  insightsPanel: {
    padding: 24,
    background: '#1E293B',
    borderRadius: 16,
    border: '1px solid rgba(139, 92, 246, 0.2)',
  },
  insightsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  insightsTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
  },
  insightsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 24,
  },
  insightItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 8,
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  insightEmoji: {
    fontSize: 24,
  },
  insightText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    flex: 1,
  },
  exportSection: {
    display: 'flex',
    gap: 12,
    paddingTop: 24,
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  exportButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED Available)',
    border: 'none',
    borderRadius: 8,
    color: 'white',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    flex: 1,
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
}; 