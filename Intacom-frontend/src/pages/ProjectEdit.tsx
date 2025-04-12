import React, { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { theme } from '../styles/theme';

interface Project {
  _id: string;
  name: string;
  description: string;
}

interface User {
  _id: string;
  username: string;
}

const ProjectEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const fetchProject = async () => {
    if (!id) return;
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/by-id/${id}`);
      const projectData: Project = response.data.data;
      setProject(projectData);
      setName(projectData.name);
      setDescription(projectData.description);
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) throw new Error('User not logged in');
      const user = JSON.parse(storedUser) as User;
      await axios.put(`${import.meta.env.VITE_API_URL}/projects/${id}`, {
        name,
        description,
      });
      navigate(`/project/${id}`);
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  if (!project) return <div>Loading...</div>;

  return (
    <div>
      <h1>Edit Project</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <textarea
          placeholder="Project Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
};

export default ProjectEdit;