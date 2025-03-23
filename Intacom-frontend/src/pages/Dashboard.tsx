import React from 'react';
import { Link } from 'react-router-dom';

interface Project {
  _id: string;
  name: string;
  description?: string;
  admin?: string;
  color?: string;
}

interface DashboardProps {
  projects: Project[];
}

const Dashboard: React.FC<DashboardProps> = ({ projects }) => {
  return (
    <div style={{ padding: '2rem' }}>
      <h2>Dashboard</h2>
      <p>Manage your projects and tasks here.</p>
      {projects.length === 0 ? (
        <p>No projects yet. Create a project to get started!</p>
      ) : (
        <div>
          <h3>Your Projects</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {projects.map((project) => (
              <div
                key={project._id}
                style={{
                  background: project.color || '#3a3a50',
                  padding: '1rem',
                  borderRadius: '5px',
                  width: '200px',
                }}
              >
                <Link to={`/project/${project._id}`} style={{ color: '#b0b0ff' }}>
                  <h4>{project.name}</h4>
                </Link>
                <p>{project.description || 'No description'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;