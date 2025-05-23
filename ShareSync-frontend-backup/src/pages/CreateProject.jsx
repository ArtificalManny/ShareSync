import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createProject } from '../services/auth';
import './CreateProject.css';

const CreateProject = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('Not Started');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const accessToken = localStorage.getItem('access_token');
      console.log('CreateProject - Access token:', accessToken);
      await createProject(title, description, category, status);
      navigate('/projects');
    } catch (err) {
      setError('Failed to create project: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="create-project-container">
      <div className="create-project-card card">
        <h1>Create a New Project</h1>
        {error && (
          <div>
            <p className="text-secondary error">{error}</p>
            {(error.includes('No access token found') || error.includes('Invalid token')) && (
              <p className="text-secondary">
                Please <Link to="/login">log in</Link> to create a project.
              </p>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Project Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
          ></textarea>
          <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
          <button type="submit" className="btn-primary">Create Project</button>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;