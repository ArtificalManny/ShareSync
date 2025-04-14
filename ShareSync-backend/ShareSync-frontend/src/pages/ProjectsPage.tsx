import React, { useState } from 'react';
import Projects from './Projects';

const ProjectsPage: React.FC = () => {
  const [user, ] = useState<{ username: string } | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  return <Projects user={user} />;
};

export default ProjectsPage;