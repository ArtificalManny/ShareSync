import React from 'react';
import { Link } from 'react-router-dom';

const ProjectsPage: React.FC = () => {
  console.log('Rendering ProjectsPage');
  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>Projects</h2>
      <p style={{ fontSize: '1rem', opacity: 0.8 }}>
        View all your projects here. Navigate to a project from the sidebar or Home page.
      </p>
    </div>
  );
};

export default ProjectsPage;