import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { theme } from '../styles/theme';
import './ProjectCreate.css';

interface Project {
  name: string;
  description: string;
  color: string;
  sharedWith: { userId: string; role: string }[];
}

function ProjectCreate() {
  const [formData, setFormData] = useState<Project>({
    name: '',
    description: '',
    color: theme.colors.primary,
    sharedWith: [],
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleShareWithChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData({
      ...formData,
      sharedWith: email ? [{ userId: email, role: 'viewer' }] : [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/projects`, {
        ...formData,
        admin: user._id,
      });
      navigate(`/project/${response.data.data._id}`);
      alert('Project created successfully!');
    } catch (error: any) {
      console.error('Error creating project:', error);
      setError(error.response?.data?.message || 'Failed to create project. Please try again.');
    }
  };

  return (
    <div className="project-create">
      <h1 style={{ color: theme.colors.primary }}>Create Project</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Project Name"
          value={formData.name}
          onChange={handleChange}
        />
        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
        />
        <input
          type="color"
          name="color"
          value={formData.color}
          onChange={handleChange}
        />
        <input
          type="text"
          placeholder="Share with (email)"
          onChange={handleShareWithChange}
        />
        <button type="submit" style={{ backgroundColor: theme.colors.accent, color: theme.colors.text }}>
          Create
        </button>
      </form>
      {error && <p className="error" style={{ color: theme.colors.error }}>{error}</p>}
    </div>
  );
}

export default ProjectCreate;