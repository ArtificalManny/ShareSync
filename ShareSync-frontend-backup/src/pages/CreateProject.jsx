import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createProject } from '../utils/api';

const CreateProject = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialTitle = location.state?.title || '';
  const [formData, setFormData] = useState({
    title: initialTitle,
    description: '',
    category: 'School',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      console.log('Creating project with data:', formData);
      const response = await createProject(formData);
      console.log('Create project response:', response);
      navigate('/projects');
    } catch (err) {
      setError(`Failed to create project: ${err.message}. Please ensure the backend supports project creation at /api/projects (POST).`);
      console.error('Create project error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="card animate-fade-in">
        <h1 className="text-3xl font-display text-vibrant-pink mb-6 text-center">Create New Project</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-white mb-2">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className="mb-4">
            <label className="block text-white mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className="mb-4">
            <label className="block text-white mb-2">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="School">School</option>
              <option value="Job">Job</option>
              <option value="Personal">Personal</option>
            </select>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;