import React from 'react';

interface Project {
  _id: string;
  name: string;
  description?: string;
  admin?: string;
  color?: string;
  sharedWith?: { userId: string; role: 'Admin' | 'Editor' | 'Viewer' }[];
  status?: 'current' | 'past';
}

interface TransparencyDashboardProps {
  projects: Project[];
}

const TransparencyDashboard: React.FC<TransparencyDashboardProps> = ({ projects }) => {
  const totalTasks = projects.length * 10; // Mock data: 10 tasks per project
  const completedTasks = projects.length * 7; // Mock data: 7 completed tasks per project
  const teamActivity = projects.reduce((acc, project) => acc + (project.sharedWith?.length || 0), 0);

  return (
    <div className="transparency-dashboard glassmorphic">
      <h3>Project Overview</h3>
      <div className="dashboarda">
        <div className="dashboard-card glassmorphic">
          <h4>Total Tasks</h4>
          <p>{totalTasks}</p>
        </div>
        <div className="dashboard-card glassmorphic">
          <h4>Tasks Completed</h4>
          <p>{completedTasks}</p>
        </div>
        <div className="dashboard-card glassmorphic">
          <h4>Team Activity</h4>
          <p>{teamActivity} updates</p>
        </div>
      </div>
    </div>
  );
};

export default TransparencyDashboard;