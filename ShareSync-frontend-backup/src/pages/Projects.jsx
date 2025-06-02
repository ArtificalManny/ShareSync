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

  console.log('Projects.jsx - Rendering, isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', user, 'authError:', authError);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError('');
    console.log('Projects - Submitting create project form, title:', title);

    if (!title.trim()) {
      setError('Project title is required.');
      console.log('Projects - Error: Project title is required');
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
      console.log('Projects - Project created, navigating to:', `/projects/${newProject.id}`);
      navigate(`/projects/${newProject.id}`);
    } catch (err) {
      setError('Failed to create project: ' + (err.message || 'Please try again.'));
      console.error('Projects - Failed to create project:', err);
    }
  };

  if (isLoading) {
    console.log('Projects - Rendering loading state');
    return (
      <div className="projects-container flex items-center justify-center min-h-screen">
        <div className="loader" aria-label="Loading projects"></div>
        <span className="text-coral-pink text-xl font-poppins ml-4">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('Projects - Not authenticated, redirecting to login');
    navigate('/login', { replace: true });
    return null;
  }

  if (authError) {
    console.log('Projects - Rendering auth error state:', authError);
    return (
      <div className="projects-container flex items-center justify-center min-h-screen">
        <p className="text-red-500 text-lg font-poppins">{authError}</p>
      </div>
    );
  }

  if (!user) {
    console.log('Projects - No user data, rendering fallback');
    return (
      <div className="projects-container flex items-center justify-center min-h-screen">
        <p className="text-deep-teal text-lg font-poppins">Unable to load user data. Please try logging in again.</p>
      </div>
    );
  }

  console.log('Projects - Rendering main content for user:', user.email);
  return (
    <div className="projects-container">
      <div className="projects-header py-8 px-6 rounded-b-3xl text-center">
        <h1 className="text-4xl font-poppins font-bold text-coral-pink mb-4 animate-text-glow">Your Projects</h1>
        <p className="text-deep-teal text-lg font-poppins mb-4">Manage and collaborate on your projects.</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {error && <p className="text-red-500 mb-4 text-center font-poppins">{error}</p>}
        <form onSubmit={handleCreateProject} className="mb-8 card p-6 glassmorphic">
          <h2 className="text-2xl font-poppins font-semibold text-coral-pink mb-4 flex items-center">
            <Plus className="w-5 h-5 mr-2 text-golden-yellow animate-pulse" aria-hidden="true" /> Create New Project
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-deep-teal mb-2 font-poppins">Project Title</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-golden-yellow"
                placeholder="Enter project title"
                aria-label="Project Title"
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-deep-teal mb-2 font-poppins">Category</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-golden-yellow"
                aria-label="Project Category"
              >
                <option value="Personal">Personal</option>
                <option value="School">School</option>
                <option value="Job">Job</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="description" className="block text-deep-teal mb-2 font-poppins">Description (optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-golden-yellow"
              placeholder="Enter project description"
              rows="3"
              aria-label="Project Description"
            ></textarea>
          </div>
          <button
            type="submit"
            className="btn-primary mt-4 rounded-full flex items-center animate-glow focus:outline-none focus:ring-2 focus:ring-golden-yellow"
            aria-label="Create Project"
          >
            <Plus className="w-5 h-5 mr-2" aria-hidden="true" /> Create Project
          </button>
        </form>

        <div className="projects-list">
          <h2 className="text-2xl font-poppins font-semibold text-coral-pink mb-4 flex items-center">
            <Folder className="w-5 h-5 mr-2 text-golden-yellow animate-pulse" aria-hidden="true" /> All Projects
          </h2>
          {(user.projects || []).length === 0 ? (
            <p className="text-deep-teal flex items-center gap-2 font-poppins">
              <AlertCircle className="w-5 h-5 text-golden-yellow animate-pulse" aria-hidden="true" /> No projects yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(user.projects || []).map(project => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="project-card card p-4 glassmorphic holographic-effect shadow-md focus:outline-none focus:ring-2 focus:ring-golden-yellow animate-fade-in"
                  aria-label={`View project ${project.title}`}
                >
                  <h3 className="text-lg font-poppins font-bold text-coral-pink">{project.title || 'Untitled Project'}</h3>
                  <p className="text-deep-teal text-sm mb-1 font-poppins">{project.description || 'No description'}</p>
                  <p className="text-deep-teal text-sm font-poppins">Category: {project.category || 'Unknown'}</p>
                  <p className="text-deep-teal text-sm font-poppins">Status: {project.status || 'Not Started'}</p>
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