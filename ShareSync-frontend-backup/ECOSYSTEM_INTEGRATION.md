# Ecosystem Components Integration Guide

## How to Add to Home.jsx

### 1. Add Imports (at the top of Home.jsx)
```javascript
// ⭐ ECOSYSTEM IMPORTS
import {
  EcosystemStatusBar,
  AdaptiveAIPlan,
  BurnoutAlert,
  ActivityFeed
} from '../components/ecosystem';
```

### 2. Add Components to Home Page

Find your Home component's return statement and add:
```jsx
return (
  <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #020617, #0f172a, #020617)' }}>
    <div className="max-w-7xl mx-auto px-4 py-6">
      
      {/* ⭐ ECOSYSTEM STATUS BAR */}
      <EcosystemStatusBar />
      
      {/* ⭐ ADAPTIVE AI PLAN */}
      <AdaptiveAIPlan />
      
      {/* ⭐ BURNOUT ALERT (conditional) */}
      <BurnoutAlert onDismiss={() => console.log('Dismissed')} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ⭐ ACTIVITY FEED */}
        <ActivityFeed />
        
        {/* Your existing content here */}
        {/* Projects grid, etc. */}
      </div>
    </div>
  </div>
);
```

## Components Overview

### EcosystemStatusBar
- Shows: Active projects, ships today, streaks, at-risk projects, revenue
- Mobile: Compact 3-column grid
- Desktop: 5-card grid with drill-down

### AdaptiveAIPlan
- Shows: Focus window, recommended tasks, co-work opportunities, risk alerts
- Mobile: Compact view with focus window + 2 tasks
- Desktop: Full grid with all recommendations

### BurnoutAlert
- Shows: Only when burnout risk detected (medium/high)
- Displays: Work streak, signals, recommendations
- Actions: Schedule break, dismiss

### ActivityFeed
- Shows: Real-time team activity across all projects
- Features: Pull-to-refresh, infinite scroll, load more
- Updates: Via Socket.IO (when implemented)

## Mock Data

All components currently use mock data for immediate testing.

To connect to real data:
1. Create API endpoints (see backend tasks)
2. Replace useState with API calls
3. Add Socket.IO for real-time updates

## Styling

All components:
- Match ShareSync design system
- Responsive (mobile + desktop)
- Dark mode optimized
- Glassmorphism effects
- Purple/fuchsia gradient accents
