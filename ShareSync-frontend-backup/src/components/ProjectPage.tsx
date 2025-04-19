import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

interface Project {
  _id: string;
  name: string;
  description: string;
}

const ProjectPage = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(`${API_URL}/projects/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setProject(response.data);
      } catch (err) {
        console.error('Failed to fetch project:', err);
      }
    };
    fetchProject();
  }, [id]);

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>{project.name}</h2>
      <p>{project.description}</p>
    </div>
  );
};

export default ProjectPage;