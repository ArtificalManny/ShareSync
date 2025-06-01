import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Folder, Plus, AlertCircle } from 'lucide-react';
import './Projects.css';

const Projects = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, authError, addProject } = useContext(AuthContext);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Personal');
  const [error, setError] = useState('');

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Project title is required.');
      return;
    }

    try {
      const projectData = {
        title,
        description,
        category,
        status: 'Not Started',
      };
      const newProject = await addProject(projectData);
      if (!newProject || !newProject.id) {
        throw new Error('Project creation failed: No project ID returned.');
      }
      setTitle('');
      setDescription('');
      setCategory('Personal');
      navigate(`/projects/${newProject.id}`);
    } catch (err) {
      setError('Failed to create project: ' + (err.message || 'Please try again.'));
      console.error('Projects - Failed to create project:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="projects-container flex items-center justify-center min-h-screen">
        <div className="loader" aria-label="Loading projects"></div>
        <span className="text-holo-blue text-xl font-inter ml-4">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate('/login', { replace: true });
    return null;
  }

  if (authError) {
    return (
      <div className="projects-container flex items-center justify-center min-h-screen">
        <p className="text-red-500 text-lg font-inter">{authError}</p>
      </div>
    );
  }

  return (
    <div className="projects-container">
      <div className="projects-header py-8 px-6 rounded-b-3xl text-center">
        <h1 className="text-4xl font-inter text-holo-blue mb-4 animate-text-glow">Your Projects</h1>
        <p className="text-holo-gray text-lg font-inter mb-4">Manage and collaborate on your projects.</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <form onSubmit={handleCreateProject} className="mb-8 card p-6 glassmorphic">
          <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
            <Plus className="w-5 h-5 mr-2 text-holo-pink animate-pulse" aria-hidden="true" /> Create New Project
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-holo-gray mb-2">Project Title</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-blue"
                placeholder="Enter project title"
                aria-label="Project Title"
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-holo-gray mb-2">Category</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-blue"
                aria-label="Project Category"
              >
                <option value="Personal">Personal</option>
                <option value="School">School</option>
                <option value="Job">Job</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="description" className="block text-holo-gray mb-2">Description (optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-blue"
              placeholder="Enter project description"
              rows="3"
              aria-label="Project Description"
            ></textarea>
          </div>
          <button
            type="submit"
            className="btn-primary mt-4 rounded-full flex items-center animate-glow focus:outline-none focus:ring-2 focus:ring-holo-blue"
            aria-label="Create Project"
          >
            <Plus className="w-5 h-5 mr-2" aria-hidden="true" /> Create Project
          </button>
        </form>

        <div className="projects-list">
          <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
            <Folder className="w-5 h-5 mr-2 text-holo-pink animate-pulse" aria-hidden="true" /> All Projects
          </h2>
          {user.projects.length === 0 ? (
            <p className="text-holo-gray flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" aria-hidden="true" /> No projects yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {user.projects.map(project => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="project-card card p-4 glassmorphic holographic-effect shadow-md focus:outline-none focus:ring-2 focus:ring-holo-blue animate-fade-in"
                  aria-label={`View project ${project.title}`}
                >
                  <h3 className="text-lg font-inter text-holo-blue font-bold">{project.title}</h3>
                  <p className="text-holo-gray text-sm mb-1">{project.description}</p>
                  <p className="text-holo-gray text-sm">Category: {project.category}</p>
                  <p className="text-holo-gray text-sm">Status: {project.status}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Projects;