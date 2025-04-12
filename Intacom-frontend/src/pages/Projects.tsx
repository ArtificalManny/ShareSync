import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { theme } from '../styles/theme';

interface Project {
  _id: string;
  name: string;
  description: string;
}

interface User {
  username: string;
}

interface ProjectsProps {
  user: User | null;
}

const Projects: React.FC<ProjectsProps> = ({ user }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/${user.username}`);
      setProjects(response.data.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  return (
    <div>
      <h1>Your Projects</h1>
      <button onClick={() => navigate('/project/create')}>Create New Project</button>
      {projects.map((project) => (
        <div key={project._id} onClick={() => navigate(`/project/${project._id}`)}>
          <h3>{project.name}</h3>
          <p>{project.description}</p>
        </div>
      ))}
    </div>
  );
};

export default Projects;