import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import './heatmap-custom.css'; // We'll create this next

const ActivityHeatmap = ({ activityData }) => {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(today.getMonth() - 3); // Show last 3 months

  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-md">
      <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Days Active (Heatmap)</h2>
      <CalendarHeatmap
        startDate={startDate}
        endDate={today}
        values={activityData}
        classForValue={value => {
          if (!value || value.count === 0) return 'color-empty';
          if (value.count >= 4) return 'color-github-4';
          if (value.count === 3) return 'color-github-3';
          if (value.count === 2) return 'color-github-2';
          return 'color-github-1';
        }}
        tooltipDataAttrs={value => ({
          'data-tip': value.date ? `${value.date} – ${value.count} activities` : 'No activity',
        })}
        showWeekdayLabels
      />
    </div>
  );
};

export default ActivityHeatmap;
