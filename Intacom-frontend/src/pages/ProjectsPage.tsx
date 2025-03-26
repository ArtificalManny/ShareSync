import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface Project {
  _id: string;
  name: string;
  description?: string;
  admin?: string;
  color?: string;
  sharedWith?: { userId: string; role: 'Admin' | 'Editor' | 'Viewer' }[];
}

interface ProjectsResponse {
  data?: Project[];
  [key: number]: Project;
  length?: number;
}

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [user, setUser] = useState<{ username: string } | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user) {
      const fetchProjects = async () => {
        try {
          const response = await axios.get<ProjectsResponse>(`http://localhost:3000/projects/${user.username}`);
          const projectsData = response.data.data || (Array.isArray(response.data) ? response.data : []);
          setProjects(projectsData);
        } catch (error: any) {
          console.error('Failed to fetch projects:', error.response?.data || error.message);
          setProjects([]);
          setErrorMessage(error.response?.data?.error || 'Failed to fetch projects. Please ensure the backend server is running.');
        }
      };
      fetchProjects();
    }
  }, [user]);

  console.log('Rendering ProjectsPage');
  return (
    <div className="projects-container">
      <h2>Projects</h2>
      <p>View and manage all your projects here.</p>
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {projects.length === 0 ? (
        <p>No projects found. Create a project to get started!</p>
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <div
              key={project._id}
              className="project-card glassmorphic"
              style={{
                borderLeft: `4px solid ${project.color || '#3a3a50'}`,
              }}
            >
              <Link to={`/project/${project._id}`}>
                <h4>{project.name}</h4>
              </Link>
              <p>{project.description || 'No description'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;