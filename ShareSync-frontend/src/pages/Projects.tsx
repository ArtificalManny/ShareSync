import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Project {
  _id: string;
  name: string;
  description: string;
  creatorEmail: string;
  createdAt: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
}

interface ProjectsProps {
  user: User | null;
}

const Projects: React.FC<ProjectsProps> = ({ user }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    if (!user) {
      setError('Please log in to view projects.');
      return;
    }
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/${user.username}`, {
        withCredentials: true,
      });
      setProjects(response.data.data || []);
    } catch (err: any) {
      console.error('Projects.tsx: Error fetching projects:', err.message);
      setError('Failed to load projects. Please ensure the backend is running and try again.');
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const handleProjectClick = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  if (error) {
    return (
      <div style={styles.container}>
        <h1>📂 Projects - ShareSync</h1>
        <p style={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1>📂 Projects - ShareSync</h1>
      {projects.length > 0 ? (
        <ul style={styles.projectList}>
          {projects.map((project) => (
            <li
              key={project._id}
              style={styles.projectItem}
              onClick={() => handleProjectClick(project._id)}
            >
              <h3>{project.name}</h3>
              <p>{project.description}</p>
              <p>Created by: {project.creatorEmail}</p>
              <p>Created on: {new Date(project.createdAt).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No projects yet.</p>
      )}
    </div>
  );
};

// Inline styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#0A192F',
    color: '#FFFFFF',
  },
  projectList: {
    listStyleType: 'none',
    padding: 0,
  },
  projectItem: {
    padding: '15px',
    marginBottom: '10px',
    backgroundColor: '#1A3C34',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  error: {
    color: '#EF5350',
  },
};

export default Projects;