import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

interface Project {
  _id: string;
  name: string;
  description: string;
  creatorEmail: string;
  sharedWith: string[];
  createdAt: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
}

interface ProjectHomeProps {
  user: User | null;
}

const ProjectHome: React.FC<ProjectHomeProps> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!user || !id) {
        setError('Please log in to view this project.');
        return;
      }
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/by-id/${id}`);
        setProject(response.data.data);
      } catch (err: any) {
        console.error('ProjectHome.tsx: Error fetching project:', err.message);
        setError('Failed to load project. Please ensure you are logged in and try again.');
      }
    };
    fetchProject();
  }, [user, id]);

  if (error) {
    return (
      <div style={styles.container}>
        <h1 style={styles.heading}>Project Home - ShareSync</h1>
        <p style={styles.error}>{error}</p>
      </div>
    );
  }

  if (!project) {
    return <div style={styles.container}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>{project.name} - ShareSync</h1>
      <div style={styles.section}>
        <h2 style={styles.subHeading}>Project Details</h2>
        <p style={styles.text}><strong>Description:</strong> {project.description}</p>
        <p style={styles.text}><strong>Created by:</strong> {project.creatorEmail}</p>
        <p style={styles.text}><strong>Created on:</strong> {new Date(project.createdAt).toLocaleDateString()}</p>
        <p style={styles.text}><strong>Shared with:</strong> {project.sharedWith.join(', ') || 'None'}</p>
      </div>
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
  section: {
    background: 'linear-gradient(145deg, #2A2A4A, #3F3F6A)',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 0 15px rgba(162, 228, 255, 0.2)',
    border: '1px solid #A2E4FF',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  subHeading: {
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '22px',
    marginBottom: '15px',
    textShadow: '0 0 10px #A2E4FF',
  },
  error: {
    color: '#FF6F91',
    fontFamily: '"Orbitron", sans-serif',
  },
  text: {
    fontFamily: '"Orbitron", sans-serif',
    color: '#A2E4FF',
    marginBottom: '10px',
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
  div[style*="background: linear-gradient(145deg, #2A2A4A, #3F3F6A)"]:hover {
    transform: translateY(-5px);
    box-shadow: 0 0 20px rgba(162, 228, 255, 0.5);
  }
`, styleSheet.cssRules.length);

export default ProjectHome;