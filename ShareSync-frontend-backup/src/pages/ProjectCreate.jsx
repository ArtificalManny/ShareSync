import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Added Link import
import { AuthContext } from '../AuthContext';
import './ProjectCreate.css';

const ProjectCreate = () => {
  const { user, isAuthenticated, createProject } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    status: 'Not Started',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError('Please log in to create a project.');
      return;
    }
    try {
      await createProject(formData);
      navigate('/projects');
    } catch (err) {
      setError('Failed to create project: ' + err.message);
    }
  };

  return (
    <div className="project-create-container">
      <h1 className="text-3xl font-inter text-primary mb-6">Create a New Project</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="bg-glass p-6 rounded-lg shadow-soft max-w-lg mx-auto">
        <div className="space-y-4">
          <div>
            <label className="text-primary block mb-1">Project Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input-field w-full"
              placeholder="Enter project title"
              required
            />
          </div>
          <div>
            <label className="text-primary block mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input-field w-full"
              placeholder="Enter project description"
              rows="4"
            />
          </div>
          <div>
            <label className="text-primary block mb-1">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input-field w-full"
              required
            >
              <option value="">Select a category</option>
              <option value="Job">Job</option>
              <option value="Personal">Personal</option>
              <option value="Event">Event</option>
            </select>
          </div>
          <div>
            <label className="text-primary block mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="input-field w-full"
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="flex gap-4">
            <button onClick={handleSubmit} className="btn-primary">Create Project</button>
            <Link to="/projects">
              <button className="btn-secondary">Cancel</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCreate;