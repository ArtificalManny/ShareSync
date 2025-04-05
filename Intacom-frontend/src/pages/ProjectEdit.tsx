import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { theme } from '../styles/theme';
import './ProjectEdit.css';

interface Project {
  _id: string;
  name: string;
  description: string;
  color: string;
  sharedWith: { userId: string; role: string }[];
}

function ProjectEdit() {
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState<Project>({
    _id: '',
    name: '',
    description: '',
    color: theme.colors.primary,
    sharedWith: [],
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/by-id/${id}`);
        setFormData(response.data);
      } catch (error: any) {
        console.error('Error fetching project:', error);
        setError('Failed to load project data.');
      }
    };
    fetchProject();
  }, [id]);

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
      await axios.put(`${import.meta.env.VITE_API_URL}/projects/${id}`, formData);
      navigate(`/project/${id}`);
      alert('Project updated successfully!');
    } catch (error: any) {
      console.error('Error updating project:', error);
      setError(error.response?.data?.message || 'Failed to update project. Please try again.');
    }
  };

  return (
    <div className="project-edit">
      <h1 style={{ color: theme.colors.primary }}>Edit Project</h1>
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
          Update
        </button>
      </form>
      {error && <p className="error" style={{ color: theme.colors.error }}>{error}</p>}
    </div>
  );
}

export default ProjectEdit;