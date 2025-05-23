import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../services/auth';
import './CreateProject.css';

const CreateProject = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('School');
  const [status, setStatus] = useState('In Progress');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createProject(title, description, category, status);
      navigate('/projects');
    } catch (err) {
      setError('Failed to create project: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-project-container">
      <div className="create-project-card card">
        <h1>Create a New Project</h1>
        {error && <p className="text-error">{error}</p>}
        {loading ? (
          <p className="text-secondary">Creating project...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Project Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={loading}
            />
            <textarea
              placeholder="Project Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={loading}
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
            >
              <option value="School">School</option>
              <option value="Work">Job</option>
              <option value="Personal">Personal</option>
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading}
            >
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
            <button type="submit" disabled={loading} className="btn-primary">
              Create Project
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateProject;