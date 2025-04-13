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
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/by-id/${id}`, {
          withCredentials: true,
        });
        setProject(response.data.data);
      } catch (err: any) {
        console.error('ProjectHome.tsx: Error fetching project:', err.message);
        setError('Failed to load project. Please ensure the backend is running and try again.');
      }
    };
    fetchProject();
  }, [user, id]);

  if (error) {
    return (
      <div style={styles.container}>
        <h1>Project Home - ShareSync</h1>
        <p style={styles.error}>{error}</p>
      </div>
    );
  }

  if (!project) {
    return <div style={styles.container}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <h1>{project.name} - ShareSync</h1>
      <div style={styles.section}>
        <h2>Project Details</h2>
        <p><strong>Description:</strong> {project.description}</p>
        <p><strong>Created by:</strong> {project.creatorEmail}</p>
        <p><strong>Created on:</strong> {new Date(project.createdAt).toLocaleDateString()}</p>
        <p><strong>Shared with:</strong> {project.sharedWith.join(', ') || 'None'}</p>
      </div>
    </div>
  );
};

// Inline styles with the new color palette
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#2B3A67', // Deep Blue
    color: '#FFFFFF', // White text
  },
  section: {
    backgroundColor: '#3F51B5', // Indigo
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  error: {
    color: '#FF6F61', // Coral
  },
};

export default ProjectHome;