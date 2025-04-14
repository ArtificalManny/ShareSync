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
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/${user.username}`);
      setProjects(response.data.data || []);
    } catch (err: any) {
      console.error('Projects.tsx: Error fetching projects:', err.message);
      setError('Failed to load projects. Please ensure you are logged in and try again.');
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
        <h1 style={styles.heading}>📂 Projects - ShareSync</h1>
        <p style={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>📂 Projects - ShareSync</h1>
      {projects.length > 0 ? (
        <ul style={styles.projectList}>
          {projects.map((project) => (
            <li
              key={project._id}
              style={styles.projectItem}
              onClick={() => handleProjectClick(project._id)}
            >
              <h3 style={styles.projectTitle}>{project.name}</h3>
              <p style={styles.text}>{project.description}</p>
              <p style={styles.text}>Created by: {project.creatorEmail}</p>
              <p style={styles.text}>Created on: {new Date(project.createdAt).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p style={styles.text}>No projects yet.</p>
      )}
    </div>
  );
};

// Futuristic styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px',
    background: 'linear-gradient(145deg, #1E1E2F, #2A2A4A)',
    color: '#A2E4FF',
    minHeight: '100vh',
    animation: 'fadeIn 1s ease-in-out',
  },
  heading: {
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '32px',
    textAlign: 'center',
    marginBottom: '30px',
    textShadow: '0 0 15px #A2E4FF',
  },
  projectList: {
    listStyleType: 'none',
    padding: 0,
  },
  projectItem: {
    padding: '20px',
    marginBottom: '15px',
    background: 'linear-gradient(145deg, #2A2A4A, #3F3F6A)',
    borderRadius: '12px',
    border: '1px solid #A2E4FF',
    boxShadow: '0 0 15px rgba(162, 228, 255, 0.2)',
    cursor: 'pointer',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  projectTitle: {
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '20px',
    marginBottom: '10px',
    color: '#A2E4FF',
    textShadow: '0 0 5px #A2E4FF',
  },
  error: {
    color: '#FF6F91',
    fontFamily: '"Orbitron", sans-serif',
  },
  text: {
    fontFamily: '"Orbitron", sans-serif',
    color: '#A2E4FF',
  },
};

// Add animations
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`, styleSheet.cssRules.length);
styleSheet.insertRule(`
  li:hover {
    transform: translateY(-5px);
    box-shadow: 0 0 20px rgba(162, 228, 255, 0.5);
  }
`, styleSheet.cssRules.length);

export default Projects;