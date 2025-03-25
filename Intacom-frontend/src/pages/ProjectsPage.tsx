import React from 'react';
import { Link } from 'react-router-dom';

const ProjectsPage: React.FC = () => {
  console.log('Rendering ProjectsPage');
  return (
    <div className="intacom-projects">
      <h2>Projects</h2>
      <p>View all your projects here. Navigate to a project from the sidebar or Home page.</p>
    </div>
  );
};

export default ProjectsPage;