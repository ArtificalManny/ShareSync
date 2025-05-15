import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects, createProject } from '../utils/api';

const Projects = ({ user }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
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
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log('Fetching projects...');
        const projectList = await getProjects();
        console.log('Projects:', projectList);
        setProjects(projectList);
      } catch (err) {
        console.error('Failed to fetch projects:', err.message);
        setError(`Failed to load projects: ${err.message}. Please try again later.`);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleInputChange = (e) => {
    setNewProject({ ...newProject, [e.target.name]: e.target.value });
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const createdProject = await createProject(newProject);
      setProjects([...projects, createdProject]);
      setNewProject({
        title: '',
        description: '',
        category: 'Personal',
        status: 'Active',
        admins: [user?.id],
        sharedWith: [],
        announcement: '',
        snapshot: '',
      });
      setShowCreateForm(false);
    } catch (err) {
      console.error('Create project error:', err.message);
      setError('Failed to create project. Please try again.');
    }
  };

  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}`, { state: { user } }); // Pass user via navigation state
  };

  if (!user) {
    return <div className="text-white text-center mt-10">User not authenticated. Please log in.</div>;
  }

  if (loading) {
    return <div className="text-white text-center mt-10 animate-shimmer">Loading...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-display text-vibrant-pink mb-6 animate-fade-in">Your Projects</h2>
      {error && (
        <div className="bg-red-500 text-white p-3 rounded-lg mb-6 animate-shimmer">
          {error}
        </div>
      )}

      <div className="mb-8">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary neumorphic hover:scale-105 transition-transform"
        >
          {showCreateForm ? 'Cancel' : 'Create New Project'}
        </button>
      </div>

      {showCreateForm && (
        <div className="card glassmorphic mb-8 animate-fade-in">
          <h3 className="text-xl font-display text-vibrant-pink mb-4">Create a New Project</h3>
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
                <option value="Inactive">Inactive</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <button type="submit" className="btn-primary w-full neumorphic hover:scale-105 transition-transform">
              Create Project
            </button>
          </form>
        </div>
      )}

      <div className="card glassmorphic animate-fade-in">
        <h3 className="text-xl font-display text-vibrant-pink mb-4">Project List</h3>
        {projects.length === 0 ? (
          <p className="text-white">No projects yet.</p>
        ) : (
          <div className="space-y-4">
            {projects.map(project => (
              <div
                key={project._id}
                className="card glassmorphic transform hover:scale-105 transition-transform cursor-pointer"
                onClick={() => handleProjectClick(project._id)}
              >
                <h4 className="text-lg font-display text-vibrant-pink">{project.title}</h4>
                <p className="text-gray-300 mt-2">{project.description}</p>
                <p className="text-sm text-white mt-2">Status: {project.status}</p>
                <p className="text-sm text-white">Category: {project.category}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;