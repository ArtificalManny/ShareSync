import React, { useState, FormEvent } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { theme } from '../styles/theme';

interface User {
  _id: string;
}

interface ProjectCreateProps {
  user: User | null;
}

const ProjectCreate: React.FC<ProjectCreateProps> = ({ user }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/projects`, {
        name,
        description,
        owner: user._id,
      });
      navigate(`/project/${response.data.data._id}`);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  return (
    <div>
      <h1>Create New Project</h1>
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
        <button type="submit">Create Project</button>
      </form>
    </div>
  );
};

export default ProjectCreate;