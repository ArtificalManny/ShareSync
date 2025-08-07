import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import './streak-heatmap.css'; // We'll create this for custom styles

const StreakHeatmap = ({ streakData }) => {
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  return (
    <div className="heatmap-container">
      <h3 className="font-orbitron text-center text-lg text-gray-700 dark:text-gray-300 mb-2">🔥 Activity Streak Grid</h3>
      <CalendarHeatmap
        startDate={oneYearAgo}
        endDate={today}
        values={streakData}
        classForValue={(value) => {
          if (!value || value.count === 0) {
            return 'color-empty';
          }
          if (value.count >= 3) {
            return 'color-gold';
          }
          if (value.count === 2) {
            return 'color-medium';
          }
          return 'color-light';
        }}
        tooltipDataAttrs={value =>
          value.date ? { 'data-tip': `${value.date}: 🔥 ${value.count} day streak` } : {}
        }
        showWeekdayLabels
      />
    </div>
  );
};

export default StreakHeatmap;
