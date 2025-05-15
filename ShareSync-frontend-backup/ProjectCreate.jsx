import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../utils/api';

const ProjectCreate = ({ user }) => {
  const navigate = useNavigate();
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    category: 'Personal',
    status: 'Active',
    admins: [user?.id],
    sharedWith: [],
    announcement: '',
    snapshot: '',
  });
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    setNewProject({ ...newProject, [e.target.name]: e.target.value });
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await createProject(newProject);
      navigate('/projects', { state: { user } });
    } catch (err) {
      console.error('Create project error:', err.message);
      setError('Failed to create project. Please try again.');
    }
  };

  if (!user) {
    return <div className="text-white text-center mt-10">User not authenticated. Please log in.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-display text-vibrant-pink mb-6 animate-fade-in">Create a New Project</h2>
      {error && (
        <div className="bg-red-500 text-white p-3 rounded-lg mb-6 animate-shimmer">
          {error}
        </div>
      )}

      <div className="card glassmorphic animate-fade-in">
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-white mb-2 font-medium">Title</label>
            <input
              type="text"
              name="title"
              value={newProject.title}
              onChange={handleInputChange}
              required
              className="w-full p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
              placeholder="Enter project title"
            />
          </div>
          <div>
            <label className="block text-white mb-2 font-medium">Description</label>
            <textarea
              name="description"
              value={newProject.description}
              onChange={handleInputChange}
              required
              className="w-full p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all h-32"
              placeholder="Enter project description"
            />
          </div>
          <div>
            <label className="block text-white mb-2 font-medium">Category</label>
            <select
              name="category"
              value={newProject.category}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
            >
              <option value="Personal">Personal</option>
              <option value="Work">Work</option>
              <option value="Collaboration">Collaboration</option>
            </select>
          </div>
          <div>
            <label className="block text-white mb-2 font-medium">Status</label>
            <select
              name="status"
              value={newProject.status}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
            >
              <option value="Active">Active</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="flex space-x-3">
            <button type="submit" className="btn-primary w-full neumorphic hover:scale-105 transition-transform animate-pulse-glow">
              Create Project
            </button>
            <button
              onClick={() => navigate('/projects', { state: { user } })}
              className="btn-secondary w-full neumorphic hover:scale-105 transition-transform"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectCreate;